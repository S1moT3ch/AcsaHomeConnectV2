const express = require("express");
const axios = require("axios");
const NetatmoToken = require("./models/NetatmoToken");


/**
 * Helper: recupera token dal DB
 */
async function getStoredToken() {
    return await NetatmoToken.findOne();
}

/**
 * Helper: salva o aggiorna token nel DB
 */
async function saveToken(data) {
    let token = await NetatmoToken.findOne();
    if (!token) {
        token = new NetatmoToken();
    }
    token.access_token = data.access_token;
    token.refresh_token = data.refresh_token;
    token.expires_at = new Date(Date.now() + data.expires_in * 1000);
    await token.save();
    return token;
}

/**
 * Ottiene token iniziale con code
 */
async function getToken(code) {
    const response = await axios.post("https://api.netatmo.com/oauth2/token", null, {
        params: {
            grant_type: "authorization_code",
            client_id: process.env.NETATMO_CLIENT_ID,
            client_secret: process.env.NETATMO_CLIENT_SECRET,
            code,
            redirect_uri: process.env.NETATMO_REDIRECT_URI,
        },
    });
    return saveToken(response.data);
}

/**
 * Refresh token
 */
async function refreshToken(oldToken) {
    const response = await axios.post("https://api.netatmo.com/oauth2/token", null, {
        params: {
            grant_type: "refresh_token",
            refresh_token: oldToken.refresh_token,
            client_id: process.env.NETATMO_CLIENT_ID,
            client_secret: process.env.NETATMO_CLIENT_SECRET,
        },
    });
    return saveToken(response.data);
}

/**
 * Restituisce un access_token valido
 */
async function getValidAccessToken() {
    let token = await getStoredToken();
    if (!token) throw new Error("No tokens in DB, run /callback first");

    if (Date.now() >= token.expires_at.getTime()) {
        token = await refreshToken(token);
    }
    return token.access_token;
}

exports.getNetatmoToken = async (req, res, next) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Missing code" });

    try {
        const token = await getToken(code);
        res.json({ message: "Tokens stored in DB", token });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Failed to get tokens" });
    }
}