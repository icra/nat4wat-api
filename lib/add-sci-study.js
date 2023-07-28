const {isKeyValueObject} = require("./utils");
const {getTokens} = require("./database");

const addSciStudy = async function(body){

    // sanity checks and token vaidation
    if (!isKeyValueObject(body)) return {error: "Body must be a key:value object"}
    let tokens = await getTokens()
    console.log(tokens)
    let token = tokens.filter(t => t.username == body.username)
    if (token.length === 0 || token[0].token !== body.token) return {error: "Token is not correct, please contact the administrator"}

    // USER INFORMATION
    if (body.email === undefined) return {error: "A contact email must be provided"}

    return {hello: "hello"}


}



module.exports = {
    addSciStudy
}