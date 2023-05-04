const pl = require('nodejs-polars')
const gl = require('./globals')

const estimateSurface = function(body, techs){
    // return the best estimation based on cascade model

    // m2/pe
    // calculate pe
    if (body.inhabitants === undefined) body.inhabitants = body.inflow / body.litresPerson
    let pe = body.inhabitants * gl.waterTypes[body.waterType]

    colClimate = 'ratio_' + body.climate + '_climate'

    // surface = pe * ratio_climate
    techs = techs.withColumn(pl.col(colClimate).mul(pe).alias("surface_mean"))
        .withColumn(pl.col(colClimate).mul(pe).mul(0.9).alias("surface_low"))
        .withColumn(pl.col(colClimate).mul(pe).mul(1.1).alias("surface_high"))

    return techs
}

module.exports = {
    estimateSurface
}