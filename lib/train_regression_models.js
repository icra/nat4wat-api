const pl = require("nodejs-polars");
const db = require("./database");
const gl = require("./globals");
const {readTechnologiesExcel} = require("./excel_utils");
const {addRegressionModel} = require("./database");

const trainRegressionModels = async function(){
    let df = await db.dbToPolars()
    let techs = readTechnologiesExcel(id = false, records = false)
        .filter(pl.col("module").eq(pl.lit("treatment")))
    techs = techs['sub_type'].toArray()

    for (tech of techs){
        for (pol of gl.polConcentrations){
            // subset technology and check if more than 5 cases
            let dfTech = subsetTechnology(df, tech, pol)
            if (dfTech.nullModel) console.log( await addRegressionModel(dfTech))
            break


            // compare three regressions using relative MAE (in percentage)


            // store results to database
        }
    break
    }





    return techs
}

const subsetTechnology = function(df, tech, pol){
    let pol_in = pol + "_in"
    let pol_out = pol + "_out"
    df = df.filter(pl.col("sub_type").eq(pl.lit(tech)))
        .select(["sub_type", pol_in, pol_out, "inflow", "surface"])
    df = df.dropNulls()

    if (df.shape.height < 5) return {
        tech: tech,
        pol: pol,
        nullModel: "Less than 5 cases",
        n: df.shape.height
    }

}



module.exports = {
    trainRegressionModels
}






