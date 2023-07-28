const findNBS = require('./find-nbs')
const {isKeyValueObject} = require("./utils");
const gl = require('./globals');

const mcda = function(body){
    if (body === undefined) return {error: "body must contain tech of techIds keys"}
    if (body.techs !== undefined){
        if (!(body.techs instanceof Array)) return {error: "techs must be an array of technologies"}
        var df = body.techs
    } else if (body.techIds !== undefined){
        if (!(body.techIds instanceof Array)) return {error: "techIds must be an array of technologies IDs"}
        var df = findNBS.findNBS({techIds: body.techIds})
    } else {
        return {error: "body must contain techs or techIds"}
    }

    // Multifunctionality
    df.forEach(tech => {
        let techEs = Object.keys(tech)
            .filter((key) => key.startsWith("es_"))
            .reduce((obj, key) => {
                return Object.assign(obj, {
                    [key]: tech[key]
                });
            }, {});
        // Calculate average of all ecosystem services and scale between 0 and 1.
        tech.multifunctionality = (Object.values(techEs).reduce((a, b) => a + b, 0) / Object.values(techEs).length)/3
    })

    // Operation & manteinance
    df.forEach(tech => {
        // calculate, normalize and invert score (0 worse and 1 better)
        tech.operation = 1 - ((tech.inv_es_manpower + tech.inv_es_skills)/2)/3
    })

    // Surface requirements
    if (df[0].surface_mean !== undefined){
        let surfaces = df.map(tech => tech.surface_mean + tech.vertical_surface_mean)
        let minSurface = Math.min(...surfaces)

        df.forEach(tech => {
            // normalize and invert score (0 more surface 1 less surface
            tech.spaceRequirements = minSurface / (tech.surface_mean + tech.vertical_surface_mean)
        })
    } else {
        let surfaces = df.map(tech => tech.m2_pe_tropical)
        let minSurface = Math.min(...surfaces)

        df.forEach(tech => {
            // normalize and invert score (0 more surface 1 less surface)
            tech.spaceRequirements = minSurface / tech.m2_pe_tropical
        })
    }

    // Environmental impacts = eutrophication + biohazard + energy
    df.forEach(tech => {
        // normalize and invert score (0 more impact 1 less impact
        tech.envImpact = ((1 - tech.energy)
            + tech.n_removal_nitrification
            + tech.n_removal_nitrateremoval
            + (1 - (tech.inv_es_biohazard / 3)))
            / 4
    })

    if (body.weights !== undefined) {
        var weights = calculateWeights(body.weights)
        if (weights.error) return weights
    } else {
        var weights = {}
        for (key of gl.wAccepted){
            weights[key] = 1 / gl.wAccepted.length
        }
    }

    df.forEach(tech => {
        tech.weightedMultifuncionality = tech.multifunctionality * weights.wMultifunctionality
        tech.weightedOperation = tech.operation * weights.wOperation
        tech.weightedSpaceRequirements = tech.spaceRequirements * weights.wSpaceRequirements
        tech.weightedEnvImpact = tech.envImpact * weights.wEnvImpact

    })

    return(df)
}

const calculateWeights = function(weights){
    // Sanity checks
    if (!isKeyValueObject(weights)) return {error: 'weights must be an object of key value pairs'}
    let wKeys = Object.keys(weights)
    let wValues = Object.values(weights)
    if (!(wKeys.every(w => gl.wAccepted.includes(w)))) return {error: 'weights not in the list of accepted weights'}
    if(!wValues.every(w => w >= 0 && w <= 5)) return {error: 'weights must be a value between 0 and 5'}

    // Create array of complete values following categories of wAccepted
    // Missing keys get default weight
    let wDefault = 2.5

    for (const [i, key] of gl.wAccepted.entries()){
        if (!wKeys.includes(key)) {
            wKeys.push(key)
            wValues.push(wDefault)
        }
    }

    // Convert weights to proportions (total = 1)
    let wTotal = wValues.reduce((a, b) => a + b)
    let wPerc
    if (wTotal === 0) wPerc = wValues.map(() => 1 / wValues.length)
    else wPerc = wValues.map(w => w / wTotal)

    // Reconstruct weights
    wKeys.forEach((key, i) => {
        weights[key] = wPerc[i]
    })

    return weights
}

module.exports = {
    mcda,
    calculateWeights
}