const isPositive = function(number){
    if (isNaN(number)) return false
    if (number < 0) return false
    return true
}

module.exports = {
    isPositive
}