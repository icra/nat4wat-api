const {isKeyValueObject} = require("./utils");
const {getTokens} = require("./database");

const addSciStudy = async function(body){

    // sanity checks and token vaidation
    if (!isKeyValueObject(body)) return {error: "Body must be a key:value object"}
    let tokens = await getTokens()
    let token = tokens.filter(t => t.username == body.username)
    if (token.length === 0 || token[0].token !== body.token) return {error: "Token is not correct, please contact the administrator"}

    return {hello: "hello"}


}



module.exports = {
    addSciStudy
}