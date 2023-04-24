const R = require("r-script")
const db = require("./database")

testR = function(){
    return new Promise((res, rej) => {
        R("R/test.R")
            .call(function(err, out){
                if (err) rej(err)
                res(out)
            })
    }).catch(e => console.error(e))
}

modelTest = async function(){
    let df = await db.db_to_polars()
    df = df.select(["type", "bod_in", "bod_out", "surface", "inflow"])

    return new Promise((resolve, reject) => {
        R("R/model_test.R")
        .data({df: df.toRecords()})
        .call(function(err, out){
            if (err) reject(err);
            resolve(out)
        });
    }).catch(e => console.log(e));

    var out = R("R/model_test.R")
        .data({df: df.toRecords()})
        .callSync();

    return out
};

module.exports = {
    testR,
    modelTest
}