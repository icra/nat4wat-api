library(tidyverse)

# df <- read_csv("public/filtering.csv")
df <- read_csv2("public/technologies_excel.csv")

# Id is sub-type without special characters, only dashes and underscores
df$id <- df$sub_type
df$id <- str_replace_all(df$id, "\\+", "\\-")
df$id <- str_replace_all(df$id, "\\/", "\\-")

df <- df |>
  mutate(vertical = case_match(
    vertical,
    "Y" ~ 1,
    "N" ~ 0,
    .default = NA
  ))

stopifnot(sum(is.na(df$vertical)) == 0)

# Replace facotrs by binaries
df <- df |>
  mutate(across(c_removal:river_diluted_wastewater, ~ case_match(
    .x,
    "active" ~ 1,
    "inactive" ~ 0,
    "possible" ~ 1,
    .default =  NA
  )))

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
                ~ 60 / .x,
                .names = "dbo_treated_{str_remove(.col, 'ratio_')}"
    ),
    .after = ratio_continental_climate
  )


# Check for NA
which(sapply(df, anyNA))



write_csv(df, "public/technologies.csv")
