const pl = require('nodejs-polars')
const gl = require('./globals')

const estimateSurface = function(body, techs){
    if (body.inflow === undefined && body.inhabitants === undefined) return techs

    // calculate previous variables
    if (body.inhabitants === undefined) body.inhabitants = body.inflow / body.litresPerson
    let pe = body.inhabitants * gl.waterTypes[body.waterType]
    let bodIn = body.bodIn ? body.bodIn : (pe * 60)
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
    let surface = bodIn * tech[colGrBODM2]
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
    estimateSurface
}