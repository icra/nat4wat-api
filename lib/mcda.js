const pl = require("nodejs-polars");
const gl = require("./globals")
const utils = require("./utils")

const mcda = function(body){
    if(body === undefined || body.techs === undefined) return {error: "techs must be defined"}
    if(!(body.techs instanceof Array)) return {error: "techs must be an array of technologies"}

    // let df = pl.readCSV("public/technologies.csv")
    df = body.techs

    df.forEach(tech => {
        let techEs = Object.keys(tech)
            .filter((key) => key.startsWith("es_"))
            .reduce((obj, key) => {
                return Object.assign(obj, {
                    [key]: tech[key]
                });
            }, {});
        // Calculate average of all ecosystem services and scale between 0 and 1.
        tech.multifunctionality = (Object.values(techEs).reduce((a, b) => a + b, 0) / Object.values(techEs).length)/3
    })

    // Operation & manteinance
    df.forEach(tech => {
        // calculate, normalize and invert score (0 worse and 1 better)
        tech.operation = 1-(((tech.inv_es_manpower + tech.inv_es_skills)/2)/3)
    })

    // Surface requirements
    if (df[0].surface_mean !== undefined){
        let surfaces = df.map(tech => tech.surface_mean + tech.vertical_surface_mean)
        let max_surface = Math.max(...surfaces)

        df.forEach(tech => {
            tech.spaceRequirements = (tech.surface_mean + tech.vertical_surface_mean)/max_surface
        })
    }


    return(df)
}

module.exports = {
    mcda
}