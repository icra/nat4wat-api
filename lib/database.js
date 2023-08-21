const pl = require("nodejs-polars")
let mysql = require("mysql");
const util = require('util');
const dotenv = require('dotenv')
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

const closeDB = function(){
    connection.end()
    return 0
}


module.exports = {
    readSciStudies,
    dbToPolars,
    getTokens,
    insertTokens,
    closeDB,
    getUws
}
