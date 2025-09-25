const axios = require("axios");
const NetatmoToken = require("../models/NetatmoToken");
const qs = require("querystring");

// Variabile globale per contare le chiamate
let boostCallCount = 0;

// Salva i token iniziali
async function seedTokens(access_token, refresh_token) {
    let token = await NetatmoToken.findOne();
    if (!token) token = new NetatmoToken();

    token.access_token = access_token;
    token.refresh_token = refresh_token;
    token.expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minuti da ora

    await token.save();
    return token;
}

// Recupera token dal DB
async function getStoredToken() {
    return await NetatmoToken.findOne();
}

// Salva token aggiornati
async function saveToken(data) {
    let token = await NetatmoToken.findOne();
    if (!token) token = new NetatmoToken();

    token.access_token = data.access_token;
    token.refresh_token = data.refresh_token || token.refresh_token;
    token.expires_at = new Date(Date.now() + (data.expires_in || 1800) * 1000); // se Netatmo ritorna expires_in

    await token.save();
    return token;
}

// Rigenera access_token usando refresh_token
async function refreshToken(oldToken) {
    const response = await axios.post(
        "https://api.netatmo.com/oauth2/token",
        qs.stringify({
            grant_type: "refresh_token",
            refresh_token: oldToken.refresh_token,
            client_id: process.env.NETATMO_CLIENT_ID,
            client_secret: process.env.NETATMO_CLIENT_SECRET,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return saveToken(response.data);
}

// Restituisce access_token valido
async function getValidAccessToken() {
    let token = await getStoredToken();
    if (!token) throw new Error("⚠️ Nessun token salvato in DB. Esegui seedTokens.");

    if (Date.now() >= token.expires_at.getTime()) {
        token = await refreshToken(token);
    }

    return token.access_token;
}

async function getHomes() {
    try {
        const access_token = await getValidAccessToken();

        const resp = await axios.get("https://api.netatmo.com/api/homesdata", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const body = resp.data.body;

        if (!body || body.length === 0) throw new Error("Nessuna casa trovata");

        return body;
    } catch (err) {
        console.error(err.response?.data || err.message);
        throw new Error("Errore nel recupero delle case");
    }
}

exports.netatmoInit = async (req, res, next) => {
    const access_token = await getValidAccessToken();
    const refresh_token = process.env.NETATMO_REFRESH_TOKEN;
    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        const token = await seedTokens(access_token, refresh_token);
        res.json({ message: "Tokens salvati in MongoDB", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore nel salvataggio dei token" });
    }
};

exports.netatmoGetHomes = async (req, res, next) => {
    try {
        const data = await getHomes();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.netatmoGetHomeStatus = async (req, res, next) => {
    try{
        const { homeId } = req.params;
        const access_token = await getValidAccessToken();

        const resp = await axios.get(
            "https://api.netatmo.com/api/homestatus",
            {
                headers: { Authorization: `Bearer ${access_token}` },
                params: { home_id: homeId } // axios la trasforma in query string automaticamente
            }
        );

        const body = resp.data.body;

        res.json(body);
    }catch (err) {
        console.error(err.response?.data || err.message);
        throw new Error("Errore nel recupero dello stato della casa");
    }
}

exports.netatmoSetThermostatState = async (req, res, next) => {
    try {
        const { homeId, roomId, mode, temperature, endTime } = req.body;
        // mode: "home" | "away" | "frostguard" | "manual"
        // temperature: solo se mode = manual
        // endTime: opzionale, timestamp UNIX in secondi

        const access_token = await getValidAccessToken();

        const payload = {
            home: {
                id: homeId,
                rooms: [
                    {
                        id: roomId,
                        therm_setpoint_mode: mode
                    }
                ]
            }
        };

        if (mode === "manual" && temperature) {
            payload.home.rooms[0].therm_setpoint_temperature = temperature;
            if (endTime) {
                payload.home.rooms[0].therm_setpoint_end_time = endTime;
            }
        }

        const resp = await axios.post(
            "https://api.netatmo.com/api/setstate",
            payload,
            {
                headers: { Authorization: `Bearer ${access_token}` }
            }
        );

        res.json(resp.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        next(new Error("Errore nel cambio stato del termostato"));
    }
};

exports.netatmoSwitchSchedule = async (req, res, next) => {
    try {
        const { homeId, scheduleId } = req.body;
        // homeId = ID della casa
        // scheduleId = ID dello schedule già configurato nella casa

        const access_token = await getValidAccessToken();

        const resp = await axios.post(
            "https://api.netatmo.com/api/switchschedule",
            {
                home_id: homeId,
                schedule_id: scheduleId
            },
            {
                headers: { Authorization: `Bearer ${access_token}` }
            }
        );

        res.json(resp.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        next(new Error("Errore nel cambio dello schedule attivo"));
    }
};

exports.netatmoSyncSchedule = async (req, res, next) => {
    try {
        const { homeId, scheduleId, timetable, zones, name } = req.body;
        /**
         * homeId: ID della casa
         * scheduleId: opzionale, se vuoi aggiornare uno schedule esistente
         * timetable: array con blocchi orari [{ m_offset, id }]
         * zones: array con zone di temperatura [{ id, type, temp }]
         * name: nome dello schedule
         *
         * NB: struttura completa documentata su dev.netatmo.com
         */

        const access_token = await getValidAccessToken();

        const resp = await axios.post(
            "https://api.netatmo.com/api/syncschedule",
            {
                home_id: homeId,
                schedule_id: scheduleId, // opzionale
                timetable,
                zones,
                name
            },
            {
                headers: { Authorization: `Bearer ${access_token}` }
            }
        );

        res.json(resp.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
        next(new Error("Errore nella sincronizzazione dello schedule"));
    }
};

exports.netatmoBoostHeating = async (req, res, next) => {
    try {
        const { homeId, roomId, temperature } = req.body;

        // Durate cicliche
        const durations = [30, 60, 90];

        // Prendo indice corrente (0,1,2,3)
        const callIndex = boostCallCount % 4;

        const access_token = await getValidAccessToken();

        let payload;
        let message;

        if (callIndex === 3) {
            // 👉 Quarta chiamata → reset allo schedule (modalità "home")
            payload = {
                home: {
                    id: homeId,
                    rooms: [
                        {
                            id: roomId,
                            therm_setpoint_mode: "home"
                        }
                    ]
                }
            };
            message = "Riscaldamento riportato allo schedule automatico";
        } else {
            // 👉 Prima, seconda, terza chiamata → manual boost
            const duration = durations[callIndex];
            const endTime = Math.floor(Date.now() / 1000) + duration * 60;

            // Normalizza temperatura
            let temp = temperature || 21;
            if (temp < 7) temp = 7;
            if (temp > 30) temp = 30;

            payload = {
                home: {
                    id: homeId,
                    rooms: [
                        {
                            id: roomId,
                            therm_setpoint_mode: "manual",
                            therm_setpoint_temperature: temp,
                            therm_setpoint_end_time: endTime
                        }
                    ]
                }
            };

            message = `Boost riscaldamento per ${duration} minuti`;
        }

        // Incremento contatore
        boostCallCount++;

        const resp = await axios.post(
            "https://api.netatmo.com/api/setstate",
            payload,
            {
                headers: { Authorization: `Bearer ${access_token}` }
            }
        );

        res.json({
            message,
            chiamata: boostCallCount,
            data: resp.data
        });
    } catch (err) {
        console.error(err.response?.data || err.message);
        next(new Error("Errore nell’attivazione del boost riscaldamento"));
    }
};

exports.netatmoCreateSchedule = async (req, res, next) => {
    try {
        const { home_id, name, program_id, selected, zones, timetable, away_temp, hg_temp } = req.body;

        if (!home_id || !name || !program_id || !zones || !timetable) {
            return res.status(400).json({
                error: "Parametri obbligatori mancanti: home_id, name, program_id, zones, timetable"
            });
        }

        const access_token = await getValidAccessToken();

        // Netatmo richiede i parametri come x-www-form-urlencoded
        const payload = {
            home_id,
            name,
            program_id,
            selected: selected ?? true,
            away_temp: away_temp ?? 12,   // valore di default se non passato
            hg_temp: hg_temp ?? 7,        // valore di default se non passato
            zones: JSON.stringify(zones),
            timetable: JSON.stringify(timetable)
        };

        console.log("Payload Netatmo (form-data):", payload);

        const response = await axios.post(
            "https://api.netatmo.com/api/createnewhomeschedule",
            qs.stringify(payload),
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        res.json({
            message: "Schedule creato con successo",
            data: response.data
        });
    } catch (err) {
        console.error("Errore Netatmo:", err.response?.data || err.message);
        next(new Error("Errore nella creazione dello schedule"));
    }
};

exports.netatmoSwitchHomeSchedule = async (req, res, next) => {
    try {
        const { home_id, schedule_id, selected } = req.body;

        // Validazione parametri
        if (!home_id || !schedule_id) {
            return res.status(400).json({
                error: "Parametri obbligatori mancanti: home_id, schedule_id"
            });
        }

        const access_token = await getValidAccessToken();

        const payload = {
            home_id,
            schedule_id,
            selected: selected ?? true
        };

        console.log("Payload Netatmo (form-data):", payload);

        const response = await axios.post(
            "https://api.netatmo.com/api/switchhomeschedule",
            qs.stringify(payload),
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        res.json({
            message: "Schedule attivato con successo",
            data: response.data
        });
    } catch (err) {
        console.error("Errore Netatmo:", err.response?.data || err.message);
        next(new Error("Errore nel cambio dello schedule"));
    }
};