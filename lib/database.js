const pl = require("nodejs-polars")
let mysql = require("mysql");
const util = require('util');
const dotenv = require('dotenv')
const gl = require("./globals");
dotenv.config()

const openDB = function(){
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

    return connection
}

const connection = openDB()

readSciStudies = function(status = "accepted"){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             *
             FROM all_case_studies
             WHERE validation_status = '${status}'
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

    return await pl.readRecords(db);

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

const insertSciPublication = function(body){
    let queryString = `
            INSERT INTO sci_publications
            (type, sub_type, title, doi, year, authors, journal, issue, start_page, end_page, username, email, company)
            VALUES (${'?, '.repeat(12) + '?'})
        `

    let values = [
        body.type, body.techId,
        body.title, body.doi, body.year, body.authors, body.journal, body.issue, body.start_page, body.end_page,
        body.username, body.email, body.company
    ]

    return new Promise((resolve, reject) => {
        connection.query(queryString,
            values,
            function (err) {
                if (!err) {
                    resolve("Publication inserted");
                } else reject (err)
            });
    });
}

const addRegressionModel = async function(model){
    let checkIfExists = await queryRegressionModel(model.tech, model.pol)
    if (checkIfExists === null){
        return await insertRegressionModel(model)
    } else {
        return await updateRegressionModel(model)
    }
}

const queryRegressionModel = function(tech, pol){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             *
             FROM regression_models
             WHERE tech = '${tech}' AND poll = '${pol}'
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

const insertRegressionModel = function(model){
    let queryString = `
            INSERT INTO regression_models
            (poll, tech, type, n, min_load_in, max_load_in, intercept, beta_load_removal, std_error, RMAE, null_model)
            VALUES (${'?, '.repeat(10) + '?'})
        `
    let values = [
        model.pol,
        model.tech,
        model.type,
        model.n,
        model.min_load_in,
        model.max_load_in,
        model.intercept,
        model.beta_load_removal,
        model.std_error,
        model.RMAE,
        model.null_model
    ]

    return new Promise((resolve, reject) => {
        connection.query(queryString,
            values,
            function (err) {
                if (!err) {
                    resolve(`Model for ${model.tech} and ${model.pol} inserted`);
                } else reject (err)
            });
    });
}

const updateRegressionModel = function(model){
    let queryString = `
            UPDATE regression_models
            SET type = ?, n = ?, min_load_in = ?, max_load_in = ?, intercept = ?, beta_load_removal = ?, std_error = ?, RMAE = ?, null_model = ?
            WHERE poll = '${model.pol}' AND tech = '${model.tech}'
        `

    let values = [
        model.type,
        model.n,
        model.min_load_in,
        model.max_load_in,
        model.intercept,
        model.beta_load_removal,
        model.std_error,
        model.RMAE,
        model.null_model
    ]

    return new Promise((resolve, reject) => {
        connection.query(queryString,
            values,
            function (err) {
                if (!err) {
                    resolve(`Model for ${model.tech} and ${model.pol} updated`);
                } else reject (err)
            });
    });
}

const closeDB = function(){
    connection.end()
    return 0
}


module.exports = {
    openDB,
    readSciStudies,
    deleteSciStudyDB,
    insertSciStudy,
    insertSciPublication,
    dbToPolars,
    getTokens,
    insertTokens,
    closeDB,
    getUws,
    addRegressionModel
}
