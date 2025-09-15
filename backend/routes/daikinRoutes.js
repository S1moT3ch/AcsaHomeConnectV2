//import dipendenze e moduli necessari
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('querystring');
const authController = require('../controllers/authController');
const  { verifyAccessToken } = require('../middlewares/authMiddleware');

//login Daikin
router.get('/auth/daikin/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");

    // qui scambi il code con un access_token
    const tokenResp = await axios.post("https://idp.onecta.daikineurope.com/v1/oidc/token", qs.stringify({
        grant_type: "authorization_code",
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: "https://acsahomeconnectv2-production.up.railway.app"  // deve combaciare!
    }), { headers: { "Content-Type": "application/x-www-form-urlencoded" }});

    req.session.accessToken = tokenResp.data.access_token;
    res.send("Login OK, token salvato!");
});

module.exports = router;