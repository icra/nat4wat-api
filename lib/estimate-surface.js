const pl = require('nodejs-polars')
const gl = require('./globals')

const estimateSurface = function(body, techs){
    // return the best estimation based on cascade model


    // TODO: Incorpotate the efficiency removal of technologies

    // m2/pe
    // calculate pe
    if (body.inhabitants === undefined) body.inhabitants = body.inflow / body.litresPerson
    let pe = body.inhabitants * gl.waterTypes[body.waterType]

    colClimate = 'm2_pe_' + body.climate

    techs = techs.toRecords()

    // surface = pe * ratio_climate
    techs.forEach(tech => {
        tech.surface_mean = tech[colClimate] * pe
        tech.surface_low = tech.surface_mean * 0.9
        tech.surface_high = tech.surface_mean * 1.1
        tech.vertical_surface_mean = 0;
        tech.vertical_surface_low = 0;
        tech.vertical_surface_high = 0;
    });

    techs.forEach(tech => {
        if (tech.vertical === 1){
            tech.vertical_surface_mean = tech.surface_mean;
            tech.vertical_surface_low = tech.surface_low;
            tech.vertical_surface_high = tech.surface_high;
            tech.surface_mean = 0;
            tech.surface_low = 0;
            tech.surface_high = 0;
        }
    })

    return pl.readRecords(techs)
}

module.exports = {
    estimateSurface
}