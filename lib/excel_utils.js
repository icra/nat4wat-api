const pl = require("nodejs-polars")

let readTechnologiesExcel = function(id, records = true){
    let df = pl.readCSV("public/technologies.csv", {nullValues: ["NA", "N/A", "null", "NULL", ""]})
    df = df.dropNulls("id")

    if (id){
        df = df.filter(pl.col("id").eq(pl.lit(id)))
        if (df.shape.height < 1) return {error: "id does not correspond with any technology"}
    }
    if (records) return df.toRecords()
    return df
}

module.exports = {
    readTechnologiesExcel: readTechnologiesExcel
}