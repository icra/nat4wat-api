const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")
const {estimateSurface} = require("./estimate-surface");

const findNBS = function (body){

    if(body === undefined || !body instanceof Object) return {error: "body must be an object"}
    if(body instanceof Array) return {error: "body must be an object, not an array"}

    let df = pl.readCSV("public/technologies.csv")
    df = df.dropNulls("id")

    // waterType
    if (body.waterType !== undefined) {
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}

        df = df.filter(pl.col(body.waterType).eq(1))
    } else {
        body.waterType = "any_wastewater"
    }

    // inflow in m3/day
    if (body.inflow !== undefined){
        if(!utils.isPositive(body.inflow)) return {error: "inflow must be a positive number"}
    }

    // litresPerson
    if (body.litresPerson) {
        if (!utils.isPositive(body.litresPerson)) return {error: "litresPerson must be a positive number"}
    } else {
        // use predefined value for litresPerson
        body.litresPerson = 120
    }

    // inhabitants
    if (body.inflow === undefined && body.inhabitants !== undefined) {
        if (!utils.isPositive(body.inhabitants)) return {error: "inhabitants must be a positive number"}

        // in m3/day
        body.inflow = body.inhabitants * body.litresPerson / 1000
    }

    // vertical
    if (body.vertical === false){
        df = df.filter(pl.col("vertical").eq(0))
    }

    // Available area
    if (body.area !== undefined) {
        if (!utils.isPositive(body.area)) return {error: "area must be a positive number"}
    }

    // Climate
    if (body.climate !== undefined){
        if (!gl.climate.includes(body.climate)) return {error: "climate is not in the list of accepted climates"}
    }

    if (body.avgTemperature !== undefined){
        if (isNaN(body.avgTemperature)) return {error: "avgTemperature must be a number"}
        if(!body.climate) body.climate = utils.climate(body.avgTemperature)
    }

    // if climate is not defined temperate is default
    if(!body.climate) body.climate = "temperate"

    // TODO: think what happens if avgTemperature and climate does not make sense

    if (body.climate === "continental"){
      df = df.filter(pl.col("ratio_continental_climate").lt(1000000))
    }

    if (body.household !== undefined){
        if (![true, false].includes(body.household)) return {error: "household must be true or false"}
        if (body.household === true){
            df = df.filter(pl.col("household_building_solutions").eq(1))
        }
    }

    if (body.pollutants !== undefined){
        if(!(body.pollutants instanceof Array)) return {error: 'pollutants must an array'}
        if(!body.pollutants.every(e => gl.pollutants.includes(e))) return {error: "pollutants must be in the list"}

        for (const pol of body.pollutants){
            df = df.filter(pl.col(pol).eq(1))
        }
    }


    // TODO: add new filters

    // TODO: estimate surface
    df = estimateSurface(body, df)

    return df.toRecords()
}

const findNBSMultiple = function(body){
    if (!(body instanceof Array)) return {error: "Body must be an array, for one scenario use 'find-nbs' route"}

    let result = []

    body.forEach(scenario => {
        let oneResult = findNBS(scenario)
        if (oneResult.error) result.push([oneResult])
        else result.push(oneResult)
    });

    return result
}

module.exports = {
    findNBS,
    findNBSMultiple
}