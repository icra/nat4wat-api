const pl = require('nodejs-polars')

const estimateCapex = function (df) {

    df = df.withColumns(
        pl.col("capex_high").mul(pl.col("surface_high")).alias("estimated_capex_high"),
        pl.col("capex_low").mul(pl.col("surface_low")).alias("estimated_capex_low")
    ).withColumns(
        pl.col("estimated_capex_high").add(pl.col("estimated_capex_low")).divideBy(2).alias("estimated_capex_mean")
    )

    return df
}

module.exports = {
    estimateCapex
}