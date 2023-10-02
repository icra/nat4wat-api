const {isKeyValueObject, validateDocumentInfo, isPositive} = require("./utils");
const {getTokens, getUws, insertSciStudy} = require("./database");
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
        body.document.title,
        body.document.year,
        body.technology.techId,
        body.technology.surface,
        body.technology.yearOperation,
        body.water.inflow,
        body.water.type
    ].some(e => e === undefined))
        return {error: 'All required fields must be provided'}

    // Validate mail
    const regexMail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
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

    // yearOperation
    if (!isPositive(body.technology.yearOperation) ||
        body.technology.yearOperation < 1950 ||
        body.technology.yearOperation > new Date().getFullYear())
        return {error: "technology.yearOperation must be between 1950 and current year"}
    body.technology.yearOperation = Number(body.technology.yearOperation)

    // Water information ------------------------------------------------------------------------------------------------
    // Inflow
    if (!isPositive(body.water.inflow)) return {error: "water.inflow must be a positive number"}
    body.water.inflow = Number(body.water.inflow)

    // Water type
    if (!Object.keys(gl.waterTypes).includes(body.water.type)) return {error: "water.type must be one of the following: " + Object.keys(gl.waterTypes).join(", ")}

    // Urban water system
    if (body.water.urbanWaterSystem !== undefined){
        let uwsTypes = await getUws()

        if (!uwsTypes.includes(body.water.urbanWaterSystem)) return {error: "water.urbanWaterSystem must be one of the following: " + uwsTypes.join(", ")}
    }

    // Water temperature
    if (body.water.temperature !== undefined){
        if (!isPositive(body.water.temperature)) return {error: "water.temperature must be a positive number"}
        body.water.temperature = Number(body.water.temperature)
    }

    // Air Temperature
    if (body.water.airTemperature !== undefined){
        body.water.airTemperature = Number(body.water.airTemperature)
        if (isNaN(body.water.airTemperature)) return {error: "water.airTemperature must be a number"}
    }

    for (const [key, value] of Object.entries(body.pollutants)) {
        // check that pollutant is in gl.concentrations
        if (!gl.concentrations.includes(key)) return {error: `pollutants.${key} is not a valid pollutant`}

        // check that in is provided if out is provided
        if (key.endsWith("out")) {
            const inKey = key.replace("_out", "_in")
            if (!Object.keys(body.pollutants).includes(inKey)) return {error: `pollutants.${key} is provided but not pollutants.${inKey}`}
        }
        
        if (!isPositive(value)) return {error: `pollutants.${key} must be a positive number`}
        // Units asked are cfu/100mL but the database stores cfu/L
        if (key.startsWith("ecoli")) body.pollutants[key] = Number(value) * 10
        body.pollutants[key] = Number(value)
    }

    // Document information
    body.document = await validateDocumentInfo(body.document)
    if (body.document.error) return body.document

    // TODO: Validation workflow

    return await insertSciStudy(body)
}



module.exports = {
    addSciStudy
}