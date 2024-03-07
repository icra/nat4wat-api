const jstat = require("jstat")
const gl = require("./globals")
const {queryModel} = require("./database");

// first arg is the confidence level and second arg i degress of freedom
const Z_095 =  jstat.studentt.inv(0.025, 97);

const predictSurfaces = async function(tech, body, polls_in){
    // console.log(tech.id, polls_in)
    let maxSurface = {surface: [0, 0, 0]}

    for (let poll of polls_in){
        let l_in = body.pollutantsConcentrations[poll + '_in'] * body.inflow
        let l_out = body.pollutantsConcentrations[poll + '_out'] * body.inflow
        let surface = await predictSurface(tech, poll, l_in, l_out)
        // console.log("surface", surface)
        if (surface === null || surface.surface === NaN) continue
        if (surface.surface[1] > maxSurface.surface[1]) maxSurface = surface
    }
    if (maxSurface.surface[1] === 0) return null
    return maxSurface
}

const predictSurface = async function(tech, poll, l_in, l_out){
    // query the database for that tech and pollutant

    if (l_in < l_out) return null
    if (l_in === l_out) return [0, 0, 0]

    let model = await queryModel(tech.id, poll)
    if (model.length === 0) return null
    model = model[0]

    if (model.null_model === null) {
        // check if load_in is between model range
        if (l_in < model.min_load_in * (1 - gl.uncertainty)) return null
        if (l_in > model.max_load_in * (1 + gl.uncertainty)) return null

        let interval = Z_095 * model.std_error / Math.sqrt(model.n)
        let prediction = predict[model.type](model, l_in, l_out, interval)
        let surface = {
            surface: prediction,
            method: model.type + '_regression',
            poll: poll,
            n: model.n,
            rmae: model.RMAE,
        }
        return surface

    } else {
        return null
    }
}

const predict = {

    linear: (model, l_in, l_out, interval) => {
        let l_rm = l_in - l_out
        let beta = model.beta_load_removal
        let surface = beta * l_rm
        return [surface + interval, surface, surface - interval]
    },
    exponential: (model, l_in, l_out, interval) => {
        let l_perf = Math.log(l_in / l_out)
        let beta = model.beta_load_removal
        let surface = beta * l_perf
        return [surface + interval, surface, surface - interval]
    },
    power: (model, l_in, l_out, interval) => {
        let l_rm = Math.log10(l_in - l_out)
        let intercept = model.intercept
        let beta = model.beta_load_removal
        let log10Surface = intercept + beta * l_rm
        let log10ci = [log10Surface + interval, log10Surface, log10Surface - interval]
        return log10ci.map(e => Math.pow(10, e))
    }
}

module.exports = {
    predictSurfaces
}