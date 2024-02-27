const pl = require("nodejs-polars");
const fetch = require("node-fetch");
const {isNull} = require("util");
const gl = require("./globals");

const isPositive = function(number){
    if (isNaN(number) || number === null) return false
    return number > 0;
};

const isNotNegative = function(number){
    if (isNaN(number) || number === null) return false
    return number >= 0;
}

const isKeyValueObject = function(obj) {
    return (obj instanceof Object) && !(obj.constructor===Array)
}

const isString = function(string){
    return (typeof string === "string" && string.length > 0)
}

const isDefined = function(value){
    return value !== undefined && value !== null
}

const climate = function(avgTemperature){
    if (avgTemperature < -3) return "continental";
    if (avgTemperature < 18) return "temperate";
    if (avgTemperature >= 18) return "tropical";
    return null
};

const filterLevels = function(df, body, feature, column) {
     if (![0, 1, 2, 3].includes(body[feature])) return ({error: `${feature} must be between 0 and 3`})
     return df.filter(pl.col(column).ltEq(body[feature]))
}

const avgKey = function(object, key){
    return object.reduce((total, next) => total + next[key], 0) / object.length
};

const validateDocumentInfo = async function(doc){
    // TODO: Check if title and doi already exist in the db
    if (!isKeyValueObject(doc)) return {error: "document must be an object"}
    if (!isString(doc.title)) return {error: "document.title must be a string"}
    if (doc.authors !== undefined && !isString(doc.authors)) return {error: "document.authors must be a string"}
    if (doc.journal !== undefined && !isString(doc.journal)) return {error: "document.journal must be a string"}
    let currentYear = new Date().getFullYear()
    if (!isPositive(doc.year) || doc.year < 1950 || doc.year > currentYear) return {error: "document.year must be a positive number between 1950 and current year"}
    if (isDefined(doc.startPage) && !isPositive(doc.startPage)) return {error: "document.startPage must be a positive number"}
    if (isDefined(doc.endPage) && !isPositive(doc.endPage)) return {error: "document.endPage must be a positive number"}
    if (doc.startPage > doc.endPage) return {error: "document.startPage must be lower than document.endPage"}

    // Validate DOI
    console.log()
    if (doc.doi === null || doc.doi === undefined) return {error: "DOI is mandatory"}
    doc.doi = await parseDoi(doc.doi)
    if (doc.doi.error) return doc.doi

    return doc
}

const parseDoi = async function(doi){
    if (doi.startsWith("https")){
        if (!(doi.startsWith('https://doi.org/')))
            return {error: 'DOI is not valid'}
    } else {
        doi = "https://doi.org/" + doi
    }

    // some dois does not allow to be fetched
    // console.log(doi)
    // const response = await fetch(doi)
    // console.log(response)
    // const status = await response.status
    // console.log(status)
    // if (!([200, 201, 202].includes(status))) return {error: "DOI is not valid"}

    return doi
}

const validatePollutants = function(pollutants, nameString = "pollutants"){
    if (!isKeyValueObject(pollutants)) return {error: nameString + " must be an object"}
    let error = {};
    for (const [key, value] of Object.entries(pollutants)) {
        // check that pollutant is in gl.concentrations
        if (isDefined(value)){
            if (!gl.concentrations.includes(key))
            {
                error[key] = `${nameString}.${key} is not a valid pollutant`;
            }

            // check that in is provided if out is provided
            if (key.endsWith("out")) {
                const inKey = key.replace("_out", "_in")
                if (!Object.keys(pollutants).includes(inKey))
                {
                    error[key] = `${nameString}.${key} is provided but not ${nameString}.${inKey}`;
                }
            }

            // check that in and out are always provided
            if (key.endsWith("in") && key !== "bod_in") {
                const outKey = key.replace("_in", "_out")
                if (!Object.keys(pollutants).includes(outKey))
                {
                    error[key] = `${nameString}.${key} is provided but not ${nameString}.${outKey}`
                }
            }

            if (!isNotNegative(value))
            {
                error[key] =  `pollutants.${key} must be a positive number`;
            }
            // Units asked are cfu/100mL but the database stores cfu/L
            if (key.startsWith("ecoli")) pollutants[key] = Number(value) * 10;

            pollutants[key] = Number(value)
        };
    };

    return {pollutants: pollutants, error: error};
}

module.exports = {
    isPositive,
    isNotNegative,
    climate,
    filterLevels,
    avgKey,
    isKeyValueObject,
    parseDoi,
    validateDocumentInfo,
    isDefined,
    validatePollutants,
    isString
}