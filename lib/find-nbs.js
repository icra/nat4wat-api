const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")

let findNBS = function (body){

    if(body === undefined || !body instanceof Object) return {error: "body must be an object"}
    if(body instanceof Array) return {error: "body must be an object, not an array"}

    let df = pl.readCSV("public/technologies.csv")
    df = df.dropNulls("id")

    // waterType
    if (body.waterType !== undefined) {
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}

        df = df.filter(pl.col(body.waterType).eq(1))
    }

    // inflow in litres/day
    if (body.inflow !== undefined){
        if(!utils.isPositive(body.inflow)) return {error: "inflow must be a positive number"}
    }

    // inhabitants
    if (body.inflow === undefined && body.inhabitants !== undefined) {
        if (!utils.isPositive(body.inhabitants)) return {error: "inhabitants must be a positive number"}
        if (body.litresPerson) {
            if (!utils.isPositive(body.litresPerson)) return {error: "litresPerson must be a positive number"}
        }
        // use user value or predefined litresPerson of 120
        body.inflow = body.litresPerson ? body.inhabitants * body.litresPerson : body.inhabitants * 120
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

        for (pol of body.pollutants){
            df = df.filter(pl.col(pol).eq(1))
        }
    }

    // TODO: add new filters

    // TODO: estimate surface








    return df.toRecords()
}

module.exports = {
    findNBS
}