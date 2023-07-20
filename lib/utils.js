const pl = require("nodejs-polars");
const isPositive = function(number){
    if (isNaN(number)) return false
    return number > 0;

};

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

module.exports = {
    isPositive,
    climate,
    filterLevels,
    avgKey
}