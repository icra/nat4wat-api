var express = require('express');
var router = express.Router();

const excels = require("../lib/excel_utils")
const gl = require("../lib/globals")

router.get(['/docs', '/treatment'], function(req, res){
    res.render('docs-treatment.pug', {
        title: "SNAPP API v2 - documentation",
        url: process.env.URL,
        technologies: excels.read_excel(),
        waterTypes: Object.keys(gl.waterTypes),
        climates: gl.climate
    });
});

module.exports = router;
