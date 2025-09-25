import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Box,
    Divider,
} from "@mui/material";
import { BACKEND_URL } from "../config/config";
import Bar from "./Bar";

function ThermostatStatus() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [home, setHome] = useState(null);
    const [thermostat, setThermostat] = useState(null);

    // Recupera dati della casa e stato del termostato
    const fetchHomeData = async () => {
        try {
            const homesResp = await axios.get(`${BACKEND_URL}/api/netatmo/homes`);
            const firstHome = homesResp.data.homes[0]; // prendo la prima casa
            setHome(firstHome);

            const statusResp = await axios.get(
                `${BACKEND_URL}/api/netatmo/status/${firstHome.id}`
            );
            setThermostat(statusResp.data.home);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Errore nel recupero dei dati dal termostato");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomeData();

        // Aggiornamento automatico ogni 60 secondi
        const interval = setInterval(fetchHomeData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading)
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );

    if (error)
        return (
            <Typography color="error" align="center" p={4}>
                {error}
            </Typography>
        );

    if (!home || !thermostat) {
        return (
            <Typography align="center" p={4}>
                Nessun dato disponibile
            </Typography>
        );
    }

    const roomMap = {};
    home.rooms.forEach((room) => {
        roomMap[room.id] = room.name;
    });


    return (
        <Box>
            <Bar />

            <Card sx={{ maxWidth: 500, margin: "2rem auto" }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {home.name}
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                        Stato della Casa
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1">Stanze:</Typography>
                    {thermostat.rooms?.length ? (
                        <List dense>
                            {thermostat.rooms.map((room) => (
                                <ListItem key={room.id}>
                                    <ListItemText
                                        primary={`${roomMap[room.id] || "Stanza"}`}
                                        secondary={
                                            <>
                                                Temperatura attuale: {room.therm_measured_temperature}°C | Setpoint:{" "}
                                                {room.therm_setpoint_temperature}°C | Umidità: {room.humidity}%
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2">Nessuna stanza trovata</Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1">Moduli:</Typography>
                    {thermostat.modules?.length ? (
                        <List dense>
                            {thermostat.modules.map((mod) => (
                                <ListItem key={mod.id}>
                                    <ListItemText
                                        primary={`Modulo: ${mod.id} (${mod.type})`}
                                        secondary={
                                            <>
                                                {mod.boiler_status ? "On" : "Off"}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2">Nessun modulo trovato</Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default ThermostatStatus;
