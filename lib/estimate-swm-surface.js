const pl = require('nodejs-polars')
const gl = require("./globals")
const {isPositive} = require("./utils");


const estimateSwmSurface = function(body, df){

    if (!isPositive(body.volume)) return {error: "volume must be a positive number"}

    df = df.toRecords()

    if (body.infiltration === undefined) body.infiltration = 0

    df.forEach(tech => {
        // if technology does not provide infiltration we set infiltration to 0
        let infiltration = body.infiltration * tech.infiltration

        tech.surface_high = body.volume / (0.024 * infiltration + tech.storage_capacity_low * tech.depth)
        tech.surface_low = body.volume / (0.024 * infiltration + tech.storage_capacity_high * tech.depth)

        if (tech.surface_low === tech.surface_high) {
            tech.surface_low = tech.surface_high * (1 - gl.uncertainty)
        }

        tech.surface_mean = (tech.surface_low + tech.surface_high) / 2

        tech.vertical_surface_mean = 0
        tech.vertical_surface_high = 0
        tech.vertical_surface_low = 0

        if (body.area !== undefined){
            tech.enough_area = tech.surface_high <= body.area
            let real_area = tech.enough_area ? tech.surface_high : body.area
            tech.daily_volume = real_area * (0.024 * infiltration + tech.storage_capacity_low * tech.depth)
        } else {
            tech.daily_volume = tech.surface_high * (0.024 * infiltration + tech.storage_capacity_low * tech.depth)
        }




    })

    // TODO: compare area and volume and return max surface and volume handled or surface needed to handle all volume

    return pl.readRecords(df)
}

module.exports = {
    estimateSwmSurface
}