const {addScenario} = require("./database");
const { isPositive, isString} = require("./utils");

const saveScenario = async function(body) {
    try
    {
        console.log('body', body);
        const response = addScenario(body);
        return response;
    }
    catch(e)
    {
        console.log('error',e);
        return {
            success: false,
            error: "Something went wrong"
        }
    }
};

module.exports = {
    saveScenario
}