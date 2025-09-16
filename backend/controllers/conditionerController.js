const axios = require('axios');
const qs = require('querystring');

const UserToken = require("../models/userToken");


exports.registerDaikin = async (req, res, next) => {
    const authUrl = `https://idp.onecta.daikineurope.com/v1/oidc/authorize?` +
        `response_type=code&client_id=${process.env.CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
        `&scope=openid%20onecta:basic.integration`;
    res.redirect(authUrl);
}

exports.callbackDaikin = async (req, res, next) => {
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
}

exports.getDaikinDevices = async  (req, res, next) => {
    try {
        const resp = await axios.get("https://api.onecta.daikineurope.com/v1/gateway-devices", {
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
}

exports.DaikinOnOff = async (req, res, next) => {
    const { deviceId } = req.params;
    const { value } = req.body;

    try {
        // Chiamata all’API Daikin
        const resp = await axios.patch(
            `https://api.onecta.daikineurope.com/v1/gateway-devices/${deviceId}/management-points/climateControl/characteristics/onOffMode`,
            {
                value: value
            },
            {
                headers: {
                    Authorization: `Bearer ${req.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "Content-Type": "application/json",
                    "accept": "*/*"
                }
            }
        );

        res.json(resp.data);
    } catch (err) {
        console.error("Errore controllando climateControl:", err.response?.data || err.message);
        res.status(500).send("Errore durante il controllo del dispositivo");
    }
}