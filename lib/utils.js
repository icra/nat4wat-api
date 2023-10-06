const pl = require("nodejs-polars");
const fetch = require("node-fetch");
const {isNull} = require("util");

const isPositive = function(number){
    if (isNaN(number) || number === null) return false
    return number > 0;
};
const isKeyValueObject = function(obj) {
    return (obj instanceof Object) && !(obj.constructor===Array)
}

const isString = function(string){
    return (typeof string === "string" && string.length > 0)
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
    if (!isKeyValueObject(doc)) return {error: "document must be an object"}
    if (!isString(doc.title)) return {error: "document.title must be a string"}
    if (doc.authors !== undefined && !isString(doc.authors)) return {error: "document.authors must be a string"}
    if (doc.journal !== undefined && !isString(doc.journal)) return {error: "document.journal must be a string"}
    let currentYear = new Date().getFullYear()
    if (!isPositive(doc.year) || doc.year < 1950 || doc.year > currentYear) return {error: "document.year must be a positive number between 1950 and current year"}
    if (doc.startPage !== undefined && !isPositive(doc.startPage)) return {error: "document.startPage must be a positive number"}
    if (doc.endPage !== undefined && !isPositive(doc.endPage)) return {error: "document.endPage must be a positive number"}
    if (doc.startPage > doc.endPage) return {error: "document.startPage must be lower than document.endPage"}

    // Validate DOI
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

    const response = await fetch(doi)
    const status = await response.status

    if (!([200, 201, 202].includes(status))) return {error: "DOI is not valid"}

    return doi
}

module.exports = {
    isPositive,
    climate,
    filterLevels,
    avgKey,
    isKeyValueObject,
    parseDoi,
    validateDocumentInfo
}