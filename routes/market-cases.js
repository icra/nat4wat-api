var express = require('express');
var router = express.Router();

const {addMarketCase} = require("../lib/add-market-case");
const {readCases,publishMarketCase} = require("../lib/database");
const auth = require('../middleware/auth');
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Create directory if it doesn't exist
const dir = './images/market-cases';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/market-cases/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Appending timestamp
    }
});

const upload = multer({ storage: storage });


router.get('/', async function(req, res){
    console.log(req.query);
    let db = await readCases(req.query);
    res.send(db)
});

router.post('/add-case', upload.single('file'),auth.auth, async function(req, res){
    try {
        let file = req.file;
        let body = JSON.parse(req.body.data);

        if (file) {
            body.img = file.path; // Adding file path to object
        }

        body.id_user = req.data.id;

        let response = await addMarketCase(body);
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
