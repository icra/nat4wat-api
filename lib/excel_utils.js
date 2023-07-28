const pl = require("nodejs-polars")

let readTechnologiesExcel = function(id){
    let df = pl.readCSV("public/technologies.csv")
    df = df.dropNulls("id")

    if (id){
        df = df.filter(pl.col("id").eq(pl.lit(id)))
        if (df.shape.height < 1) return {error: "id does not correspond with any technology"}
    }

    return df.toRecords()
}

module.exports = {
    readTechnologiesExcel: readTechnologiesExcel
}