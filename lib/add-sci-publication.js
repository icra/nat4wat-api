const {isKeyValueObject, validateDocumentInfo} = require("./utils");
const {getTokens, insertSciPublication} = require("./database");
const {readTechnologiesExcel} = require("./excel_utils");
const gl = require("./globals");

const addSciPublication = async function(body) {

    // sanity checks and token validation
    if (!isKeyValueObject(body)) return {error: "Body must be a key:value object"}
    let tokens = await getTokens()
    let token = tokens.filter(t => t.username === body.username)
    if (token.length === 0 || token[0].token !== body.token) return {error: "Token is not correct, please contact the administrator"}

    if([
        body.doi,
        body.title,
        body.year
    ].some(e => e === undefined))
        return {error: 'All required fields must be provided'}

    // Validate mail
    if (!gl.regexMail.test(body.email)) return {error: 'The contact email is not correct'}

    const tech = await readTechnologiesExcel(body.techId)
    if (tech.error) return {error: 'technology.techId does not correspond with any technology'}
    body.type = tech[0].type

    body = await validateDocumentInfo(body)
    if (body.error) return body

    return await insertSciPublication(body)
}

module.exports = {
    addSciPublication
}