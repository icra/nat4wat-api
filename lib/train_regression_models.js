const pl = require("nodejs-polars");
const MLR = require("ml-regression-multivariate-linear");
const db = require("./database");
const gl = require("./globals");
const {readTechnologiesExcel} = require("./excel_utils");
const {addRegressionModel} = require("./database");

const trainRegressionModels = async function(body){
    if (body.password !== process.env.TOKEN_PASSWORD) return {error: "Password is not correct, please contact the administrator"}

    let df = await db.dbToPolars()
    let techs = readTechnologiesExcel(id = false, records = false)
        .filter(pl.col("module").eq(pl.lit("treatment")))
    techs = techs['sub_type'].toArray()

    for (tech of techs){
        if (tech !== "HSSF_CW") continue
        for (pol of gl.polConcentrations){
            if (pol !== "bod") continue

            let polio = [pol + "_in", pol + "_out"]
            // subset technology and check if more than 5 cases
            let dfTechPol = subsetTechnology(df, tech, polio)
            if (dfTechPol.nullModel) addRegressionModel(dfTechPol)

            // compare three regressions using relative MAE (in percentage)
            var bestModel = compareRegressions(dfTechPol, polio)

            // store results to database
        }

        if (tech === "HSSF_CW") break
    }
    console.log("bestModel", bestModel)
    return {rmae: bestModel.rmae}
}

const subsetTechnology = function(df, tech, polio){
    df = df.select(["sub_type", polio[0], polio[1], "inflow", "surface"])
        .dropNulls()
        .filter(pl.col("sub_type").eq(pl.lit(tech)))
        .filter(pl.col("surface").gt(0))
        .filter(pl.col("inflow").gt(0))
        .filter(pl.col(polio[0]).gt(pl.col(polio[1])))

    console.log(df.shape)

    if (df.shape.height < 5) return {
        tech: tech,
        pol: pol,
        nullModel: "Less than 5 cases",
        n: df.shape.height
    }

    return df

}

const compareRegressions = function(df, polio){
    let linear = linearRegression(df, polio)
    let exponential = expRegression(df, polio)
    let power = powerRegression(df, polio)

    return exponential


}

const linearRegression = function(df, polio){

    df = df.withColumns(
        pl.col((polio[0])).minus(pl.col(polio[1])).mul(pl.col("inflow")).alias("load_removal"),
    )

    let x = df["load_removal"].toArray().map(e=>[e])
    let y =df["surface"].toArray().map(e=>[e])

    let mlr = new MLR(x, y, {intercept: false})
    let prediction = mlr.predict(x).map(e=>e[0])

    let rmae = calcRMAE(df, prediction)
    mlr.rmae = rmae

    return mlr
}

const expRegression = function(df, polio){
    df = df.withColumns(
        pl.col(polio[0]).divideBy(pl.col(polio[1])).alias("load_removal")
    )

    let x = df["load_removal"].toArray().map(e=>[Math.log(e)])
    let y = df["surface"].toArray().map(e=>[e])

    let mlr = new MLR(x, y, {intercept: false})
    let prediction = mlr.predict(x).map(e=>e[0])
    // console.log(prediction)

    let rmae = calcRMAE(df, prediction)
    mlr.rmae = rmae

    return mlr
}

const powerRegression = function(df){

}

const calcRMAE = function(df, prediction){
    df = df.withColumns(
        pl.Series(prediction).alias("prediction")
    ).withColumns(
        pl.col("prediction").minus(pl.col("surface")).pow(2).pow(0.5)
            .divideBy(pl.col("surface")).alias("relative_error")
    )
    return df["relative_error"].median()

}

module.exports = {
    trainRegressionModels
}






