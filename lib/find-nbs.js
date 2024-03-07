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
        if (df.shape.height === 0) return {error: "no technologies found with the given parameters"}
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
        let validation = validatePollutants(body.pollutantsConcentrations, "pollutantsConcentrations")
        if (Object.keys(validation.error).length > 0) return validation
    }

    if (df.module[0] === "treatment" && (isPositive(body.inflow) || isPositive(body.inhabitants)))
        df = await estimateTreatmentSurface(body, df.filter(pl.col('module').eq(pl.lit('treatment'))))
    if (df.module[0] === "swm" && [body.spilledVolume, body.duration].every(e => e !== undefined)){
        df = await estimateSwmSurface(body, df)
    }

    if (df.error) return df

    // Calculate cost
    if (df.toRecords().every(e => e.cost_high !== undefined && e.surface_mean !== undefined)){
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
        let oneResult= await findNBS(scenario)
        result.push({scenario: scenario.scenario, result: oneResult})
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

        for (const pol of gl.polConcentrations){
            // Aquí s'haurien d'incloure els possible, però no hi ha cap tecnologia amb un possible a pollutants, de moment.
            df = filterbyPollutant(df, body, pol)
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
    if (gl.waterTypes[body.waterType].module === "swm" && body.onlyInfiltration === true){
        df = df.filter(pl.col('infiltration').eq(1))
    }

    // barriers
    if (body.manPower !== undefined) df = filterLevels(df, body, 'manPower', 'inv_es_manpower')
    if (body.skills !== undefined) df = filterLevels(df, body, 'skills', 'inv_es_skills')
    if (body.biohazardRisk !== undefined) df = filterLevels(df, body, 'biohazardRisk', 'inv_es_biohazard')

    return df
}

const filterbyPollutant = function(df, body, pol){
    if (gl.polPerformance.includes(pol) && body.pollutants.includes(pol + "_removal")) {
        if (
            body.pollutantsConcentrations === undefined ||
            (pol === 'bod' && body.pollutantsConcentrations.bod_in && body.pollutantsConcentrations.bod_out === undefined)
            ) {
            df = df.filter(pl.col(pol + "_removal").gtEq(80))
        } else {
            let conc = body.pollutantsConcentrations
            if (conc[pol + "_in"] !== undefined) {
                let perf = (conc[pol + "_in"] - conc[pol + "_out"]) / conc[pol + "_in"] * 100
                df = df.filter(pl.col(pol + "_removal").gtEq(perf))
            } else {
                df = df.filter(pl.col(pol + "_removal").gtEq(80))
            }
        }
    } else if (pol === "no3" && body.pollutants.includes("no3_removal")){
        df = df.filter(pl.col("no3_removal").eq(1))
    } else if (pol === "po43" && body.pollutants.includes("p_removal")){
        df = df.filter(pl.col("p_removal").eq(1))
    } else if (["ecoli", "heggs"].includes(pol) && body.pollutants.includes("pathogens_reduction")) {
        df = df.filter(pl.col("pathogens_reduction").eq(1))
    }

    return df
}

const validationInput = function(body){
    if(body === undefined || !body instanceof Object) return {error: "body must be an object"}
    if(body instanceof Array) return {error: "body must be an object, not an array"}

    let fieldsAccepted = [
        "waterType",
        "inflow",
        "litresPerson",
        "inhabitants",
        "climate",
        "avgTemperature",
        "pollutants",
        "pollutantsConcentrations",
        "onlyInfiltration",
        "spilledVolume",
        "cumRain",
        "duration",
        "catchmentArea",
        "drainagePipeDiameter",
        "infiltration",
        "infiltrationSoils",
        "area",
        "vertical",
        "verticalArea",
        "household",
        "ecosystemServices",
        "energy",
        "manPower",
        "skills",
        "biohazardRisk",
        "techIds"
    ]

    if (!Object.keys(body).every(e => fieldsAccepted.includes(e)))
    {
        console.log(Object.keys(body).filter(e => !fieldsAccepted.includes(e)))
        return {error: "some fields are not accepted"}
    }

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
        body.litresPerson = gl.waterTypes[body.waterType].litresPerson
    }

    // inhabitants if inflow is not defined
    if (body.inflow === undefined && body.inhabitants !== undefined) {
        if (!utils.isPositive(body.inhabitants)) return {error: "inhabitants must be a positive number"}

        // in m3/day
        body.inflow = body.inhabitants * body.litresPerson / 1000
    }

    if (body.spilledVolume !== undefined && !utils.isPositive(body.spilledVolume)) return {error: "spilledVolume must be a positive number"}
    if (body.cumRain !== undefined && !isPositive(body.cumRain)) return {error: "cumRain must be a positive number"}
    if (body.duration !== undefined && !isPositive(body.duration)) return {error: "duration must be a positive number"}
    if (body.catchmentArea !== undefined && !isPositive(body.catchmentArea)) return {error: "catchmentArea must be a positive number"}

    if (body.spilledVolume === undefined && body.cumRain !== undefined && body.catchmentArea !== undefined)
        body.spilledVolume = body.cumRain * body.catchmentArea * 0.001 // in m3

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