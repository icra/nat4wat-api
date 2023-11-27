const jstat = require("jstat")

// first arg is the confidence level and second arg i degress of freedom
const Z_095 =  jstat.studentt.inv(0.025, 97);

// const interval = Z_095 * mlr.stdError / Math.sqrt(x.length)
//
// const ci = [
//     prediction[0],
//     prediction[0] + interval,
//     prediction[0] - interval
// ]

const predictSurfaces = function(tech, body){
    // iterate over pollutants with concentrations

    // for each pollutant, predict the surface

    // return the maximum surface with the pollutant
}

const predictSurface = function(tech, pollutant){
    // query the database for that tech and pollutant

    // if there is a model, return surface with interval


    // if there is no model, return null
}

module.exports = {
    predictSurfaces
}