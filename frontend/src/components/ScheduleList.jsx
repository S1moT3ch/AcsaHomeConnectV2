import React, { useState } from "react";
import {
    Paper,
    Typography,
    Grid,
    Box,
    Divider,
    MenuItem,
    TextField,
    Button,
    CircularProgress
} from "@mui/material";
import axios from "axios";
import { BACKEND_URL } from "../config/config";

const ScheduleList = ({ home }) => {
    const [selectedSchedule, setSelectedSchedule] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    if (!home || !home.schedules) {
        return <Typography>Nessuno schedule disponibile</Typography>;
    }

    const formatTime = (m_offset) => {
        const hours = Math.floor(m_offset / 60) % 24;
        const minutes = m_offset % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    };

    const handleSwitchSchedule = async () => {
        if (!selectedSchedule) {
            setMessage("Seleziona uno schedule prima di procedere.");
            return;
        }
        setLoading(true);
        setMessage("");

        try {
            await axios.post(`${BACKEND_URL}/api/netatmo/switchhomeschedule`, {
                home_id: home.id,
                schedule_id: selectedSchedule,
                selected: true
            });
            setMessage("Schedule impostato con successo ✅");
        } catch (err) {
            console.error(err.response?.data || err.message);
            setMessage("Errore nell'impostazione dello schedule");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Card di selezione e impostazione schedule */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" mb={2}>
                    Seleziona e imposta uno schedule
                </Typography>

                <TextField
                    select
                    label="Schedule"
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {home.schedules.map((schedule) => (
                        <MenuItem key={schedule.id} value={schedule.id}>
                            {schedule.name}
                        </MenuItem>
                    ))}
                </TextField>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSwitchSchedule}
                    disabled={loading}
                    fullWidth
                >
                    {loading ? <CircularProgress size={24} /> : "Imposta Schedule"}
                </Button>

                {message && (
                    <Typography
                        variant="body1"
                        mt={2}
                        color={message.includes("Errore") ? "error" : "success.main"}
                    >
                        {message}
                    </Typography>
                )}
            </Paper>

            {/* Lista schedule */}
            <Typography variant="h5" mb={2}>
                Schedules per {home.name}
            </Typography>

            {home.schedules.map((schedule) => (
                <Paper key={schedule.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">{schedule.name}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        Tipo: {schedule.type} | Default: {schedule.default ? "Sì" : "No"} |{" "}
                        Selected: {schedule.selected ? "Sì" : "No"}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle1" mt={1}>
                        Zone:
                    </Typography>
                    {schedule.zones.map((zone) => (
                        <Box key={zone.id} sx={{ mb: 1, pl: 2 }}>
                            <Typography>
                                {zone.name || `Zona ${zone.id}`} (ID: {zone.id}, Tipo: {zone.type})
                            </Typography>
                            {zone.rooms?.map((room, idx) => (
                                <Typography key={idx} sx={{ pl: 2 }}>
                                    Stanza ID: {room.id} | Temp:{" "}
                                    {room.therm_setpoint_temperature ??
                                        room.cooling_setpoint_temperature ??
                                        room.temp ??
                                        room.cooling_setpoint_mode ??
                                        "N/A"}
                                </Typography>
                            ))}
                        </Box>
                    ))}

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="subtitle1" mt={1}>
                        Fasce orarie:
                    </Typography>
                    {schedule.timetable.map((slot, idx) => {
                        const zone = schedule.zones.find((z) => z.id === slot.zone_id);
                        return (
                            <Typography key={idx} sx={{ pl: 2 }}>
                                {formatTime(slot.m_offset)} - Zona: {zone?.name || slot.zone_id}
                            </Typography>
                        );
                    })}
                </Paper>
            ))}
        </Box>
    );
};

export default ScheduleList;
