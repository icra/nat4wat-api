const pl = require("nodejs-polars");
const fetch = require("node-fetch");

const isPositive = function(number){
    if (isNaN(number)) return false
    return number > 0;

};
const isKeyValueObject = function(obj) {
    return (obj instanceof Object) && !(obj.constructor===Array)
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
    parseDoi
}