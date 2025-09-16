// routes/daikinRouter.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('querystring');

const UserToken = require("../models/UserToken");


// Middleware per verificare access token e fare refresh se necessario
async function verifyAccessToken(req, res, next) {
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
router.get('/auth/daikin', (req, res) => {
    const authUrl = `https://idp.onecta.daikineurope.com/v1/oidc/authorize?` +
        `response_type=code&client_id=${process.env.CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
        `&scope=openid%20onecta:basic.integration`;
    res.redirect(authUrl);
});

// Callback OAuth2
router.get("/auth/daikin/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");

    try {
        const tokenResp = await axios.post(
            "https://idp.onecta.daikineurope.com/v1/oidc/token",
            qs.stringify({
                grant_type: "authorization_code",
                code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, refresh_token, expires_in } = tokenResp.data;

        // salva in Mongo (per ora userId fisso "default", poi puoi collegarlo a un utente reale)
        await UserToken.findOneAndUpdate(
            { userId: "default" },
            {
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenExpires: new Date(Date.now() + expires_in * 1000)
            },
            { upsert: true, new: true }
        );

        res.send("Login OK, token salvato in MongoDB!");
    } catch (err) {
        console.error("Token exchange error:", err.response?.data || err.message);
        res.status(500).send("Token exchange failed");
    }
});

// 3️⃣ Lista dispositivi
router.get("/api/devices", verifyAccessToken, async (req, res) => {
    try {
        const resp = await axios.get("https://api.onecta.daikineurope.com/v1/devices", {
            headers: {
                Authorization: `Bearer ${req.accessToken}`,
                "x-api-key": process.env.CLIENT_ID
            }
        });
        res.json(resp.data);
    } catch (err) {
        console.error("Error fetching devices:", err.response?.data || err.message);
        res.status(500).send("Failed fetching devices");
    }
});

// 4️⃣ Controllo dispositivo (es: setpoint)
router.put('/api/devices/:id/control', verifyAccessToken, async (req, res) => {
    const deviceId = req.params.id;
    const body = req.body; // es: { mode: "cool", setpoint: 22 }

    try {
        const resp = await axios.put(
            `https://api.onecta.daikineurope.com/v1/devices/${deviceId}`,
            body,
            {
                headers: {
                    Authorization: `Bearer ${req.session.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                }
            }
        );
        res.json(resp.data);
    } catch (err) {
        console.error("Error controlling device:", err.response?.data || err.message);
        res.status(500).send("Failed controlling device");
    }
});

module.exports = router;
