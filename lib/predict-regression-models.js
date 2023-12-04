const jstat = require("jstat")
const {queryModel} = require("./database");

// first arg is the confidence level and second arg i degress of freedom
const Z_095 =  jstat.studentt.inv(0.025, 97);

// const interval = Z_095 * mlr.stdError / Math.sqrt(x.length)
//
// const ci = [
//     prediction[0],
//     prediction[0] + interval,
//     prediction[0] - interval
// ]

const predictSurfaces = function(tech, body, polls_in){
    for (let poll of polls_in){
        let c_in = body.pollutantsConcentrations[poll + '_in']
        let c_out = body.pollutantsConcentrations[poll + '_out']
        console.log(poll, "c_in", c_in, "c_out", c_out)
        predictSurface(tech, poll, c_in, c_out)
    }


    // query the database
    return null

    // for each pollutant, predict the surface

    // return the maximum surface with the pollutant
}

const predictSurface = async function(tech, poll, c_in, c_out){
    // query the database for that tech and pollutant
    let model = await queryModel(tech.id, poll)
    if (model.error === null) {
        // surface = predict[model.type](model, c_in, c_out)
    } else {
        return null
    }
}

const predict = {

}

module.exports = {
    predictSurfaces
}