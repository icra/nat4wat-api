library(tidyverse)
library(httr2)

url <- "https://multisource.icradev.cat/multisource"
save_as <- "multisource.sqlite"

#Download from URL
response <- GET(url)
content <- content(response, as = "raw")

#Save to file
writeBin(content, save_as)
