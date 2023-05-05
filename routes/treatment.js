var express = require('express');
var router = express.Router();

const xls = require("../lib/excel_utils")
const readDB = require("../lib/database")
const findNBS = require("../lib/find-nbs")

router.get('/technologies', function(req, res, next) {
  let id = req.query.id;
  let result = xls.read_excel(id);
  if (result === null) {
    res.statusMessage = "id does not return any technology";
    res.status(400).end();
  } else {
    res.send(result);
  };
});

// TODO: Covert to a post route with filter options
router.get('/sci-studies', async function(req, res){
  let records = false
  if (req.query.records === 'true') records = true
  let db = await readDB.db_to_polars(records = records);
  res.send(db)
});

router.post('/find-nbs', function(req, res){
  try {
    let result = findNBS.findNBS(req.body)

    if (result.error) {
      res.statusMessage = result.error
      res.status(400).end()
    } else {
      res.send(result)
    }
  }
  catch (e){
    res.send(e)
  }
});

module.exports = router;


