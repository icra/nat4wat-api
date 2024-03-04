const { insertMarketCase, doesNameExists} = require("./database");
const { isPositive, isString} = require("./utils");

const addMarketCase = async function(body) {

    try
    {
        console.log('addMarketCase');
        if([
            body.surface,
            body.name,
            body.location,
            body.year_construction
        ].some(e => e === undefined))
            return {success: false,
                message: 'All required fields must be provided'}

        const doc = await validateCaseInfo(body)
        if (doc.error)
        {
            return {
                success: false,
                message: doc.error
            };
        }

        console.log('body',body);
        const publication = await insertMarketCase(body);

        return publication;
    }
    catch(e)
    {
        console.log('error',e);
        return {
            success: false,
            error: "Something went wrong"
        }
    }
}


validateCaseInfo = async function(doc)
{
    try
    {


        if (!isString(doc.name))
        {
            return {
                error: "Name field must be a string"
            }
        }
        if (doc.description !== undefined && !isString(doc.description))
        {
            return {
                error: "Description field must be a string"}
        }
        let currentYear = new Date().getFullYear()
        if (!isPositive(doc.year_construction) || doc.year_construction < 1950 || doc.year_construction > currentYear)
        {
            return {
                error: "Year field must be a positive number between 1950 and current year"
            }
        }

        const name_exists = await doesNameExists(doc.name,doc.id);

        if(name_exists)
        {
            return {
                error: "Name already exists"
            }
        }

        return doc;
    }
    catch(e)
    {
        console.log('error',e);
        return {
            error: "Something went wrong"
        }
    }
}

module.exports = {
    addMarketCase
}