import React, { useState } from "react";
import {
    TextField,
    Button,
    Paper,
    Typography,
    Grid,
    Box,
    Divider,
    MenuItem
} from "@mui/material";
import axios from "axios";
import { BACKEND_URL } from "../config/config";

// Stili centralizzati (uguali a ThermostatDashboard)
const styles = {
    paper: {
        p: 4,
        maxWidth: 900,
        mx: "auto",
        backgroundColor: "#ffffff",
        borderRadius: 2,
        boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
    },
    header: {
        fontWeight: 600,
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: 600,
        marginBottom: 8,
    },
    formControl: {
        marginBottom: 2,
    },
    button: {
        mt: 2,
        backgroundColor: "#1976d2",
        color: "#ffffff",
        "&:hover": {
            backgroundColor: "#115293",
        },
    },
    addButton: {
        mt: 1,
        mb: 3,
        backgroundColor: "#e0e0e0",
        "&:hover": {
            backgroundColor: "#cfcfcf",
        },
    },
    successText: {
        color: "success.main",
    },
    errorText: {
        color: "error.main",
    },
};

const ScheduleManager = ({ homeId, roomId }) => {
    const [scheduleName, setScheduleName] = useState("Nuovo Schedule");
    const [selected, setSelected] = useState(true);
    const [zones, setZones] = useState([
        { id: 1, name: "Night", temp: 12, type: 1 },
        { id: 4, name: "Eco", temp: 12, type: 5 },
        { id: 0, name: "Comfort", temp: 21, type: 0 },
        { id: 3, name: "Comfort+", temp: 21, type: 8 }
    ]);
    const [timetable, setTimetable] = useState([{ time: "00:00", id: 1 }]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const programId = "default_program";

    const addTimeSlot = () => {
        setTimetable([...timetable, { time: "00:00", id: zones[0].id }]);
    };

    const updateTimeSlot = (index, field, value) => {
        const newTimetable = [...timetable];
        newTimetable[index][field] = value;
        setTimetable(newTimetable);
    };

    const updateZoneTemp = (index, value) => {
        const newZones = [...zones];
        newZones[index].temp = value;
        setZones(newZones);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const timetablePayload = timetable.map(slot => {
                const [hh, mm] = slot.time.split(":").map(Number);
                return { zone_id: slot.id, m_offset: hh * 60 + mm };
            });

            const zonesPayload = zones.map(zone => ({
                id: zone.id,
                name: zone.name,
                type: zone.type,
                rooms_temp: [{ room_id: roomId, temp: zone.temp }]
            }));

            const payload = {
                home_id: homeId,
                name: scheduleName,
                program_id: programId,
                selected,
                zones: zonesPayload,
                timetable: timetablePayload
            };

            const resp = await axios.post(
                `${BACKEND_URL}/api/netatmo/setschedule`,
                payload
            );
            setMessage(`Schedule creato con successo: ${resp.data.message}`);
        } catch (err) {
            console.error(err.response?.data || err.message);
            setMessage("Errore nella creazione dello schedule");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={styles.paper}>
            <Typography variant="h5" sx={styles.header}>Gestione Schedule</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} mb={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Nome Schedule"
                            value={scheduleName}
                            onChange={(e) => setScheduleName(e.target.value)}
                            fullWidth
                            required
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={styles.sectionTitle}>Zone</Typography>
                {zones.map((zone, idx) => (
                    <Grid container spacing={2} alignItems="center" key={zone.id} mb={1}>
                        <Grid item xs={12} sm={4}>
                            <Typography variant="body1" sx={{ padding: 1 }}>{zone.name}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Temperatura"
                                type="number"
                                value={zone.temp}
                                onChange={(e) => updateZoneTemp(idx, Number(e.target.value))}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={styles.sectionTitle}>Timetable</Typography>
                {timetable.map((slot, idx) => (
                    <Grid container spacing={2} alignItems="center" key={idx} mb={1}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Orario (HH:mm)"
                                type="time"
                                value={slot.time}
                                onChange={(e) => updateTimeSlot(idx, "time", e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Zona"
                                value={slot.id}
                                onChange={(e) => updateTimeSlot(idx, "id", Number(e.target.value))}
                                fullWidth
                            >
                                {zones.map((zone) => (
                                    <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                ))}

                <Button variant="outlined" sx={styles.addButton} onClick={addTimeSlot}>
                    Aggiungi Fascia
                </Button>

                <Button variant="contained" sx={styles.button} type="submit" disabled={loading}>
                    {loading ? "Creazione..." : "Crea Schedule"}
                </Button>
            </Box>

            {message && (
                <Typography
                    variant="body1"
                    mt={3}
                    sx={message.includes("Errore") ? styles.errorText : styles.successText}
                >
                    {message}
                </Typography>
            )}
        </Paper>
    );
};

export default ScheduleManager;
