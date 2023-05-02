const pl = require("nodejs-polars")

let read_excel = function(){
    let df = pl.readCSV("public/filtering.csv")
    df = df.dropNulls("id")
    return df.toRecords()
}

module.exports = {
    read_excel
}