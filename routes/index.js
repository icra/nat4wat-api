var express = require('express');
var router = express.Router();
const dotenv = require('dotenv')
dotenv.config()

const excels = require("../lib/excel_utils")
const gl = require("../lib/globals")
const {insertTokens, getUws} = require("../lib/database");

router.get(['/', '/docs'], async function(req, res){
    res.render('docs.pug', {
        title: "Nat4Wat API - documentation",
        url: process.env.URL,
        technologies: excels.readTechnologiesExcel(),
        waterTypes: Object.keys(gl.waterTypes),
        climates: gl.climate,
        ecosystemServices: gl.ecosystemServices,
        weights: gl.wAccepted,
        pollutants: gl.pollutants,
        uws: await getUws(),
        polUnits: gl.concentrationsUnits,
        soils: Object.keys(gl.infiltrationSoils),
    });
});

module.exports = router;
