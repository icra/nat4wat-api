const {isKeyValueObject, parseDoi, isPositive} = require("./utils");
const {getTokens, getUws} = require("./database");
const {readTechnologiesExcel} = require("./excel_utils");
const gl = require("./globals");

const addSciStudy = async function(body){

    // sanity checks and token validation
    if (!isKeyValueObject(body)) return {error: "Body must be a key:value object"}
    let tokens = await getTokens()
    let token = tokens.filter(t => t.username === body.username)
    if (token.length === 0 || token[0].token !== body.token) return {error: "Token is not correct, please contact the administrator"}

    // CHECK ALL CATEGORIES INFORMATION
    if ([body.email,
        body.technology,
        body.water,
        body.document,
        body.pollutants
    ].some(e => e === undefined))
        return {error: 'All required fields must be provided'}

    if([
        body.document.doi,
        body.technology.techId,
        body.technology.surface,
        body.water.inflow,
        body.water.type
    ].some(e => e === undefined))
        return {error: 'All required fields must be provided'}

    // Validate mail
    const regexMail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!regexMail.test(body.email)) return {error: 'The contact email is not correct'}

    // Technology information -------------------------------------------------------------------------------------------
    // techId
    const tech = await readTechnologiesExcel(body.technology.techId)
    if (tech.error) return {error: 'technology.techId does not correspond with any technology'}
    body.technology.type = tech[0].type

    // surface
    if (!isPositive(body.technology.surface)) return {error: "technology.surface must be a positive number"}
    body.technology.surface = Number(body.technology.surface)

    // hrt
    if (body.technology.hrt !== undefined){
        if(!isPositive(body.technology.hrt)) return {error: "technology.hrt must be a positive number"}
        body.technology.hrt = Number(body.technology.hrt)
    }

    // peopleServed
    if (body.technology.peopleServed !== undefined){
        if(!isPositive(body.technology.peopleServed)) return {error: "technology.hrt must be a positive number"}
        body.technology.peopleServed = Number(body.technology.peopleServed)
    }

    // Water information ------------------------------------------------------------------------------------------------
    // Inflow
    if (!isPositive(body.water.inflow)) return {error: "water.inflow must be a positive number"}
    body.water.inflow = Number(body.water.inflow)

    // Water type
    if (!Object.keys(gl.waterTypes).includes(body.water.type)) return {error: "water.type must be one of the following: " + Object.keys(gl.waterTypes).join(", ")}

    // Urban water system
    if (body.water.urbanWaterSystem !== undefined){
        let uwsTypes = await getUws()
        uwsTypes = uwsTypes.map(u => u.uws).filter(u => u !== null)
        if (!uwsTypes.includes(body.water.urbanWaterSystem)) return {error: "water.urbanWaterSystem must be one of the following: " + uwsTypes.join(", ")}
    } else {
        body.water.urbanWaterSystem = null
    };

    // Water temperature
    if (body.water.temperature !== undefined){
        if (!isPositive(body.water.temperature)) return {error: "water.temperature must be a positive number"}
        body.water.temperature = Number(body.water.temperature)
    };

    // Air Temperature
    if (body.water.airTemperature !== undefined){
        body.water.airTemperature = Number(body.water.airTemperature)
        if (isNaN(body.water.airTemperature)) return {error: "water.airTemperature must be a number"}
    };

    // Pollutants information
    // { pollutants: {
    //     bod_in: 0,
    //     bod_out: 0,
    //     tn_in: 0,
    //     tn_out: 0
    //
    // }}

    for (const [key, value] of Object.entries(body.pollutants)) {
        // check that pollutant is in gl.concentrations

        if (!isPositive(value)) return {error: `pollutants.${key} must be a positive number`}
        body.pollutants[key] = Number(value)
    }


    // Document information

    // Validate DOI
    body.document.doi = await parseDoi(body.document.doi)
    if (body.document.doi.error) return body.document.doi





    return body


}



module.exports = {
    addSciStudy
}