import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardContent,
    CardHeader,
    Button,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Grid,
    Typography,
} from "@mui/material";
import { BACKEND_URL } from "../config/config";

// Stili moderni
const styles = {
    container: {
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#ffffff", // container pulito
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", // ombra soft
        padding: "16px",
    },
    cardHeader: {
        backgroundColor: "#1976d2",
        color: "#ffffff",
        fontWeight: "bold",
        borderRadius: "16px 16px 0 0",
        padding: "12px 16px",
    },
    formControl: {
        marginBottom: "16px",
    },
    button: {
        marginTop: "16px",
        backgroundColor: "#1976d2",
        color: "#ffffff",
        fontWeight: 500,
        padding: "12px",
        borderRadius: "8px",
        textTransform: "none",
        "&:hover": {
            backgroundColor: "#115293",
        },
    },
    loadingText: {
        padding: "24px",
        fontSize: "1.1rem",
        textAlign: "center",
    },
    errorText: {
        padding: "24px",
        fontSize: "1.1rem",
        color: "red",
        textAlign: "center",
    },
};

export default function ThermostatDashboard({ setMessage }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState("");
    const [temperature, setTemperature] = useState(21);
    const [endTime, setEndTime] = useState("");
    const [error, setError] = useState(null);
    const [home, setHome] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [activeSchedule, setActiveSchedule] = useState("");
    const [homeId, setHomeId] = useState(null);
    const [roomId, setRoomId] = useState(null);

    const [scheduleName, setScheduleName] = useState("");
    const [zones, setZones] = useState([{ id: 0, type: "comfort", temp: 21 }]);
    const [timetable, setTimetable] = useState([{ m_offset: 0, id: 0 }]);

    const modeLabels = {
        home: "A casa",
        manual: "Manuale",
    };

    const fetchStatus = async () => {
        try {
            const homesResp = await axios.get(`${BACKEND_URL}/api/netatmo/homes`);
            const firstHome = homesResp.data.homes[0];
            setHome(firstHome);

            const statusResp = await axios.get(`${BACKEND_URL}/api/netatmo/status/${firstHome.id}`);
            const homeData = statusResp.data.home;
            setStatus(homeData);
            setHomeId(homeData.id);
            const firstRoom = homeData.rooms[0];
            setRoomId(firstRoom?.id || null);

            const availableModes = firstRoom?.available_modes || ["home", "away", "frostguard", "manual"];
            setMode(availableModes[0]);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Errore nel recupero dei dati dal termostato");
            setLoading(false);
        }
    };

    const handleSetState = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/netatmo/setstate`, {
                homeId,
                roomId,
                mode,
                temperature: mode === "manual" ? Number(temperature) : undefined,
                endTime: endTime ? Math.floor(new Date(endTime).getTime() / 1000) : undefined,
            });
            setMessage(null);
            fetchStatus();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Typography sx={styles.loadingText}>Caricamento...</Typography>;
    if (error) return <Typography sx={styles.errorText}>{error}</Typography>;

    return (
        <Grid container spacing={3} sx={styles.container}>
            <Grid item xs={12} md={6}>
                <Card sx={styles.card}>
                    <CardHeader title="Cambia Stato" sx={styles.cardHeader} />
                    <CardContent>
                        <FormControl fullWidth sx={styles.formControl}>
                            <InputLabel id="mode-label">Modalità</InputLabel>
                            <Select
                                labelId="mode-label"
                                value={mode}
                                onChange={(e) => setMode(e.target.value)}
                            >
                                {(status?.rooms?.[0]?.available_modes || ["home", "manual"]).map((m) => (
                                    <MenuItem key={m} value={m}>
                                        {modeLabels[m] || m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {mode === "manual" && (
                            <>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    type="number"
                                    label="Temperatura (°C)"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    type="datetime-local"
                                    label="Fine override"
                                    InputLabelProps={{ shrink: true }}
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            sx={styles.button}
                            onClick={handleSetState}
                        >
                            Applica Stato
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
