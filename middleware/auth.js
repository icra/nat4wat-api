const jwt = require('jsonwebtoken');
const jwt_config = require('../lib/jwt_conf');


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, jwt_config.secret, {}, async function (err, decoded) {
            if (err) {
                console.log("Auth error: ", err.name);

                res.status(401).send({
                    error: 'Please authenticate.',
                    error_type: err.name,
                    error_message: err.message
                });
            }
            else {
                req.data = decoded;
                next();
            }
        });
    } catch (e) {
        res.status(401).send({error: 'Please authenticate.'});
    }
}

module.exports = {
    auth
};