const pl = require('nodejs-polars')

const estimateCost = function (df) {

    df = df.withColumns(
        pl.col("cost_high").mul(pl.col("surface_high")).alias("estimated_cost_high"),
        pl.col("cost_low").mul(pl.col("surface_low")).alias("estimated_cost_low")
    ).withColumns(
        pl.col("estimated_cost_high").add(pl.col("estimated_cost_low")).divideBy(2).alias("estimated_cost_mean")
    )

    return df
}

module.exports = {
    estimateCost
}