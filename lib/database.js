const pl = require("nodejs-polars")
let sqlite = require('sqlite3').verbose();
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

read_all_db = function(){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             *
             FROM all_case_studies
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

    if (records) return db;

    let df = pl.readRecords(db);

    return df
}

module.exports = {
    read_all_db,
    db_to_polars
}
