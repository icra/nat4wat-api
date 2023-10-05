var express = require('express');
const {waterTypes} = require("../lib/globals");
var router = express.Router();

router.get('/water-types', function(req, res) {
  res.send(waterTypes);
});

module.exports = router;