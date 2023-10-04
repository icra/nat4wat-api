const pl = require('nodejs-polars')
const gl = require('./globals')
const utils = require("./utils");

const estimateTreatmentSurface = function(body, techs){

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

    if (body.climate === "continental"){
        techs = techs.filter(pl.col("m2_pe_continental").lt(100000))
    }

    // calculate previous variables
    if (body.inhabitants === undefined) body.inhabitants = body.inflow / body.litresPerson
    let pe = body.inhabitants * gl.waterTypes[body.waterType].pe
    let bodIn = body.bodIn ? body.bodIn * body.inflow : (pe * 60)
    let colM2PE = 'm2_pe_' + body.climate
    let colGrBODM2 = 'gr_bod_m2_' + body.climate

    // Go on cascade model
    techs = techs.toRecords()

    techs.forEach(function(tech, i) {
        // TODO: I wonder if when bodIn is not provided we should still use this method or should go to m2_pe
        if (tech[colGrBODM2]) {
            this[i] = useGrBODM2(tech, bodIn, colGrBODM2)
        } else if (tech[colM2PE] && tech[colM2PE] < 100000) {
            this[i] = useM2PE(tech, pe, colM2PE)
        }
    }, techs);

    return pl.readRecords(techs)
}

const useGrBODM2 = function(tech, bodIn, colGrBODM2){
    let surface = bodIn / tech[colGrBODM2]
    tech = assignSurface(tech, surface)
    tech.surface_method = 'ratio_gr_bod_m2'
    return tech
}
const useM2PE = function(tech, pe, colM2PE){
    let surface = tech[colM2PE] * pe
    tech = assignSurface(tech, surface)
    tech.surface_method = 'ratio_m2_pe'
    return tech
}

const assignSurface = function(tech, surface){
    let low = surface * (1 - gl.uncertainty)
    let high = surface * (1 + gl.uncertainty)

    if (tech.vertical === 0){
        tech.surface_mean = surface
        tech.surface_low = low
        tech.surface_high = high
        tech.vertical_surface_mean = 0;
        tech.vertical_surface_low = 0;
        tech.vertical_surface_high = 0;
    } else if (tech.vertical === 1){
        tech.surface_mean = 0
        tech.surface_low = 0
        tech.surface_high = 0
        tech.vertical_surface_mean = surface;
        tech.vertical_surface_low = low;
        tech.vertical_surface_high = high;
    }

    return tech

}


module.exports = {
    estimateTreatmentSurface
}