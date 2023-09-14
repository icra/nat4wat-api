const {isKeyValueObject} = require("./utils");
const {deleteSciStudyDB} = require("./database");
const dotenv = require('dotenv')
dotenv.config()


const deleteSciStudy = async function(body){
    // sanity checks and token validation
    if (!isKeyValueObject(body)) return {error: "Body must be a key:value object"}
    if (body.password !== process.env.TOKEN_PASSWORD) return {error: "Password is not correct, please contact the administrator"}

    return await deleteSciStudyDB(body.field, body.value)
}

module.exports = {deleteSciStudy}