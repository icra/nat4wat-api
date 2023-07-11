const pl = require("nodejs-polars");


const mcda = function(body){
    if(body === undefined || !body instanceof Object) return {error: "body must be an array of ids"}
    if(!(body instanceof Array)) return {error: "body must be an array of ids"}

    let df = pl.readCSV("public/technologies.csv")

    wrong_ids = body.filter(e => !df['id'].toArray().includes(e))
    if (wrong_ids.length > 0) return {error: "some ids are not valid"}

    df = df.filter(pl.col("id").isIn(body))

    // TODO: Començar a calcular scores


    return(df.toRecords())
}

module.exports = {
    mcda
}