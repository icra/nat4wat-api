const pl = require("nodejs-polars")
const gl = require("./globals")
const utils = require("./utils")
const {estimateTreatmentSurface} = require("./estimate-treatment-surface");
const {estimateSwmSurface} = require("./estimate-swm-surface");
const {filterLevels} = require("./utils");
const {readTechnologiesExcel} = require("./excel_utils");

const findNBS = function (body){

    if(body === undefined || !body instanceof Object) return {error: "body must be an object"}
    if(body instanceof Array) return {error: "body must be an object, not an array"}

    if (body.waterType !== undefined) {
        if (typeof body.waterType !== 'string') return {error: "waterType must be a string"}
        if (!Object.keys(gl.waterTypes).includes(body.waterType)) return {error: "waterType is not in the list"}
    } else {
        body.waterType = "any_wastewater"
    }

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

    // Available area
    if (body.area !== undefined) {
        if (!utils.isPositive(body.area)) return {error: "area must be a positive number"}
    }

    // Available vertical area
    if (body.verticalArea !== undefined) {
        if (body.vertical === false) return {error: "you are providing a vertical area but rejecting vertical technologies"}
        if (!utils.isPositive(body.verticalArea)) return {error: "verticalArea must be a positive number"}
    }

    // TODO: estimate surface
    if (gl.waterTypes[body.waterType].module === "treatment" && (body.inflow !== undefined || body.inhabitants !== undefined))
        df = estimateTreatmentSurface(body, df.filter(pl.col('module').eq(pl.lit('treatment'))))

    if (gl.waterTypes[body.waterType].module === "swm" && body.volume !== undefined)
        df = estimateSwmSurface(body, df)

    // return error if some error in estimateSurface
    if (df.error) return df



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

    // barriers
    if (body.manPower !== undefined) df = filterLevels(df, body, 'manPower', 'inv_es_manpower')
    if (body.skills !== undefined) df = filterLevels(df, body, 'skills', 'inv_es_skills')
    if (body.biohazardRisk !== undefined) df = filterLevels(df, body, 'biohazardRisk', 'inv_es_biohazard')

    return df
}

module.exports = {
    findNBS,
    findNBSMultiple
}