var express = require('express');
var router = express.Router();

const {addMarketCase} = require("../lib/add-market-case");
const {readCases,publishMarketCase} = require("../lib/database");
const auth = require('../middleware/auth');

router.get('/', async function(req, res){
    console.log(req.query);
    let db = await readCases(req.query);
    res.send(db)
});

router.post('/add-case', auth.auth, async function(req, res){
    try {
        req.body.id_user = req.data.id;
        let response = await addMarketCase(req.body);
        console.log('response',response);
        res.send(response);
    }
    catch (e){
        console.log('error',e);
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
        let response = await publishMarketCase(req.body);
        console.log('response',response);
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
module.exports = router;
