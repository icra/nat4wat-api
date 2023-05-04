const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")

let findNBS = function (body){
    let df = pl.readCSV("public/technologies.csv")
    df = df.dropNulls("id")

    console.log("body", body.waterType)

    // waterType
    if (body.waterType) {
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}

        df = df.filter(pl.col(body.waterType).eq(1))
    }

    // inflow in litres/day
    if (body.inflow){
        if(!utils.isPositive(body.inflow)) return {error: "inflow must be a positive number"}
    }

    // people served
    if (!body.inflow && body.peopleServed) {
        if (!utils.isPositive(body.peopleServed)) return {error: "peopleServed must be a positive number"}
        if (body.litresPerson) {
            if (!utils.isPositive(body.litresPerson)) return {error: "litresPerson must be a positive number"}
        }
        // use user value or predefined litresPerson of 120
        body.inflow = body.litresPerson ? body.peopleServed * body.litresPerson : body.peopleServed * 120
    }


    console.log("inflow", Number(body.inflow))
    return df.toRecords()
}

module.exports = {
    findNBS
}