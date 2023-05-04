library(tidyverse)

df <- read_csv("public/filtering.csv")

df$id <- df$sub_type

df$id <- str_replace_all(df$id, "\\+", "\\-")
df$id <- str_replace_all(df$id, "\\/", "\\-")

df <- df |>
  mutate(across(8:19, ~ case_when(
    .x == "active" ~ 1,
    .x == "inactive" ~ 0,
    .x == "possible" ~ 1,
    TRUE ~ NA
  )))

stopifnot(!anyNA(df[,8:19]))

df <- df |>
  mutate(across(energy:inv_es_biohazard, ~ case_when(
    .x == "inactive" ~ 0,
    .x == "N" ~ 0,
    .x == "Y" ~ 1,
    .x == "L" ~ 1,
    .x == "M" ~ 2,
    .x == "H" ~ 3,
    TRUE ~ NA
    ))
  )

df <- df |>
  mutate(camping_wastewater = raw_domestic_wastewater, .after = river_diluted_wastewater) |>
  mutate(offices_wastewater = raw_domestic_wastewater, .after = river_diluted_wastewater)

which(sapply(df, anyNA))


write_csv(df, "public/technologies.csv")
