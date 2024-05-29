const pl = require('nodejs-polars')
const gl = require("./globals")
const {isPositive, isNotNegative} = require("./utils");


const estimateSwmSurface = function(body, df){

   // calculate Q in m3
    let Q = body.spilledVolume

    // convert duration from hours to seconds
    let t = body.duration * 3600

    // set infiltration in the receiving environment using infiltration or infiltrationSoils
    if (body.infiltration !== undefined){
        if (!isNotNegative(body.infiltration)) return {error: "infiltration must be a positive number"}
        body.infiltration = body.infiltration / 3600 // convert from mm/h to mm/s
    } else {
        if (body.infiltrationSoils !== undefined){
            if (gl.infiltrationSoils[body.infiltrationSoils] === undefined) return {error: "infiltrationSoils must be one of the following: sand, loamySand, sandyLoam, siltLoam, sandyClayLoam, clayLoam, siltyClayLoam, clay"}
            body.infiltration = gl.infiltrationSoils[body.infiltrationSoils].ks / 3600 // convert from mm/h to mm/s
        } else {
            body.infiltration = 0
        }
    }

    // filter technolgies that only infiltrate in the receiving environment
    if ( body.infiltration === 0 &&
        (body.drainagePipeDiameter === undefined || body.drainagePipeDiameter === 0)
    ){
        df = df.filter(pl.col('hc_low').gt(0))
        df = df.filter(pl.col('storage_capacity_low').gt(0))
    }

    // set drainage pipe flow
    let Q_d = 0
    if (body.drainagePipeDiameter !== undefined) {
        if (!isNotNegative(body.drainagePipeDiameter)) return {error: "drainagePipeDiameter must be a positive number"}
        Q_d = calculatePipeFlow(body.drainagePipeDiameter)
    }

    df = df.toRecords()

    df.forEach(tech => {
        // if technology does not provide infiltration we set infiltration to 0
        infiltration = tech.infiltration === 0 ? 0 : body.infiltration

        tech.surface_low = calculateSurface(
            hc_t = tech.hc_high,               // mm/s
            phi = tech.storage_capacity_high,  // m
            Q = Q,                              // m3/s
            Q_d = Q_d,                        // m3/s
            hc_s = infiltration,              // mm/s
            H = tech.depth,                     // m
            t = t)                              // s

        tech.surface_high = calculateSurface(
            hc_t = tech.hc_low,
            phi = tech.storage_capacity_low,
            Q = Q,
            Q_d = Q_d,
            hc_s = infiltration,
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
            tech.max_volume = calculateVolume(
                A = real_area,
                Kc_t = tech.hc_low,
                phi = tech.storage_capacity_low,
                Q_d = Q_d,
                hc_s = infiltration,
                H = tech.depth,
                t = t)
        } else {
            tech.max_volume = calculateVolume(
                A = tech.surface_high,
                hc_t = tech.hc_low,
                phi = tech.storage_capacity_low,
                Q_d = Q_d,
                hc_s = infiltration,
                H = tech.depth,
                t = t)
        }
   })

    return pl.readRecords(df)
}

const calculatePipeFlow = function(D){
    let A = Math.PI * Math.pow(D / 2, 2)
    let P = Math.PI * D
    let Hr = Math.pow(A / P, 2 / 3)
    let n = 0.011
    let S = Math.pow(0.03, 1 / 2)

    return (A * (1 / n) * Hr * S)
}

const calculateSurface = function(hc_t, phi, Q, Q_d, hc_s, H, t){
    // convert hc from mm/s to m/s
    let Kt = hc_t / 1000
    let Ks = hc_s / 1000

    let t_0
    let t_1

    if (Kt * t < H){
        t_0 = t
        t_1 = 0
    } else {
        t_0 = H / Kt
        t_1 = t - t_0
    }
    return (Q - Q_d * t_1) / (phi * Kt * t_0 + Ks * t_1)
}

const calculateVolume = function(A, hc_t, phi, Q_d, hc_s, H, t){
    let t_0
    let t_1

    // convert hc from mm/s to m/s
    let Kt = hc_t / 1000
    let Ks = hc_s / 1000

    if (Kt * t < H){
        t_0 = t
        t_1 = 0
    } else {
        t_0 = H / Kt
        t_1 = t - t_0
    }
    return A * (phi * Kt * t_0 + Ks * t_1) + Q_d * t_1
}






module.exports = {
    estimateSwmSurface
}