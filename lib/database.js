const pl = require("nodejs-polars")
let mysql = require("mysql");
const util = require('util');
const dotenv = require('dotenv')
const gl = require("./globals");
dotenv.config()
// const {ER_NOT_VALID_PASSWORD} = require("mysql/lib/protocol/constants/errors");

let connection = mysql.createPool({
    connectionLimit : 10,
    supportBigNumbers: true,
    bigNumberStrings: true,
    host     : process.env.HOST_DB,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : "sannat_v2"
});

connection.query = util.promisify(connection.query);

readSciStudies = function(){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             *
             FROM all_case_studies
        `,
        function (err, rows) {
            if(!err){
                if(rows.length) resolve(rows)
                else resolve(null);
            }
            else reject(err);
        });
    });
};

let dbToPolars = async function(records = false){

    let db = await readSciStudies();

    if (records) return db;

    return pl.readRecords(db);

}

let getTokens = function(){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT username, token
             FROM tokens
        `,
            function (err, rows) {
                if(!err){
                    if(rows.length) resolve(rows)
                    else resolve(null);
                }
                else reject(err);
            });
    });
}

const insertTokens = function(username){

    let token = generateToken()

    let query = `
        INSERT INTO tokens (username, token)
        VALUES ('${username}', '${token}')
        `

    return new Promise((resolve, reject) => {
        connection.query(query,
            function (err) {
                if (!err) {
                    resolve(token);
                } else reject (err)
            });
    });
}

const generateToken = function(){
    return rand() + rand()
}
const rand = () => {
    return Math.random().toString(36).slice(2);
};

// Get distinct values from uws column
const getUws = function(){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT DISTINCT uws
             FROM all_case_studies
             WHERE uws IS NOT NULL
        `,
            function (err, rows) {
                if(!err){
                    if(rows.length) resolve(rows.map(r => r.uws))
                    else resolve(null);
                }
                else reject(err);
            });
    });
}

const insertSciStudy = function(body){
    let queryString = `
            INSERT INTO all_case_studies
            (type, sub_type, water_type, uws, doc_data, water_temp, air_temp, surface, hrt, inflow, population, username, email, company, year_operation, 
            ${gl.concentrations.join(", ")})
            VALUES (${'?, '.repeat(32) + '?'})
        `

    let values = [
        body.technology.type, body.technology.techId,
        body.water.type, body.water.urbanWaterSystem,
        JSON.stringify(body.document),
        body.water.temperature, body.water.airTemperature,
        body.technology.surface, body.technology.hrt,
        body.water.inflow, body.technology.peopleServed,
        body.username, body.email, body.company,
        body.technology.yearOperation,
        ...gl.concentrations.map(c => body.pollutants[c])
    ]

    return new Promise((resolve, reject) => {
        connection.query(queryString,
            values,
            function (err) {
                if (!err) {
                    resolve("Case study inserted");
                } else reject (err)
            });
    });
}

const deleteSciStudyDB = function(field, value){
    let queryString = `
            DELETE FROM all_case_studies
            WHERE ${field} = '${value}'
        `
    return new Promise((resolve, reject) => {
        connection.query(queryString,
            function (err) {
                if (!err) {
                    resolve("Case studies deleted");
                } else reject (err)
            });
    });
}

const closeDB = function(){
    connection.end()
    return 0
}


module.exports = {
    readSciStudies,
    deleteSciStudyDB,
    insertSciStudy,
    dbToPolars,
    getTokens,
    insertTokens,
    closeDB,
    getUws
}
