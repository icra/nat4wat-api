const { insertSciPublication,doesTitleExist, getUws, insertTreatmentSciDetails} = require("./database");
const {isKeyValueObject, validateDocumentInfo, isPositive, isDefined, isNotNegative, validatePollutants, isString} = require("./utils");

const {readTechnologiesExcel} = require("./excel_utils");
const gl = require("./globals");

const addSciPublication = async function(body) {

    try
    {
        if([
            body.doi,
            body.title,
            body.year
        ].some(e => e === undefined))
            return {success: false,
                message: 'All required fields must be provided'}


        const tech = await readTechnologiesExcel(body.sub_type);
        if (tech.error)
        {
            return {
                success: false,
                error: 'Technology added does not correspond with any technology'
            };
        }
        let type = body.sub_type.split('_');
        body.type = type.length > 1 ? type[1] : body.sub_type;
        const doc = await validateDocInfo(body);
        if (doc.error)
        {
            return {
                success: false,
                error: doc.error
            };
        }

        const publication = await insertSciPublication(body);
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

validateDocInfo = async function(doc)
{
    try
    {
        if (!isString(doc.title))
        {
            return {
                error: "Title field must be a string"
            }
        }
        if (doc.authors !== undefined && !isString(doc.authors)) return {
            error: "Authors field must be a string"}
        if (doc.journal !== undefined && !isString(doc.journal)) return {
            error: "Journal field must be a string"}
        let currentYear = new Date().getFullYear()
        if (!isPositive(doc.year) || doc.year < 1950 || doc.year > currentYear) return {
            error: "Year field must be a positive number between 1950 and current year"}
        if (doc.doi === null || doc.doi === undefined) return {
            error: "DOI field is mandatory"}
        const title_exists = await doesTitleExist(doc.title, doc.sub_type, doc.id);

        if(title_exists)
        {
            return {
                error: "Title already exists for this solution"
            }
        }
        // Validate DOI
        if (doc.doi.startsWith("https")){
            if (!(doc.doi.startsWith('https://doi.org/')))
                return {
                    error: 'DOI is not valid'
                }
        } else {
            doc.doi = "https://doi.org/" + doc.doi
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
    addSciPublication
}