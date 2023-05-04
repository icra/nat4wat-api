const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")

let findNBS = function (body){

    if(body instanceof Array) return {error: "body must be an object, not an array"}
    if(!body instanceof Object) return {error: "body must be an object"}

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
    if (body.area !== undefined){
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
    console.log("climate", body.climate)




    return df.toRecords()
}

module.exports = {
    findNBS
}