library(tidyverse)
library(httr2)
library(DBI)
library(jsonlite)

con <- dbConnect(RSQLite::SQLite(), dbname = "public/multisource.sqlite")
con_sannat <- dbConnect(RMySQL::MySQL(),
                 host = "icra.loading.net",
                 user = Sys.getenv("SANNAT_DB_USER"),
                 password = Sys.getenv("SANNAT_DB_PASSWORD"),
                 dbname = "sannat_v2",
                 port=3306)

RSQLite::dbListTables(con)
RMySQL::dbListTables(con_sannat)

sannat <- tbl(con_sannat, "case_study")

sannat_cols <- sannat |>
  names()

sannat_source <- sannat |>
  select(doc_data) |>
  collect() |>
  mutate(doc_data = map(doc_data, jsonlite::fromJSON)) |>
  slice(1) |>
  unnest_wider(doc_data) |>
  names()


# Database transformation to SANNAT ---------------------------------------------------------------------

concentrations <- tbl(con, "concentrations") |>
  select(starts_with("id"), concentration_in = in_mean_value, concentration_out = out_mean_value)


sampling <- tbl(con, "sampling_conditions") |>
  mutate(in_water_temperature = if_else(in_water_temperature == "",
                                        NA_real_,
                                        as.numeric(in_water_temperature))) |>
  mutate(air_temperature = if_else(air_temperature == "",
                                        NA_real_,
                                        as.numeric(air_temperature))) |>
  select(starts_with("id_"), water_temp = in_water_temperature, air_temp = air_temperature) |>
  left_join(concentrations, by = "id_sampling", multiple = "all")

operation <- tbl(con, "operational_conditions") |>
  mutate(year_operation = if_else(year_operation == "", NA_integer_, as.integer(year_operation))) |>
  select(starts_with("id"), hrt = hydraulic_retention_time, inflow = inflow_rate, year_operation) |>
  left_join(sampling, by = "id_operation", multiple = "all")

nbs_tu <- tbl(con, "NBS_TU") |>
  # adapt the types to SNAPP sub-types
  mutate(type_excel = case_when(
    type == "HSSF" ~ "HSSF_CW",
    type == "FWS" ~ "FWS_CW",
    type == "VSSF" ~ "VSSF_CW",
    TRUE ~ type
  )) |>
  select(id_NBS_TU, id_NBS, sub_type = type, surface = total_surface) |>
  left_join(operation, by = "id_NBS_TU", multiple = "all")


# Water types not in Sannat
nbs <- tbl(con, "treatment_plant") |>
  select(id_source, id_NBS, water_type) |>
  left_join(nbs_tu, by = "id_NBS", multiple = "all") |>
  collect() |>
  mutate(across(c(hrt, inflow, concentration_out), ~ if_else(.x == 0, NA, .x)))

source_sannat <- tbl(con, "source") |>
  filter(doc_type == "") |>
  mutate(doc_data = title) |>
  select(id_source, doc_data) |>
  collect()

source_sophie <- tbl(con, "source") |>
  filter(doc_type != "") |>
  collect() |>
  rowwise() |>
  mutate(doc_data = toJSON(across(-id_source), auto_unbox = TRUE)) |>
  ungroup() |>
  select(id_source, doc_data) |>
  mutate(doc_data = str_replace(doc_data, "\\[\\{", "{")) |>
  mutate(doc_data = str_replace(doc_data, "\\}\\]", "}")) |>
  mutate(check = map(doc_data, fromJSON)) |>
  select(-check)

source_df <- bind_rows(source_sophie, source_sannat)


# Final DB ----------------------------------------------------------------------------------------------

final_db <- nbs |>
  left_join(source_df, by = "id_source", multiple = "all")

sannat_pollutants <- c("bod", "tn", "cod", "no3", "nh4", "tp", "po43")

wider_db <- final_db |>
  mutate(pollutants = str_to_lower(id_param), .after = id_param) |>
  # convert concentrations
  mutate(across(c(concentration_in, concentration_out), ~ case_when(
    pollutants == "nh4-n" ~ .x * 1.28786,
    pollutants == "no3-n" ~ .x * 4.42664,
    pollutants == "nh3" ~ .x * 1.059,
    pollutants == "nh3-n" ~ .x * 1.21589 * 1.059,
    pollutants == "po4-p" ~ .x * 3.28443,
    TRUE ~ .x
  ))) |>
  mutate(pollutants = case_when(
    pollutants == "bod5" ~ "bod",
    pollutants == "nh3-n" ~ "nh4",
    TRUE ~ pollutants
  )) |>
  mutate(pollutants = str_remove(pollutants, "\\-n")) |>
  filter(pollutants %in% sannat_pollutants) |>
  select(id_sampling, !starts_with("id_")) |>
  rename(`in` = concentration_in, out = concentration_out) |>
  pivot_wider(
              names_from = pollutants,
              values_from = c(`in`, out),
              values_fn = mean,
              names_glue = "{pollutants}_{.value}"
              )

all_df <- sannat |>
  collect() |>
  bind_rows(wider_db) |>
  mutate(id = row_number()) |>
  mutate(year_publication = as.integer(map_chr(doc_data, ~ fromJSON(.x)$year))) |>
  mutate(year_operation = if_else(is.na(year_operation), year_publication, year_operation)) |>
  select(-year_publication)

copy_to(con, all_df, overwrite = TRUE, temporary = FALSE)


