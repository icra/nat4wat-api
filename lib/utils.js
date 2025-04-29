const pl = require("nodejs-polars");
const fetch = require("node-fetch");
const {isNull} = require("util");
const gl = require("./globals");
const nodemailer = require("nodemailer");

const isPositive = function(number){
    if (isNaN(number) || number === null) return false
    return number > 0;
};

const isNotNegative = function(number){
    if (isNaN(number) || number === null) return false
    return number >= 0;
}

const isKeyValueObject = function(obj) {
    return (obj instanceof Object) && !(obj.constructor===Array)
}

const isString = function(string){
    return (typeof string === "string" && string.length > 0)
}

const isDefined = function(value){
    return value !== undefined && value !== null
}

const climate = function(avgTemperature){
    if (avgTemperature < -3) return "continental";
    if (avgTemperature < 18) return "temperate";
    if (avgTemperature >= 18) return "tropical";
    return null
};

const filterLevels = function(df, body, feature, column, df_table) {
    if (![0, 1, 2, 3].includes(body[feature])) return [{error: `${feature} must be between 0 and 3`}, dt_table]
    df = df.filter(pl.col(column).ltEq(body[feature]))
    if(df_table) df_table = df_table.withColumn(pl.col(column).ltEq(body[feature]).alias(`table_${column}`))
    return [df, df_table]
}

const avgKey = function(object, key){
    return object.reduce((total, next) => total + next[key], 0) / object.length
};

const validateDocumentInfo = async function(doc){
    // TODO: Check if title and doi already exist in the db
    if (!isKeyValueObject(doc)) return {error: "document must be an object"}
    if (!isString(doc.title)) return {error: "document.title must be a string"}
    if (doc.authors !== undefined && !isString(doc.authors)) return {error: "document.authors must be a string"}
    if (doc.journal !== undefined && !isString(doc.journal)) return {error: "document.journal must be a string"}
    let currentYear = new Date().getFullYear()
    if (!isPositive(doc.year) || doc.year < 1950 || doc.year > currentYear) return {error: "document.year must be a positive number between 1950 and current year"}
    if (isDefined(doc.startPage) && !isPositive(doc.startPage)) return {error: "document.startPage must be a positive number"}
    if (isDefined(doc.endPage) && !isPositive(doc.endPage)) return {error: "document.endPage must be a positive number"}
    if (doc.startPage > doc.endPage) return {error: "document.startPage must be lower than document.endPage"}

    // Validate DOI
    console.log()
    if (doc.doi === null || doc.doi === undefined) return {error: "DOI is mandatory"}
    doc.doi = await parseDoi(doc.doi)
    if (doc.doi.error) return doc.doi

    return doc
}

const parseDoi = async function(doi){
    if (doi.startsWith("https")){
        if (!(doi.startsWith('https://doi.org/')))
            return {error: 'DOI is not valid'}
    } else {
        doi = "https://doi.org/" + doi
    }

    // some dois does not allow to be fetched
    // console.log(doi)
    // const response = await fetch(doi)
    // console.log(response)
    // const status = await response.status
    // console.log(status)
    // if (!([200, 201, 202].includes(status))) return {error: "DOI is not valid"}

    return doi
}

const validatePollutants = function(pollutants, nameString = "pollutants"){
    if (!isKeyValueObject(pollutants)) return {error: nameString + " must be an object"}
    let error = {};
    for (const [key, value] of Object.entries(pollutants)) {
        // check that pollutant is in gl.concentrations
        if (isDefined(value)){
            if (!gl.concentrations.includes(key))
            {
                error[key] = `${nameString}.${key} is not a valid pollutant`;
            }

            // check that in is provided if out is provided
            if (key.endsWith("out")) {
                const inKey = key.replace("_out", "_in")
                if (!Object.keys(pollutants).includes(inKey))
                {
                    error[key] = `${nameString}.${key} is provided but not ${nameString}.${inKey}`;
                }
            }

            // check that in and out are always provided
            if (key.endsWith("in") && key !== "bod_in") {
                const outKey = key.replace("_in", "_out")
                if (!Object.keys(pollutants).includes(outKey))
                {
                    error[key] = `${nameString}.${key} is provided but not ${nameString}.${outKey}`
                }
            }

            if (!isNotNegative(value))
            {
                error[key] =  `pollutants.${key} must be a positive number`;
            }
            // Units asked are cfu/100mL but the database stores cfu/L
            if (key.startsWith("ecoli")) pollutants[key] = Number(value) * 10;

            pollutants[key] = Number(value)
        };
    };

    return {pollutants: pollutants, error: error};
}

const sendHelpdeskRequest = async function(email, section, report_type, description)
{
    let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    const safeDescription = description
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

    // build the HTML exactly like your password-reset template
    const htmlBody = `
        <html>
          <body marginheight="0" topmargin="0" marginwidth="0" style="margin:0; background-color:#f2f3f8;">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                   style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family:'Open Sans',sans-serif;">
              <tr><td>
                <table style="background-color:#f2f3f8; max-width:670px; margin:0 auto;" width="100%" border="0"
                       align="center" cellpadding="0" cellspacing="0">
                  <tr><td style="height:80px;">&nbsp;</td></tr>
                  <tr><td style="height:20px;">&nbsp;</td></tr>
                  <tr><td>
                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                           style="max-width:670px; background:#fff; border-radius:3px; text-align:left;
                                  -webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);
                                  -moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);
                                  box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                      <tr><td style="height:40px;">&nbsp;</td></tr>
                      <tr><td style="padding:0 35px;">
                        <h1 style="color:#1e1e2d; font-weight:500; margin:0; font-size:32px;
                                   font-family:'Rubik',sans-serif;">
                          New Helpdesk Submission
                        </h1>
                        <span style="display:inline-block; vertical-align:middle; margin:29px 0 26px;
                                     border-bottom:1px solid #cecece; width:100px;"></span>
        
                        <p style="color:#455056; font-size:15px; line-height:24px; margin:0;">
                          <strong>From:</strong> ${email}
                        </p>
                        <p style="color:#455056; font-size:15px; line-height:24px; margin:0;">
                          <strong>Section:</strong> ${section}
                        </p>
                        <p style="color:#455056; font-size:15px; line-height:24px; margin:0;">
                          <strong>Request type:</strong> ${report_type}
                        </p>
                        <p style="color:#455056; font-size:15px; line-height:24px; margin:0;">
                          <strong>Description:</strong><br/>${safeDescription}
                        </p>
        
                      </td></tr>
                      <tr><td style="height:40px;">&nbsp;</td></tr>
                    </table>
                  </td></tr>
                  <tr><td style="height:20px;">&nbsp;</td></tr>
                  <tr><td style="text-align:center;">
                  </td></tr>
                  <tr><td style="height:80px;">&nbsp;</td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
        `;


    const mailOptions = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_NOTIFICATIONS,
        subject: `[Helpdesk] ${report_type} in ${section}`,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: 'Thank you! Your request has been sent.',
        };
    } catch (error) {
        console.error('Error sending helpdesk mail:', error);
        return {
            success: false,
            message: 'Something went wrong sending your request.',
        };
    }
}

module.exports = {
    isPositive,
    isNotNegative,
    climate,
    filterLevels,
    avgKey,
    isKeyValueObject,
    parseDoi,
    validateDocumentInfo,
    isDefined,
    validatePollutants,
    isString,
    sendHelpdeskRequest
}