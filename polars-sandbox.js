const pl = require("nodejs-polars");

let df = pl.DataFrame({
    A: [1, 2, 3, 4, 5]
})

const value = 2

// df = df.withColumn(pl.col("A").mul(2) | pl.Series("C"))

df = df.withColumn(pl.col("A").mul(value).alias("B"))

console.log(df)