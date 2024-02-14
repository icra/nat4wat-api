
const tisModelTechs = ['HSSF_CW', 'HF_GW']

const chooseModel = function(tech, body, polls_in){
    if (tisModelTechs.includes(tech.id)) return tisModel(tech.id, body, polls_in)
    else return null
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tis model //////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tisModels = function(body, polls_in){
    let surfaces = []
    for (let poll of polls_in){
        surfaces.push(
            tisModel(
                body.pollutantsConcentrations[poll + '_in'],
                body.pollutantsConcentrations[poll + '_out'],
                pol,
                body.inflow
            )
        )
    }
}

const tisModel = function(c_in, c_out, pol, Q) {
    // define params
    let surface
    let k
    let c_star
    let theta
    let N = 2

    if (pol === "bod") {
        c_star = 0.6 + 0.4 * Math.pow(c_in, 55)
        theta = 0.981

        if (c_in > 200) {
            k = 66;
        } else if (c_in > 100) {
            k = 25;
        } else if (c_in > 30) {
            k = 37;
        } else if (c_in > 3) {
            k = 86
        } else {
            return null
        }
    } else if (pol === "cod") {
        k = 37.6
        theta = 1
        c_star = 0
    } else if (pol === "nh4"){
        k = 11.4
        theta = 1.014
        c_star = 0
    } else if (pol === "tn"){
        k = 8.4
        theta = 1.005
        c_star = 1
    } else if (pol === "no3") {
        k = 41.8
        theta = 1.110
        c_star = 0
    } else if (pol === "tp"){
        k = 60
        theta = 1
        c_star = 0.002
    } else {
        return null
    }

    surface = (((c_out - c_star) / (c_in - c_star))^(-1/N) - 1) * Q * 365 * N / k

    return surface
}

module.exports = {
    chooseModel
}