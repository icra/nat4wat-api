var express = require('express');
const {waterTypes, infiltrationSoils, wAcceptedNaming} = require("../lib/globals");
const {insertTokens} = require("../lib/database");
var router = express.Router();

router.get('/water-types', function(req, res) {
  res.send(waterTypes);
});

router.get('/weights', function(req, res) {
  res.send(wAcceptedNaming);
});

router.get('/infiltration-soils', function(req, res) {
  res.send(infiltrationSoils);
});

router.post('/insert-token', async function(req, res){
  if (req.body.password !== process.env.TOKEN_PASSWORD) {
    res.status(401).end()
  } else {
    try {
      let result = await insertTokens(req.body.username)
      res.send(result)
    }
    catch (e) {
      res.status(400).send(e)
    }
  }

});



module.exports = router;