const pl = require('nodejs-polars')
const gl = require("./globals")
const {isPositive} = require("./utils");


const estimateSwmSurface = function(body, df){
    console.log("estimating swm surface...")
    if (!isPositive(body.cumRain)) return {error: "cumRain must be a positive number"}
    if (!isPositive(body.duration)) return {error: "duration must be a positive number"}
    if (!isPositive(body.catchmentArea)) return {error: "catchmentArea must be a positive number"}

    // calculate Q
    let Q = body.cumRain * body.catchmentArea * 0.001

    // convert duration from hours to seconds
    let t = body.duration * 3600

    // set infiltration in the receiving environment
    if (body.infiltration !== undefined){
        if (!isPositive(body.infiltration)) return {error: "infiltration must be a positive number"}
    } else {
        body.infiltration = 0
    }

    // set drainage pipe flow
    let Q_d = 0
    if (body.drainagePipeDiameter !== undefined) {
        if (!isPositive(body.drainagePipeDiameter)) return {error: "drainagePipeDiameter must be a positive number"}
        Q_d = calculatePipeFlow(body.drainagePipeDiameter)
    }

    df = df.toRecords()

    df.forEach(tech => {
        // if technology does not provide infiltration we set infiltration to 0
        infiltration = tech.infiltration === 0 ? 0 : body.infiltration

        tech.surface_low = calculateSurface(
            Kt = tech.hc_low,
            phi = tech.storage_capacity_low,
            Q = Q,
            Q_d = Q_d,
            Ks = infiltration,
            H = tech.depth,
            t = t)

        tech.surface_high = calculateSurface(
            Kt = tech.hc_high,
            phi = tech.storage_capacity_high,
            Q = Q,
            Q_d = Q_d,
            Ks = infiltration,
            H = tech.depth,
            t = t)

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
        console.log("tech at the end", tech)
   })

    // TODO: compare area and volume and return max surface and volume handled or surface needed to handle all volume
    console.log(df)
    return pl.readRecords(df)
}

calculatePipeFlow = function(D){
    let A = Math.PI * Math.pow(D / 2, 2)
    let P = Math.PI * D
    let Hr = Math.pow(A / P, 2 / 3)
    let n = 0.011
    let S = Math.pow(0.03, 1 / 2)

    return (A * (1 / n) * Hr * S)
}

calculateSurface = function(Kt, phi, Q, Q_d, Ks, H, t){
    console.log("calculating surface...")
    let t_0
    let t_1

    if (Kt * t <= H){
        t_0 = t
        t_1 = 0
    } else {
        t_0 = H / Kt
        t_1 = t - t_0
    }
    console.log("t_0", t_0)
    console.log("t_1", t_1)
    console.log("A", (phi * Kt * t_0 + Ks * t_1))
    let A = (Q - Q_d) / (phi * Kt * t_0 + Ks * t_1)
    console.log("A", A)
    return A
}






module.exports = {
    estimateSwmSurface
}