var express = require('express');
var router = express.Router();

const msg = '/treatment endpoint has been deprecated. Visit /docs to find the new endpoints'

router.get('/technologies', function(req, res) {
  res.status(404)
  res.send(msg)
});

router.post('/find-nbs', function(req, res){
  res.statusMessage = msg;
  res.status(404).end();
});

router.post('/find-nbs-multiple', function(req, res){
  res.statusMessage = msg;
  res.status(404).end();
})

router.post('/mcda', function (req, res) {
  res.statusMessage = msg;
  res.status(404).end();
})

module.exports = router;


