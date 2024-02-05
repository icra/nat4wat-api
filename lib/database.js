const pl = require("nodejs-polars")
let mysql = require("mysql");
const util = require('util');
const dotenv = require('dotenv')
const gl = require("./globals");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
let jwtConfig =  {secret: '654f4b5b708af8bcdfb367cd19211fc5fbb9fe7388443809fd2cd142cfc38d0·'};
const nodemailer = require("nodemailer");
const uuid = require('uuid');

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
             FROM treatment_sci_publication_details
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

readPublications = function(status = "accepted"){
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
             id, type, sub_type, title, doi, year, authors, journal, issue, start_page, end_page, validation_status
             FROM sci_publications
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

let sciStudiesToPolars = async function(records = false){

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

const insertTreatmentSciDetails = function(body){
    // TODO: combine with insertSciPublication to insert with foreign key
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

const queryModel = function(tech, pol){
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

const closeDB = function(){
    connection.end()
    return 0
}

let register = function (user) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(user.password, 10, function (err, hash) {
            if (err) {
                console.log(err);
                reject({
                    success: false,
                    error: 'Error hashing password.',
                    message: 'Something went wrong. Please try again or contact an administrator.'
                });
            } else {
                let userData = JSON.stringify(user.data);

                let sql = `INSERT INTO users (email, password, data) VALUES (?, ?, ?);`;
                connection.query(sql, [user.email, hash, userData], function (err, rows) {
                    if (!err) {
                        resolve({
                            success: true,
                            message: 'User registered successfully.'
                        });
                    } else {
                        console.log('error',err);
                        reject({
                            success: false,
                            error: err,
                            message: 'Something went wrong. Please try again or contact an administrator.'
                        });
                    }
                });
            }
        });
    });
}

let login = function (username, password, remember = false) {
    return new Promise((resolve, reject) => {
        connection.query(`
                    SELECT *
                    FROM users
                    WHERE email = '${username}';
            `,
            function (err, rows) {
                if (!err) {
                    if (rows.length) {
                        let user = rows[0];
                        bcrypt.compare(password, user.password, function (err, res) {
                            if (err)
                            {
                                reject(err);
                            }
                            if (res)
                            {
                                jwt.sign(
                                    {
                                        id: rows[0].id
                                    },
                                    jwtConfig.secret,
                                    {
                                        expiresIn: remember ? '7d' : '1d'
                                    },
                                    function (err, token) {
                                        if (err) reject(err);

                                        connection.query(
                                            `UPDATE users
                                             SET last_login = now()
                                             WHERE id = '${user.id}'`
                                        );
                                        resolve({
                                            message: 'Logged in successfully',
                                            token,
                                            success: true,
                                            user: {
                                                id: user.id,
                                                username: user.username,
                                                email: user.email,
                                                data: JSON.parse(user.data)
                                            }
                                        });
                                    }
                                );
                            } else {
                                console.log("Password is incorrect", password, user.password);
                                resolve({
                                    message: 'Email or password is incorrect',
                                    success: false,
                                })
                            }
                        });
                    }
                    else
                    {
                        resolve({
                            message: 'Something went wrong',
                            success: false,
                        })
                    }
                }
                else
                {
                    reject(err);
                }
            });
    });
}

let sendRecoveryPassword = function (email,referer) {
    return new Promise((resolve, reject) => {
        connection.query(`
                    SELECT *
                    FROM users
                    WHERE email = '${email}';
            `,
            function (err, rows) {
                if (!err) {
                    if (rows.length) {
                        // create a new object with the data from the database

                        let transporter = nodemailer.createTransport({
                            host: process.env.MAIL_HOST,
                            port: process.env.MAIL_PORT,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: process.env.MAIL_USER,
                                pass: process.env.MAIL_PASS,
                            },
                        });
                        let token = uuid.v4();
                        connection.query(`INSERT INTO password_token (email,token,created_at) VALUES ('${email}','${token}', now());`,
                            (err, result) => {
                                console.log('insert result',result);
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                }
                                else
                                {
                                    var mailOptions = {
                                        from: process.env.MAIL_USER,
                                        to: email,
                                        subject: 'RESET PASSWORD',
                                        html: '<html><body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;"> <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: \'Open Sans\', sans-serif;"> <tr> <td> <table style="background-color: #f2f3f8; max-width:670px; margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0"> <tr> <td style="height:80px;">&nbsp;</td></tr><tr> <td style="height:20px;">&nbsp;</td></tr><tr> <td> <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);"> <tr> <td style="height:40px;">&nbsp;</td></tr><tr> <td style="padding:0 35px;"> <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:\'Rubik\',sans-serif;">You have requested to reset your password</h1> <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span> <p style="color:#455056; font-size:15px;line-height:24px; margin:0;"> To reset your password, click the following link and follow the instructions. </p><a href="'+referer+'recover-password/'+token+'" style="background:#5d8f49;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset Password</a> </td></tr><tr> <td style="height:40px;">&nbsp;</td></tr></table> </td><tr> <td style="height:20px;">&nbsp;</td></tr><tr> <td style="text-align:center;"> <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong><a href=\'https://snappapi-v2.icradev.cat/\'>snappapi-v2.icradev.cat</<></strong></p></td></tr><tr> <td style="height:80px;">&nbsp;</td></tr></table> </td></tr></table> </body></html>'
                                    };

                                    transporter.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                            resolve({
                                                success: false,
                                                message: 'Something went wrong try again later.'
                                            });
                                        } else {
                                            console.log('Email sent: ' + info.response);
                                            resolve({
                                                success: true,
                                                message: 'Email sended please follow the email link.'
                                            });
                                        }
                                    });
                                }
                            });
                    }
                    else {
                        console.log("User not found", email);
                        resolve({
                            success: false,
                            message: 'Something went wrong.'
                        })
                    };
                } else
                {
                    reject(err);
                }
            });
    });
}

let updatePassword = function (password,token) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM password_token WHERE token = '+connection.escape(token)+' AND created_at >= NOW() - INTERVAL 1 DAY;',
            (err, result) => {
                if (err)
                {
                    reject(err);
                }
                else if(!result.length) {
                    resolve({
                        message: 'Invalid token',
                        success: false
                    });
                }
                else
                {
                    let email = result[0].email;

                    bcrypt.hash(password, 10, (err, hash) => {
                        if (err)
                        {
                            reject(err);
                        }
                        else {
                            // has hashed pw => add to database
                            connection.query('UPDATE users SET password = '+connection.escape(hash)+' WHERE email = '+connection.escape(email)+';',
                                (err, result) => {
                                    if (err)
                                    {
                                        reject(err);
                                    }
                                    else
                                    {
                                        resolve({
                                            message: 'Password updated!',
                                            success: true
                                        });
                                        connection.query('DELETE FROM password_token WHERE token = '+connection.escape(token),
                                            (err, result) => {
                                                if (err) {
                                                    reject(err);
                                                }
                                                resolve({
                                                    message: 'Password updated!',
                                                    success: true
                                                });
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    });
                }

            });
    });

}



module.exports = {
    openDB,
    readSciStudies,
    readPublications,
    deleteSciStudyDB,
    insertTreatmentSciDetails,
    insertSciPublication,
    sciStudiesToPolars,
    getTokens,
    insertTokens,
    closeDB,
    getUws,
    addRegressionModel,
    queryModel,
    register,
    login,
    sendRecoveryPassword,
    updatePassword
}
