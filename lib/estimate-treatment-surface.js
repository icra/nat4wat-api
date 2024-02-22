const pl = require('nodejs-polars');
const gl = require('./globals');
const {predictSurfaces} = require("./predict-regression-models");
const {isDefined} = require("./utils");
const {chooseModel} = require("./mechanistic-models");

const estimateTreatmentSurface = async function(body, techs){

    if (body.climate === "continental"){
        techs = techs.filter(pl.col("m2_pe_continental").lt(100000))
    }

    // calculate previous variables
    if (body.inhabitants === undefined) body.inhabitants = body.inflow / body.litresPerson
    if (body.inflow === undefined) body.inflow = body.inhabitants * body.litresPerson
    let pe = body.inhabitants * gl.waterTypes[body.waterType].pe
    if (body.pollutantsConcentrations !== undefined) {
        // bodIN is in grams, inflow is in litres, so we need to divide by 1000
        var bodIn = body.pollutantsConcentrations.bod_in ? body.pollutantsConcentrations.bod_in * body.inflow * 0.001 : undefined
        console.log("bodIn", bodIn)
    }
    let colM2PE = 'm2_pe_' + body.climate
    let colGrBODM2 = 'gr_bod_m2_' + body.climate
    if (body.pollutantsConcentrations !== undefined) {
        var polls_in = Object.keys(body.pollutantsConcentrations)
            .filter(poll => poll.endsWith('_out'))
            .map(poll => poll.replace('_out', ''))
    } else {
        var polls_in = []
    }

    // Go on cascade model
    techs = techs.toRecords()

    for (let i = 0; i < techs.length; i++) {

        if (polls_in.length > 0){
            var regressionSurface = await predictSurfaces(techs[i], body, polls_in)
        }

        if (polls_in.length > 0 && !isDefined(regressionSurface)){
            let ruleOfThumb = useM2PE(techs[i], pe, colM2PE)
            let priorSurface = techs[i].vertical == 0 ? ruleOfThumb.surface_mean : ruleOfThumb.vertical_surface_mean
            var mechanisticSurface = chooseModel(techs[i], body, polls_in, priorSurface)
        }

        // if models returns null goes down into cascade model
        if (isDefined(regressionSurface)) {
            techs[i].surface_method = regressionSurface[3]
            techs[i] = assignSurface(techs[i], regressionSurface, addUncertainty = false)

        } else if (isDefined(mechanisticSurface)) {
            techs[i].surface_method = mechanisticSurface.method
            techs[i] = assignSurface(techs[i], mechanisticSurface.surface, addUncertainty = true)
        } else {
            // calculate surface using hydraulic load ratio
            if (bodIn !== undefined && techs[i][colGrBODM2]) {
                techs[i] = useGrBODM2(techs[i], bodIn, colGrBODM2)
            // calculate surface using m2_pe (rule of thumb)
            } else if (techs[i][colM2PE] && techs[i][colM2PE] < 100000) {
                techs[i] = useM2PE(techs[i], pe, colM2PE)
            }
        }
    }

    let df = pl.readRecords(techs)

    if (body.area !== undefined)
        df = df.filter(pl.col('surface_low').ltEq(body.area))
    if (body.verticalArea !== undefined)
        df = df.filter(pl.col('vertical_surface_low').ltEq(body.verticalArea))

    return df
}

const useGrBODM2 = function(tech, bodIn, colGrBODM2){
    let surface = bodIn / tech[colGrBODM2]
    tech = assignSurface(tech, surface)
    tech.surface_method = "organic_load_ratio"
    return tech
}
const useM2PE = function(tech, pe, colM2PE){
    let surface = tech[colM2PE] * pe
    tech = assignSurface(tech, surface)
    tech.surface_method = 'ratio_m2_pe'
    return tech
}

const assignSurface = function(tech, surface, addUncertainty = true){
    if (addUncertainty){
        var low = surface * (1 - gl.uncertainty)
        var high = surface * (1 + gl.uncertainty)
        var mean = surface
    } else {
        var low = surface[0]
        var high = surface[2]
        var mean = surface[1]
    }

    if (tech.vertical === 0){
        tech.surface_mean = mean
        tech.surface_low = low
        tech.surface_high = high
        tech.vertical_surface_mean = 0;
        tech.vertical_surface_low = 0;
        tech.vertical_surface_high = 0;
    } else if (tech.vertical === 1){
        tech.surface_mean = 0
        tech.surface_low = 0
        tech.surface_high = 0
        tech.vertical_surface_mean = mean;
        tech.vertical_surface_low = low;
        tech.vertical_surface_high = high;
    }

    return tech

}


module.exports = {
    estimateTreatmentSurface
}