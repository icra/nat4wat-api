const pl = require("nodejs-polars")

let read_excel = function(){
    let df = pl.readCSV("public/filtering.csv")
    df = df.dropNulls("id")
        .filter(
            pl.col("id").eq(pl.lit("French_CW"))
                .or(pl.col("id").eq(pl.lit("Hydroponics"))))
        .select(pl.exclude("factsheet_filenames"))


    console.log(df)
    return df.toRecords()
}

module.exports = {
    read_excel
}