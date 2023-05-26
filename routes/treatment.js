var express = require('express');
var router = express.Router();

const xls = require("../lib/excel_utils")
const readDB = require("../lib/database")
const findNBS = require("../lib/find-nbs")

router.get('/technologies', function(req, res) {
  let id = req.query.id;
  let result = xls.read_excel(id);
  if (result === null) {
    res.statusMessage = "id does not return any technology";
    res.status(400).end();
  } else {
    res.send(result);
  }
});

// TODO: Convert to a post route with filter options
// TODO: Decide whether to use Mysql or sqlite
router.get('/sci-studies', async function(req, res){
  let recordsParam = false
  if (req.query.records === 'true') recordsParam = true
  let db = await readDB.db_to_polars(records = recordsParam);
  console.log(db)
  res.send(db)
});

router.post('/find-nbs', function(req, res){
  try {
    let result = findNBS.findNBS(req.body)

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

router.post('/find-nbs-multiple', function(req, res){
  try {
    let result = findNBS.findNBSMultiple(req.body)
      console.log("result", result)
    if (result.error){
      res.statusMessage = result.error
      // res.status(400)
      res.send(result.error)
    } else {
      res.send(result)
    }
  }
  catch (e){
    res.status(400)
    res.send(e)

  }
})

module.exports = router;


