library(httr2)

url <- "https://multisource.icradev.cat/multisource"
save_as <- "public/multisource.sqlite"

#Download from URL
response <- request(url) |>
  req_perform()
content <- resp_body_raw(response)

#Save to file
writeBin(content, save_as)
