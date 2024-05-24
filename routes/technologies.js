var express = require('express');
var router = express.Router();

const xls = require("../lib/excel_utils")
const {getScenarios,deleteScenario} = require("../lib/database")
const findNBS = require("../lib/find-nbs")
const mcda = require('../lib/mcda')
const {saveScenario} = require('../lib/save-scenario')

const auth = require('../middleware/auth');

router.get('/technologies', function(req, res) {
  let id = req.query.id;
  let result = xls.readTechnologiesExcel(id);
  if (result.error) {
    res.statusMessage = "id does not return any technology";
    res.status(400).send(result);
  } else {
    res.send(result);
  }
});

router.post('/find-nbs', async function(req, res){
  try {
    let result = await findNBS.findNBS(req.body)
    res.send(result)
  //   if (result.error) {
  //     res.statusMessage = result.error
  //     res.status(400)
  //     res.send(result.error)
  //   } else {
  //     res.send(result)
  //   }
  }
  catch (e){
    res.send(e)
  }
});

router.post('/find-nbs-multiple', async function(req, res){
  try {
    let result = await findNBS.findNBSMultiple(req.body)
    console.log(result.length)
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

router.post('/mcda', async function (req, res) {
  try {
    let result = await mcda.mcda(req.body)
    if (result.error) {
      res.statusMessage = result.error
      res.status(400)
      res.send(result.error)
    } else {
      res.send(result)
    }
  }
  catch (e){
    console.log(e)
    res.send(e)
  }
})

router.post('/save-scenario', auth.auth, async function(req, res){
  try {
    req.body.id_user = req.data.id;
    let response = await saveScenario(req.body);
    res.send(response);
  }
  catch (e){
    console.log(e);
    res.send({
      success:false,
      error: e,
      message: 'Something went wrong, please try again.'
    });
  }
});

router.post('/delete-scenario', auth.auth, async function(req, res){
  try {
    req.body.id_user = req.data.id;
    let response = await deleteScenario(req.body);
    res.send(response);
  }
  catch (e){
    console.log(e);
    res.send({
      success:false,
      error: e,
      message: 'Something went wrong, please try again.'
    });
  }
});

router.get('/scenarios', auth.auth, async function(req, res){
  try {
    req.query.id_user = req.data.id;
    let response = await getScenarios(req.query);
    res.send(response);
  }
  catch (e){
    console.log(e);
    res.send({
      success:false,
      error: e,
      message: 'Something went wrong, please try again.'
    });
  }
});
module.exports = router;


