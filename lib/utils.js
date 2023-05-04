const isPositive = function(number){
    if (isNaN(number)) return false
    if (number < 0) return false
    return true
};

const climate = function(avgTemperature){
    if (avgTemperature < -3) return "continental";
    if (avgTemperature < 18) return "temperate";
    if (avgTemperature >= 18) return "tropical";
    return null
}

module.exports = {
    isPositive,
    climate
}