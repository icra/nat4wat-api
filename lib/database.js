const pl = require("nodejs-polars")
let mysql = require('mysql');
const util = require('util');
const dotenv = require('dotenv')
dotenv.config()
// const {ER_NOT_VALID_PASSWORD} = require("mysql/lib/protocol/constants/errors");

let connection = mysql.createPool({
    connectionLimit : 10,
    supportBigNumbers: true,
    bigNumberStrings: true,
    host     : process.env.HOST_DB,
    user     : process.env.USER,
    password : process.env.PASSWORD,
    database : "sannat_v2"
})

// const fields = [
//     "id",
//     "code_cs",
//     "type",
//     "sub_type",
//     "water_type",
//     "doc_data",
//     "uws",
//     "username",
//     "bod_in",
//     "bod_out",
//     "tn_in",
//     "tn_out",
//     "cod_in",
//     "cod_out",
//     "no3_in",
//     "no3_out",
//     "nh4_in",
//     "nh4_out",
//     "tp_in",
//     "tp_out",
//     "po43_in",
//     "po43_out",
//     "water_temp",
//     "air_temp",
//     "ecoli_in",
//     "ecoli_out",
//     "heggs_in",
//     "heggs_out",
//     "surface",
//     "hrt",
//     "inflow",
//     "population",
//     "tn_removal",
//     "bod_removal",
//     "nh4_removal",
//     "po4_removal",
//     "timestamp",
//     "email",
//     "company"]

connection.query = util.promisify(connection.query);

read_all_db = function(){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             *
             FROM case_study
        `,
        function (err, rows) {
            if(!err){
                if(rows.length) resolve(rows) // resolve(Object.values(JSON.parse(JSON.stringify(rows))));
                else resolve(null);
            }
            else reject(err);
        });
    });
};

let db_to_polars = async function(records = false){
    let db = await read_all_db();
    // remove null values
    db.forEach(e => {
        for (field of Object.keys(e)){
            if (e[field] === null) delete e[field]
        }
    })
    let df = pl.readRecords(db);
    if (records) return df.toRecords()
    return df
}

module.exports = {
    read_all_db,
    db_to_polars
}
