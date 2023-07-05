const pl = require("nodejs-polars")

let read_excel = function(id){
    let df = pl.readCSV("public/technologies.csv")
    df = df.dropNulls("id")

    if (id){
        df = df.filter(pl.col("id").eq(pl.lit(id)))
        if (df.shape.height < 1) return null
    }
    console.log(df)
    return df.toRecords()
}

module.exports = {
    read_excel
}