library(tidyverse)
library(DBI)
library(tidymodels)
library(furrr)
library(mice, warn.conflicts = FALSE)

plan("future::multisession")

con <- dbConnect(RSQLite::SQLite(), dbname = "public/multisource.sqlite")
df <- tbl(con, "all_df") |>
  collect()

df |> write_csv2("public/sci_case_studies.csv")

dbDisconnect(con)

# Define functions --------------------------------------------------------------------------------------

prepare_data <- function(tech, poll, .data){
  filtered <- .data |>
    filter(sub_type == tech) |>
    select(surface, inflow,
           poll_in = paste0(poll, "_in"),
           poll_out = paste0(poll, "_out"),
           air_temp,
           year_operation) |>
    filter(!is.na(surface), !is.na(poll_in), !is.na(poll_out), !is.na(inflow)) |>
    mutate(load_in = inflow * poll_in,
           load_out = inflow * poll_out,
           load_removal = load_in - load_out,
           load_ratio = load_in / load_out)

  if(nrow(filtered) < 5) return(tibble(tech = tech, poll = poll,
                                       no_model = "Less than five observations"))
  if(any(map_dbl(filtered[,1:3], sd, na.rm = TRUE) == 0)) return(tibble(tech = tech, poll = poll,
                                                    no_model = "Some variable is constant"))

  if(!all(map_lgl(filtered[c("load_removal", "load_ratio")], \(x) all(is.finite(x)))))
    return(tibble(tech = tech, poll = poll, no_model = "There are infinte values"))

  filtered |>
    mutate(tech = tech, poll = poll)

}

fit_tech_poll <- function(tech, poll, .data){

  df_filtered <- prepare_data(tech, poll, .data = .data)

  if("no_model" %in% names(df_filtered)) return(df_filtered)

  n_samples <- min(10, nrow(df_filtered)-2)

  cv_samples <- vfold_cv(df_filtered, v=n_samples, repeats = 4)

  lm_mod <- linear_reg(mode = "regression") |>
    set_engine("lm")

  linear_recipe1 <- recipe(surface ~ load_removal + air_temp + year_operation, data = df_filtered)

  linear_recipe2 <- linear_recipe1 |>
    step_rm(year_operation)

  linear_recipe3 <- linear_recipe1 |>
    step_rm(air_temp)

  linear_recipe4 <- linear_recipe2 |>
    step_rm(air_temp)

  exp_recipe1 <- recipe(surface ~ load_ratio + air_temp + year_operation, data = df_filtered) |>
    step_log(load_ratio)

  exp_recipe2 <- exp_recipe1 |>
    step_rm(year_operation)

  exp_recipe3 <- exp_recipe1 |>
    step_rm(air_temp)

  exp_recipe4 <- exp_recipe2 |>
    step_rm(air_temp)

  power_recipe1 <- linear_recipe1 |>
    step_log(everything())

  power_recipe2 <- linear_recipe2 |>
    step_log(surface, load_removal)

  power_recipe3 <- linear_recipe3 |>
    step_log(surface, load_removal)

  power_recipe4 <- linear_recipe4 |>
    step_log(surface, load_removal)

  linear_recipes <- list(linear_all = linear_recipe1,
                         linear_minusyear = linear_recipe2,
                         linear_minustemp = linear_recipe3,
                         linear_surface = linear_recipe4,
                         exp_all = exp_recipe1,
                         exp_minusyear = exp_recipe2,
                         exp_minustemp = exp_recipe3,
                         exp_surface = exp_recipe4
                         # power_all = power_recipe1,
                         # power_minusyear = power_recipe2,
                         # power_minustemp = power_recipe3,
                         # power_surface = power_recipe4
  )

  # Remove recipes with air_temp and year_operation if there are too NA or constant
  if(nrow(na.omit(df_filtered)) < 5 ||
     any(map_dbl(df_filtered[c("air_temp", "year_operation")], sd, na.rm = TRUE) == 0)) {

    linear_recipes <- linear_recipes[str_detect(names(linear_recipes), "_surface")]
  }

  linear_models <- workflow_set(linear_recipes, list(lm = linear_reg()))

  linear_models <- linear_models |>
    workflow_map(
      "fit_resamples",
      seed = 1121, verbose = FALSE,
      resamples = cv_samples
    )

  collect_metrics(linear_models) |>
    filter(.metric == "rmse") |>
    separate_wider_delim(wflow_id, delim = "_", names = c("type", "predictors", "engine")) |>
    mutate(tech = tech, poll = poll)
}

techs <- unique(df$sub_type)

polls <- names(df)[which(str_detect(names(df), "_in"))] |>
  str_remove("_in")

techs_polls <- expand_grid(techs, polls)

techs_polls_fit <- future_map2(techs_polls$techs, techs_polls$polls,
                               fit_tech_poll, .data = df,
                               .progress = TRUE,
                               .options = furrr_options(seed = T)
                               )
techs_polls_fit |>
  bind_rows() |>
  saveRDS("explore_models.rds")

# Explore results ---------------------------------------------------------------------------------------

results <- readRDS("explore_models.rds")

results |>
  mutate(predictors = case_match(predictors,
                                 "all" ~ "all",
                                 "minustemp" ~ "with year",
                                 "minusyear" ~ "with air temp",
                                 "surface" ~ "only surface",
                                 .default = NA)) |>
  filter(!is.na(predictors)) |>
  ggplot(aes(x = predictors, y = mean)) +
  geom_boxplot(aes(fill = type))+
  geom_jitter(aes(color = n))+
  ylim(0, quantile(results$mean, 0.5, na.rm = T))


results |>
  group_by(predictors, type) |>
  slice_max(mean)

prepare_data("NW", "bod", df) |>
  filter(surface <  500000) |>
  ggplot(aes(x = load_removal, y = surface)) +
  geom_point(aes(color = year_operation)) +
  geom_smooth(method = "lm", formula = y ~ x - 1)


