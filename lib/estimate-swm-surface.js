const pl = require('nodejs-polars')
const gl = require("./globals")
const {isPositive, isNotNegative} = require("./utils");


const estimateSwmSurface = function(body, df){

    // validate input
    if (!isPositive(body.cumRain)) return {error: "cumRain must be a positive number"}
    if (!isPositive(body.duration)) return {error: "duration must be a positive number"}
    if (!isPositive(body.catchmentArea)) return {error: "catchmentArea must be a positive number"}
    // calculate Q
    let Q = body.cumRain * body.catchmentArea * 0.001

    // convert duration from hours to seconds
    let t = body.duration * 3600

    // set infiltration in the receiving environment
    if (body.infiltration !== undefined){
        if (!isNotNegative(body.infiltration)) return {error: "infiltration must be a positive number"}
    } else {
        body.infiltration = 0
    }

    // filter technolgies that only infiltrate in the receiving environment
    if (body.infiltration === 0){
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
            Kt = tech.hc_high,
            phi = tech.storage_capacity_high,
            Q = Q,
            Q_d = Q_d,
            Ks = infiltration,
            H = tech.depth,
            t = t)

        tech.surface_high = calculateSurface(
            Kt = tech.hc_low,
            phi = tech.storage_capacity_low,
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
            tech.max_volume = calculateVolume(
                A = real_area,
                Kt = tech.hc_low,
                phi = tech.storage_capacity_low,
                Q_d = Q_d,
                Ks = infiltration,
                H = tech.depth,
                t = t)
        } else {
            tech.max_volume = calculateVolume(
                A = tech.surface_high,
                Kt = tech.hc_low,
                phi = tech.storage_capacity_low,
                Q_d = Q_d,
                Ks = infiltration,
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

const calculateSurface = function(Kt, phi, Q, Q_d, Ks, H, t){

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

const calculateVolume = function(A, Kt, phi, Q_d, Ks, H, t){
    let t_0
    let t_1

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