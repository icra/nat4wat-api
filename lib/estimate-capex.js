const pl = require('nodejs-polars')

const estimateCapex = function (df) {

    if(df.columns.includes("vertical_surface_high")){
        df = df.withColumns(
            pl.col("capex_high").mul(pl.col("surface_high").add(pl.col("vertical_surface_high"))).alias("estimated_capex_high"),
            pl.col("capex_low").mul(pl.col("surface_low").add(pl.col("vertical_surface_low"))).alias("estimated_capex_low")
        ).withColumns(
            pl.col("estimated_capex_high").add(pl.col("estimated_capex_low")).divideBy(2).alias("estimated_capex_mean")
        )
    } else {
        df = df.withColumns(
            pl.col("capex_high").mul(pl.col("surface_high")).alias("estimated_capex_high"),
            pl.col("capex_low").mul(pl.col("surface_low")).alias("estimated_capex_low")
        ).withColumns(
            pl.col("estimated_capex_high").add(pl.col("estimated_capex_low")).divideBy(2).alias("estimated_capex_mean")
        )
    }


    return df
}

module.exports = {
    estimateCapex
}