var express = require('express');
var router = express.Router();

const {addTreatmentSciDetails} = require("../lib/add-treatment-sci-details");
const {deleteSciStudy} = require("../lib/delete-sci-study");
const {sciStudiesToPolars, readPublications} = require("../lib/database");
const {trainRegressionModels} = require("../lib/train-regression-models");
const {addSciPublication} = require("../lib/add-sci-publication");

router.get('/sci-publications', async function(req, res){
    let recordsParam = 'accepted'
    if (req.query.status === 'pending') recordsParam = 'pending'
    let db = await readPublications(status = recordsParam);

    res.send(db)
});

router.get('/sci-studies', async function(req, res){
    let recordsParam = false
    if (req.query.records === 'true') recordsParam = true
    let db = await sciStudiesToPolars(records = recordsParam);

    res.send(db)
});

router.post('/add-sci-publication', async function(req, res){
    try {
        let result = await addSciPublication(req.body)
        // console.log(result)
        if (result.error) {
            res.statusMessage = result.error
            res.status(400)
            res.send(result.error)
        } else {
            res.send(result)
        }
    }
    catch (e){
        res.send(e)
    }
});

router.post('/add-sci-study', async function(req, res){
    try {
        let result = await addTreatmentSciDetails(req.body)
        // console.log(result)
        if (result.error) {
            res.statusMessage = result.error
            res.status(400)
            res.send(result.error)
        } else {
            res.send(result)
        }
    }
    catch (e){
        res.send(e)
    }
});

router.post('/delete-sci-study', async function(req, res){
    try {
        let result = await deleteSciStudy(req.body)
        // console.log(result)
        if (result.error) {
            res.statusMessage = result.error
            res.status(400)
            res.send(result.error)
        } else {
            res.send(result)
        }
    }
    catch (e){
        res.send(e)
    }
});
// TODO: remove async and await once working
router.post('/train-models', async function(req, res){
    let result = await trainRegressionModels(req.body)
    res.send(result)
});

module.exports = router;