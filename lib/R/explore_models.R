library(tidyverse)
library(DBI)
library(boot)

con <- dbConnect(RSQLite::SQLite(), dbname = "public/multisource.sqlite")
df <- tbl(con, "all_df") |>
  collect()


# Define functions --------------------------------------------------------------------------------------

prepare_data <- function(tech, poll, df){
  filtered <- df |>
    filter(sub_type == tech) |>
    select(surface, inflow,
           poll_in = paste0(poll, "_in"),
           poll_out = paste0(poll, "_out"),
           air_temp,
           year_operation) |>
    stop("Cal filtrar NA de surface i pollutabnts")
    mutate(load_in = inflow * poll_in,
           load_out = inflow * poll_out,
           load_removal = load_in - load_out,
           load_ratio = load_in / load_out)

  if(nrow(filtered) < 5) return(tibble(tech = tech, poll = poll,
                                       no_model = "Less than five observations"))
  if(any(map_dbl(filtered[,1:3], sd, na.rm = TRUE) == 0)) return(tibble(tech = tech, poll = poll,
                                                    no_model = "Some variable is constant"))

  filtered |>
    mutate(tech = tech, poll = poll)

}

linear_regression <- function(df){
  if("no_model" %in% names(df)) return(df)

  load <- glm(surface ~ load_removal - 1, data = df)
  load_cv <- cv.glm(df, load)$delta[[1]]

  load_temp <- glm(surface ~ load_removal + air_temp - 1, data = df)
  load_temp_cv <- cv.glm(df, load_temp)$delta[[1]]

  load_temp_year <- glm(surface ~ load_removal + air_temp + year_operation - 1, data = df)
  load_temp_year_cv <- cv.glm(df, load_temp_year)$delta[[1]]

  tibble(
    tech = df$tech[[1]],
    poll = df$poll[[1]],
    model = "linear",
    load_cv = load_cv,
    load_temp_cv = load_temp_cv,
    load_temp__year_cv = load_temp_year_cv
  )
}

exp_regression <- function(df){
  if("no_model" %in% names(df)) return(df)

  load <- glm(surface ~ log(load_ratio - 1), data = df)
  load_cv <- cv.glm(df, load)$delta[[1]]

  load_temp <- glm(surface ~ log(load_ratio + air_temp - 1), data = df)
  load_temp_cv <- cv.glm(df, load_temp)$delta[[1]]

  load_temp_year <- glm(surface ~ log(load_ratio + air_temp + year_operation - 1), data = df)
  load_temp_year_cv <- cv.glm(df, load_temp_year)$delta[[1]]

  tibble(
    tech = df$tech[[1]],
    poll = df$poll[[1]],
    model = "exponential",
    load_cv = load_cv,
    load_temp_cv = load_temp_cv,
    load_temp__year_cv = load_temp_year_cv
  )
}

power_regression <- function(df){
  if("no_model" %in% names(df)) return(df)

  load <- glm(log10(surface) ~ log10(load_ratio), data = df)
  load_cv <- 10^(cv.glm(df, load)$delta[[1]])

  load_temp <- glm(log10(surface) ~ log10(load_ratio + air_temp), data = df)
  load_temp_cv <- 10^(cv.glm(df, load_temp)$delta[[1]])

  load_temp_year <- glm(log10(surface) ~ log10(load_ratio + air_temp + year_operation), data = df)
  load_temp_year_cv <- 10^(cv.glm(df, load_temp_year)$delta[[1]])

  tibble(
    tech = df$tech[[1]],
    poll = df$poll[[1]],
    model = "power",
    load_cv = load_cv,
    load_temp_cv = load_temp_cv,
    load_temp__year_cv = load_temp_year_cv
  )
}

fit_regressions <- function(tech, poll, df){
  reg_df <- prepare_data(tech=tech, poll=poll, df = df)

  linear_regression(reg_df) |>
    bind_rows(exp_regression(reg_df)) |>
    bind_rows(power_regression(reg_df))
}


# Prepare grid ------------------------------------------------------------------------------------------

technologies <- read_csv("public/technologies.csv") |>
  pull(sub_type)

pollutants <- tbl(con, "all_df") |>
  names()

pollutants <- pollutants[which(str_detect(pollutants, "_in"))] |>
  str_remove("_in")

tech_poll <- expand_grid(technologies, pollutants)


# Train models ------------------------------------------------------------------------------------------

models <- map2(tech_poll$technologies, tech_poll$pollutants, fit_regressions, df = df)

