const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")
const {estimateTreatmentSurface} = require("./estimate-treatment-surface");
const {estimateSwmSurface} = require("./estimate-swm-surface");
const {estimateCost} = require("./estimate-cost");
const {filterLevels, isPositive, validatePollutants} = require("./utils");
const {readTechnologiesExcel} = require("./excel_utils");

const findNBS = async function (body){
    body = validationInput(body)
    if (body.error) return body

    let df = readTechnologiesExcel(id = false, records = false)

    if (body.techIds !== undefined){
        if (!(body.techIds instanceof Array)) return {error: "techIds must be an array of ids"}
        if (!body.techIds.every(id => df['id'].toArray().includes(id))) return {error: "some ids are wrong"}

        // filter by id
        df = df.filter(pl.col('id').isIn(body.techIds))
    } else {

        // filter by parameters
        df = filterNBS(df, body)
        if (df.error) return df
    }

    if (!(df.toRecords().map(e => e.module).every( (val, i, arr) => val === arr[0])))
        return {error: "technologies for treatment and stormwater management can't be combined"}

    // Available area
    if (body.area !== undefined) {
        if (!utils.isPositive(body.area)) return {error: "area must be a positive number"}
    }

    // Available vertical area
    if (body.verticalArea !== undefined) {
        if (body.vertical === false) return {error: "you are providing a vertical area but rejecting vertical technologies"}
        if (!utils.isPositive(body.verticalArea)) return {error: "verticalArea must be a positive number"}
    }

    // Pollutant concentrations
    if (body.pollutantsConcentrations !== undefined){
        body.pollutantsConcentrations = validatePollutants(body.pollutantsConcentrations, "pollutantsConcentrations")
        if (body.pollutantsConcentrations.error) return body.pollutantsConcentrations
    }

    if (df.module[0] === "treatment" && (isPositive(body.inflow) || isPositive(body.inhabitants)))
        df = await estimateTreatmentSurface(body, df.filter(pl.col('module').eq(pl.lit('treatment'))))
    if (df.module[0] === "swm" && [body.cumRain, body.duration, body.catchmentArea].every(e => e !== undefined)){
        df = await estimateSwmSurface(body, df)
    }

    // Calculate cost
    if (df.toRecords().every(e => e.cost_high !== undefined) && body.volume !== undefined){
        df = estimateCost(df)
    }

    // return error if some error in estimateSurface
    if (df.error) return df



    return df.toRecords()
}

const findNBSMultiple = async function(body){
    if (!(body instanceof Array)) return {error: "Body must be an array, for one scenario use 'find-nbs' route"}

    let result = []

    await body.forEach(async (scenario) => {
        console.log(scenario.waterType)
        let oneResult = await findNBS(scenario)
        console.log(typeof oneResult)
        result.push({scenario: scenario.scenario, result: oneResult})
        console.log("length", result.length)
    });

    return result
}

const filterNBS = function(df, body){
    // waterType
    if (body.waterType !== "any_wastewater"){
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}

        // Aquí hi ha valors de possible, però al només acceptar un tipus d'aigua no podem fer l'acordat
        df = df.filter(pl.col(body.waterType).eq(1))
    } else {
        df = df.filter(pl.col("module").eq(pl.lit("treatment")))
    }

    // vertical
    if (body.vertical === false){
        df = df.filter(pl.col("vertical").eq(0))
    }

    if (body.household !== undefined){
        if (![true, false].includes(body.household)) return {error: "household must be true or false"}
        if (body.household === true){
            df = df.filter(pl.col("household_building_solutions").eq(1))
        }
    }

    if (body.pollutants !== undefined){
        if(!(body.pollutants instanceof Array)) return {error: 'pollutants must be an array'}
        if(!body.pollutants.every(e => gl.pollutants.includes(e))) return {error: "pollutants must be in the list"}

        for (const pol of body.pollutants){
            // Aquí s'haurien d'incloure els possible, però no hi ha cap tecnologia amb un possible a pollutants, de moment.
            df = df.filter(pl.col(pol).eq(1))
        }
    }

    // Ecosystem services
    if (body.ecosystemServices !== undefined){
        let test_keys = Object.keys(body.ecosystemServices)
        if (test_keys.length === 0 || test_keys === ['0']) return ({error: 'ecosystemServices must be an object with key:value'})
        for (const [key, value] of Object.entries(body.ecosystemServices)){
            if(!gl.ecosystemServices.includes(key)) return ({error: `${key} is not in the list of admitted ecosystem services`})
            if(![0,1,2,3].includes(value)) return ({error: `Value for ${key} must be between 0 and 3`})

            df = df.filter(pl.col(key).gtEq(value))
        }
    }

    if (body.energy !== undefined){
        if (!['yes', 'no'].includes(body.energy)) return {error: "energy must be yes or no"}
        if (body.energy === 'no') df = df.filter(pl.col("energy").eq(0))
        if (body.energy === 'yes') df = df.filter(pl.col("energy").eq(1))
    }

    // No retention capacity when infiltration is zero
    if (gl.waterTypes[body.waterType].module === "swm" && !isPositive(body.infiltration))
        df = df.filter(pl.col("storage_capacity_low").gt(0))

    // barriers
    if (body.manPower !== undefined) df = filterLevels(df, body, 'manPower', 'inv_es_manpower')
    if (body.skills !== undefined) df = filterLevels(df, body, 'skills', 'inv_es_skills')
    if (body.biohazardRisk !== undefined) df = filterLevels(df, body, 'biohazardRisk', 'inv_es_biohazard')

    return df
}

const validationInput = function(body){
    if(body === undefined || !body instanceof Object) return {error: "body must be an object"}
    if(body instanceof Array) return {error: "body must be an object, not an array"}

    if (body.waterType !== undefined) {
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}
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

    // inhabitants if inflow is not defined
    if (body.inflow === undefined && body.inhabitants !== undefined) {
        if (!utils.isPositive(body.inhabitants)) return {error: "inhabitants must be a positive number"}

        // in m3/day
        body.inflow = body.inhabitants * body.litresPerson / 1000
    }

    if (body.volume !== undefined)
        if (!utils.isPositive(body.volume)) return {error: "volume must be a positive number"}

    // Climate

    if (body.climate !== undefined){
        if (!gl.climate.includes(body.climate)) return {error: "climate is not in the list of accepted climates"}
    }

    if (body.avgTemperature !== undefined){
        if (isNaN(body.avgTemperature)) return {error: "avgTemperature must be a number"}
        if(body.climate === undefined) body.climate = utils.climate(body.avgTemperature)
        if(body.climate !== utils.climate(body.avgTemperature))
            return {error: "avgTemperature does not correspond with climate, pick one of both"}
    }

    // if climate is not defined temperate is default
    if(!body.climate) body.climate = "temperate"

    return body
}

module.exports = {
    findNBS,
    findNBSMultiple
}