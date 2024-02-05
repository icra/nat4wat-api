let express = require('express');
let router = express.Router();
const {register,login, sendRecoveryPassword, updatePassword} = require("../lib/database");


// During user registration
router.post('/register', async (req, res) => {
    try {
        let result = await register(req.body.user);
        console.log('result',result);
        res.send(result);
    } catch (e){
        res.send(e)
    }
});

router.post('/login', async function (req, res, next) {
    try
    {
        let username = req.body.email;
        let password = req.body.password;
        let remember = req.body.remember;

        let result = await login(username, password, remember);
        // console.log(result)
        res.send(result);
    }
    catch(e)
    {
        res.send(e);
    }
});


router.post('/recover-password', async function (req, res, next) {
    try
    {
        let email = req.body.email;
        let referer = req.headers.referer;

        let result = await sendRecoveryPassword(email, referer);
        res.send(result);
    }
    catch(e)
    {
        res.send(e);
    }
});

router.post('/update-password', async function (req, res, next) {
    try
    {
        let token = req.body.token;
        let password = req.body.password;

        let result = await updatePassword(password, token);
        res.send(result);
    }
    catch(e)
    {
        res.send(e);
    }
});

module.exports = router;
