var express = require('express');
var router = express.Router();

const excels = require("../lib/excel_utils")
const readDB = require("../lib/database")

/* GET home page. */
router.get('/filtering', function(req, res, next) {

  res.send(excels.read_excel());
});

router.get('/db', async function(req, res){
  let records = false
  if (req.query.records === 'true') records = true
  let db = await readDB.db_to_polars(records = records);
  res.send(db)
});

module.exports = router;
