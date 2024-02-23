const pl = require("nodejs-polars");
const MLR = require("ml-regression-multivariate-linear");
const db = require("./database")
const gl = require("./globals");
const {readTechnologiesExcel} = require("./excel_utils");
const {addRegressionModel} = require("./database");

const trainRegressionModels = async function(body){
    if (body.password !== process.env.TOKEN_PASSWORD) return {error: "Password is not correct, please contact the administrator"}

    let df = await db.sciStudiesToPolars()
    let techs = readTechnologiesExcel(id = false, records = false)
        .filter(pl.col("module").eq(pl.lit("treatment")))
    techs = techs['sub_type'].toArray()

    let total_iterations = techs.length * gl.polConcentrations.length
    let i = 0
    let progress = 0

    for (tech of techs){
        for (pol of gl.polConcentrations){
            i = i + 1
            progress = Math.round(i / total_iterations * 100)
            if (progress % 5 === 0) console.log(progress + "%")
            let model = {}
            model.pol = pol
            model.tech = tech

            let polio = [pol + "_in", pol + "_out"]
            // subset technology and check if more than 5 cases
            let dfTechPol = subsetTechnology(df, tech, polio)

            model.n = dfTechPol.shape.height
            model.min_load_in = dfTechPol["load_in"].min()
            model.max_load_in = dfTechPol["load_in"].max()

            if (model.n < 5){
                model.null_model = "less than 5 cases"
                await addRegressionModel(model)
                continue
            }

            // compare three regressions using relative MAE (in percentage)
            let bestModel = compareRegressions(dfTechPol, polio)

            model.type = bestModel.type
            model.RMAE = bestModel.rmae
            model.intercept = bestModel.type === "power" ? bestModel.weights[1][0] : 0
            model.beta_load_removal = bestModel.weights[0][0]
            model.std_error = bestModel.stdError

            if (bestModel.rmae > 0.25) {
                model.null_model = "rmae > 25%"
                model.intercept = null
                model.beta_load_removal = null
            }
            await addRegressionModel(model)
        }
    }

    return {message: "Models trained"}
}

const subsetTechnology = function(df, tech, polio){
    df = df.select(["sub_type", polio[0], polio[1], "inflow", "surface"])
        .dropNulls()
        .filter(pl.col("sub_type").eq(pl.lit(tech)))
        .filter(pl.col("surface").gt(0))
        .filter(pl.col("inflow").gt(0))
        .filter(pl.col(polio[0]).gt(pl.col(polio[1])))
        .withColumns(
            pl.col(polio[0]).mul(pl.col("inflow")).alias("load_in")
        )
    // console.log(df)
    return df

}

const compareRegressions = function(df, polio){
    let linear = linearRegression(df, polio)
    let exponential = expRegression(df, polio)
    let power = powerRegression(df, polio)

    let models = [linear, exponential, power]
    let min = Math.min(...models.map(item => item.rmae))
    let bestModel = models.filter(item => item.rmae === min)

    return bestModel[0]
}

const linearRegression = function(df, polio){

    df = df.withColumns(
        pl.col((polio[0])).minus(pl.col(polio[1])).mul(pl.col("inflow")).alias("load_removal"),
    )
    // load removal is in mg because inflow is in litres
    let x = df["load_removal"].toArray().map(e=>[e])
    let y =df["surface"].toArray().map(e=>[e])

    let mlr = new MLR(x, y, {intercept: false})
    let prediction = mlr.predict(x).map(e=>e[0])
    mlr.type = "linear"
    mlr.rmae = calcRMAE(df, prediction)

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

    mlr.type = "exponential"
    mlr.rmae = calcRMAE(df, prediction)

    return mlr
}

const powerRegression = function(df, polio){
    df = df.withColumns(
        pl.col((polio[0])).minus(pl.col(polio[1])).mul(pl.col("inflow")).alias("load_removal"),
    )

    let x = df["load_removal"].toArray().map(e=>[Math.log10(e)])
    let y =df["surface"].toArray().map(e=>[Math.log10(e)])

    let mlr = new MLR(x, y, {intercept: true})

    // if slope is negative, reject the model by setting rmae to infinity
    if (mlr.weights[0] <= 0) {
        mlr.rmae = Infinity
        return mlr
    }

    let prediction = mlr.predict(x).map(e=>Math.pow(10, e[0]))

    mlr.type = "power"
    mlr.rmae = calcRMAE(df, prediction)

    return mlr
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






