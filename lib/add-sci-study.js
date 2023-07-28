const {isKeyValueObject, parseDoi, isPositive} = require("./utils");
const {getTokens} = require("./database");
const {readTechnologiesExcel} = require("./excel_utils");

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
        body.water.inflow
    ].some(e => e === undefined))
        return {error: 'All required fields must be provided'}

    // Validate mail
    const regexMail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!regexMail.test(body.email)) return {error: 'The contact email is not correct'}

    // Technology information
    const tech = await readTechnologiesExcel(body.technology.techId)
    if (tech.error) return {error: 'technology.techId does not correspond with any technology'}
    body.technology.type = tech[0].type

    if (!isPositive(body.technology.surface)) return {error: "technology.surface must be a positive number"}
    body.technology.surface = Number(body.technology.surface)
    if (body.technology.hrt !== undefined){
        if(!isPositive(body.technology.hrt)) return {error: "technology.hrt must be a positive number"}
        body.technology.hrt = Number(body.technology.hrt)
    }
    if (body.technology.peopleServed !== undefined){
        if(!isPositive(body.technology.peopleServed)) return {error: "technology.hrt must be a positive number"}
        body.technology.peopleServed = Number(body.technology.peopleServed)
    }




    // Water information

    // Document information

    // Validate DOI
    body.document.doi = await parseDoi(body.document.doi)
    if (body.document.doi.error) return body.document.doi





    return body


}



module.exports = {
    addSciStudy
}