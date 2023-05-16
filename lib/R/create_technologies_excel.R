library(tidyverse)

read_csv("public/filtering.csv") |>
  write_excel_csv2("public/technologies_excel.csv")


