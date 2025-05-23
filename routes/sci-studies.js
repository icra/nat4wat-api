var express = require('express');
var router = express.Router();

const {addTreatmentSciDetails} = require("../lib/add-treatment-sci-details");
const {deleteSciStudy} = require("../lib/delete-sci-study");
const {sciStudiesToPolars, readPublications,publishSciPublication,publishTreatment, readTreatments, deleteSciPublication,deleteTreatment,
    identifyRequest
} = require("../lib/database");
const {trainRegressionModels} = require("../lib/train-regression-models");
const {addSciPublication} = require("../lib/add-sci-publication");
const auth = require('../middleware/auth');

router.get('/sci-publications', async function(req, res){
    if (req.headers['user-agent'] !== 'nat4wat') {
        identifyRequest(req)
            .then(result => console.log(result))
            .catch(e => console.log(e))
    }

    let db = await readPublications(req.query);
    res.send(db)
});

router.get('/treatments', async function(req, res){
    let db = await readTreatments(req.query);
    res.send(db)
});

router.get('/sci-studies', async function(req, res){
    if (req.headers['user-agent'] !== 'nat4wat') {
        identifyRequest(req)
            .then(result => console.log(result))
            .catch(e => console.log(e))
    }

    let recordsParam = false
    if (req.query.records === 'true') recordsParam = true
    let db = await sciStudiesToPolars(records = recordsParam);
    res.send(db)
});

router.post('/add-sci-publication', auth.auth, async function(req, res){
    if (req.headers['user-agent'] !== 'nat4wat') {
        identifyRequest(req)
            .then(result => console.log(result))
            .catch(e => console.log(e))
    }

    try {
        req.body.id_user = req.data.id;
        let response = await addSciPublication(req.body);
        res.send(response);
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});


router.post('/publish', auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let response = await publishSciPublication(req.body);
        res.send(response);
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

router.post('/delete', auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let response = await deleteSciPublication(req.body);
        res.send(response);
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

router.post('/publish-treatment', auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let response = await publishTreatment(req.body);
        res.send(response);
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

router.post('/add-sci-study', auth.auth, async function(req, res){
    try {
        req.body.user_data = req.data;
        let response = await addTreatmentSciDetails(req.body)
        res.send(response);
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

router.post('/delete-sci-study',auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let result = await deleteSciStudy(req.body)
        if (result.error) {
            res.statusMessage = result.error
            res.status(400)
            res.send(result.error)
        } else {
            res.send(result)
        }
    }
    catch (e){
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

// TODO: remove async and await once working
router.post('/train-models', async function(req, res){
    let result = await trainRegressionModels(req.body)
    res.send(result)
});

router.post('/delete-treatment',auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let result = await deleteTreatment(req.body)
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
        res.send({
            success:false,
            error: e,
            message: 'Something went wrong, please try again.'
        });
    }
});

module.exports = router;