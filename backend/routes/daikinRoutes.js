// routes/daikinRouter.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('querystring');

// Middleware per verificare access token e fare refresh se necessario
async function verifyAccessToken(req, res, next) {
    if (!req.session.accessToken) {
        return res.status(401).send("Not authenticated");
    }

    // Controlla scadenza token
    if (Date.now() > (req.session.tokenExpires || 0)) {
        if (!req.session.refreshToken) return res.status(401).send("Refresh token missing");
        try {
            const tokenResp = await axios.post(
                "https://idp.onecta.daikineurope.com/v1/oidc/token",
                qs.stringify({
                    grant_type: "refresh_token",
                    refresh_token: req.session.refreshToken,
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            req.session.accessToken = tokenResp.data.access_token;
            req.session.refreshToken = tokenResp.data.refresh_token;
            req.session.tokenExpires = Date.now() + (tokenResp.data.expires_in * 1000);
        } catch (err) {
            console.error("Refresh token error:", err.response?.data || err.message);
            return res.status(401).send("Could not refresh token");
        }
    }
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

// 2️⃣ Callback: riceve code e scambia token
router.get('/auth/daikin/callback', async (req, res) => {
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

        req.session.accessToken = tokenResp.data.access_token;
        req.session.refreshToken = tokenResp.data.refresh_token;
        req.session.tokenExpires = Date.now() + (tokenResp.data.expires_in * 1000);

        res.send("Login OK, token salvato!");
    } catch (err) {
        console.error("Token exchange error:", err.response?.data || err.message);
        res.status(500).send("Token exchange failed");
    }
});

// 3️⃣ Lista dispositivi
router.get('/api/devices', verifyAccessToken, async (req, res) => {
    try {
        const resp = await axios.get("https://api.onecta.daikineurope.com/v1/devices", {
            headers: {
                Authorization: `Bearer ${req.session.accessToken}`,
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
