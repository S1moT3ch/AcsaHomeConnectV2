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

// ❄️ Modalità operativa
exports.DaikinMode = async (req, res) => {
    const { deviceId } = req.params;
    const { value } = req.body; // "cooling" | "heating" | "auto" | "fan" | "dry"

    try {
        const resp = await axios.patch(
            `https://api.onecta.daikineurope.com/v1/gateway-devices/${deviceId}/management-points/climateControl/characteristics/operationMode`,
            { value: value },
            {
                headers: {
                    Authorization: `Bearer ${req.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                }
            }
        );
        res.json(resp.data);
    } catch (err) {
        console.error("Errore Mode:", err.response?.data || err.message);
        res.status(500).send("Errore Mode");
    }
};

// 🌡️ Temperatura target
exports.DaikinTemperature = async (req, res) => {
    const { deviceId } = req.params;
    const { value } = req.body; // es. 22.5

    try {
        const resp = await axios.patch(
            `https://api.onecta.daikineurope.com/v1/gateway-devices/${deviceId}/management-points/climateControl/characteristics/temperatureControl`,
            { value: value,
                    path: "/operationModes/cooling/setpoints/roomTemperature",
                },
            {
                headers: {
                    Authorization: `Bearer ${req.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                }
            }
        );
        res.json(resp.data);
    } catch (err) {
        console.error("Errore Temp:", err.response?.data || err.message);
        res.status(500).send("Errore Temperatura");
    }
};

// 💨 Velocità ventola
exports.DaikinFanSpeed = async (req, res) => {
    const { deviceId } = req.params;
    const { value } = req.body; // "auto" | "low" | "medium" | "high" | "quiet"

    try {
        const resp = await axios.patch(
            `https://api.onecta.daikineurope.com/v1/gateway-devices/${deviceId}/management-points/climateControl/characteristics/fanControl`,
            {
                value: {
                    operationModes: {
                        cooling: {
                            fanSpeed: {
                                currentMode: { value: "fixed" },
                                modes: { fixed: { value } } // esempio: value = 3
                            }
                        }
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${req.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "Content-Type": "application/json"
                }
            }
        );
        res.json(resp.data);
    } catch (err) {
        console.error("Errore FanSpeed:", err.response?.data || err.message);
        res.status(500).send("Errore FanSpeed");
    }
};

// 📋 Stato dispositivo
exports.DaikinStatus = async (req, res) => {
    const { deviceId } = req.params;

    try {
        const resp = await axios.get(
            `https://api.onecta.daikineurope.com/v1/gateway-devices/${deviceId}`,
            {
                headers: {
                    Authorization: `Bearer ${req.accessToken}`,
                    "x-api-key": process.env.CLIENT_ID,
                    "accept": "application/json"
                }
            }
        );
        res.json(resp.data);
    } catch (err) {
        console.error("Errore Status:", err.response?.data || err.message);
        res.status(500).send("Errore Stato");
    }
};