library(tidyverse)

# df <- read_csv("public/filtering.csv")
df <- read_csv2("public/technologies_excel.csv")

# Id is sub-type without special characters, only dashes and underscores
df$id <- df$sub_type
df$id <- str_replace_all(df$id, "\\+", "\\-")
df$id <- str_replace_all(df$id, "\\/", "\\-")

# Replace facotrs by binaries
df <- df |>
  mutate(across(8:19, ~ case_match(
    .x,
    "active" ~ 1,
    "inactive" ~ 0,
    "possible" ~ 1,
    .default =  NA
  )))

# Chech if there is any NA
stopifnot(!anyNA(df[,8:19]))

# Convert factors to likert scales
df <- df |>
  mutate(across(energy:inv_es_biohazard, ~ case_match(
    .x,
    "inactive" ~ 0,
    "N" ~ 0,
    "Y" ~ 1,
    "L" ~ 1,
    "M" ~ 2,
    "H" ~ 3,
    .default = NA
    ))
  )

# Check if these were already created
stopifnot(!any(c("camping_wastewater", "offices_wastewater") %in% names(df)))

# If not create them
df <- df |>
  mutate(camping_wastewater = raw_domestic_wastewater, .after = river_diluted_wastewater) |>
  mutate(offices_wastewater = raw_domestic_wastewater, .after = river_diluted_wastewater)

# Calculate dbo_treated/m2 and round to .0 or to .5

stopifnot(!any(str_detect(names(df), "dbo_treated")))

df <- df |>
  mutate(
    across(
      starts_with("ratio_"),
                ~ plyr::round_any(60 / .x, accuracy = 0.5),
                .names = "dbo_treated_{str_remove(.col, 'ratio_')}"
    ),
    .after = ratio_continental_climate
  )


# Check for NA
which(sapply(df, anyNA))



write_csv(df, "public/technologies.csv")
