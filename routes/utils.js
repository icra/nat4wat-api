const express = require('express');
const {waterTypes, infiltrationSoils, wAcceptedNaming} = require("../lib/globals");
const {insertTokens, getUser} = require("../lib/database");
const {sendHelpdeskRequest} = require("../lib/utils");
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/water-types', function(req, res) {
  res.send(waterTypes);
});

router.get('/weights', function(req, res) {
  res.send(wAcceptedNaming);
});

router.get('/infiltration-soils', function(req, res) {
  res.send(infiltrationSoils);
});

router.post(
    '/report-help-or-contribution',
    auth.auth,
    async function (req, res) {
      try {
        const { email, section, report_type, description } = req.body;

        // fetch the logged‐in user by their ID set in req.data by auth.auth
        const user = await getUser(req.data.id);
        if (!user || !user[0]) {
          return res
              .status(404)
              .json({ success: false, message: 'User not found.' });
        }

        // verify that the email in the payload matches the user’s actual email
        const registeredEmail = user[0].email;
        if (email !== registeredEmail) {
          return res.status(403).json({
            success: false,
            message: 'Submitted email does not match your account email.',
          });
        }

        // now safe to send the helpdesk request
        const result = await sendHelpdeskRequest(
          registeredEmail,
          section,
          report_type,
          description,
        );

        return res.json(result);
      } catch (e) {
        console.error('Helpdesk submission error:', e);
        return res
            .status(500)
            .json({ success: false, message: 'Server error. Please try again.' });
      }
    }
);


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