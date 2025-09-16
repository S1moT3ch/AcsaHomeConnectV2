// routes/daikinRouter.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('querystring');

const UserToken = require("../models/userToken");

const conditionerController = require('../controllers/conditionerController');
const  { verifyAccessToken } = require('../middlewares/authMiddleware');

// Middleware per verificare access token e fare refresh se necessario
async function verifyDaikinAccessToken(req, res, next) {
    const userId = "default"; // in futuro legalo all'utente loggato
    let userToken = await UserToken.findOne({ userId });

    if (!userToken) {
        return res.status(401).send("Not authenticated with Daikin");
    }

    // Se scaduto, rinnova con refresh token
    if (new Date() > userToken.tokenExpires) {
        try {
            const tokenResp = await axios.post(
                "https://idp.onecta.daikineurope.com/v1/oidc/token",
                qs.stringify({
                    grant_type: "refresh_token",
                    refresh_token: userToken.refreshToken,
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );

            const { access_token, refresh_token, expires_in } = tokenResp.data;

            userToken.accessToken = access_token;
            userToken.refreshToken = refresh_token || userToken.refreshToken;
            userToken.tokenExpires = new Date(Date.now() + expires_in * 1000);
            await userToken.save();

        } catch (err) {
            console.error("Refresh token error:", err.response?.data || err.message);
            return res.status(401).send("Could not refresh token");
        }
    }

    // Attacca il token alla request
    req.accessToken = userToken.accessToken;
    next();
}


// 1️⃣ Login Daikin: redirect all’authorize endpoint
router.get('/auth/daikin', verifyDaikinAccessToken, conditionerController.registerDaikin);

// Callback OAuth2
router.get("/auth/daikin/callback", verifyDaikinAccessToken, conditionerController.callbackDaikin)

// 3️⃣ Lista dispositivi
router.get("/api/devices", verifyDaikinAccessToken, conditionerController.getDaikinDevices)

// 4️⃣ Controllo dispositivo (es: setpoint)
router.put("/api/devices/:deviceId/managementPoints/climateControl", verifyDaikinAccessToken, conditionerController.DaikinOnOff);


module.exports = router;
