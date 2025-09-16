import React, { useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Box,
    Divider,
    Button,
    TextField,
    MenuItem,
    Snackbar,
    Alert
} from "@mui/material";
import axios from "axios";
import {BACKEND_URL} from "../config/config";

function DeviceControlMui({ device }) {

    const [onOff, setOnOff] = useState(device?.managementPoints.find(mp => mp.managementPointType === "climateControl")?.onOffMode?.value || "off");
    const [mode, setMode] = useState(device?.managementPoints.find(mp => mp.managementPointType === "climateControl")?.operationMode?.value || "auto");
    const [temperature, setTemperature] = useState(
        device?.managementPoints.find(mp => mp.managementPointType === "climateControl")?.temperatureControl?.value?.operationModes?.[mode]?.setpoints?.roomTemperature?.value || 21
    );
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const climateControl = device?.managementPoints.find(mp => mp.managementPointType === "climateControl");
    if (!device) return <Typography>Nessun dispositivo selezionato</Typography>;

    const handleUpdate = async () => {
        try {
            const resp = await axios.put(
                `${BACKEND_URL}/api/devices/${device.id}/managementPoints/climateControl`,
                {
                    onOffMode: { value: onOff },
                    operationMode: mode,
                    temperatureControl: {
                        operationModes: {
                            [mode]: {
                                setpoints: {
                                    roomTemperature: { value: temperature }
                                }
                            }
                        }
                    }
                },
                { withCredentials: true }
            );
            setSnackbar({ open: true, message: "Comando inviato con successo", severity: "success" });
            console.log("Risposta controllo:", resp.data);
        } catch (err) {
            console.error("Errore controllo:", err);
            setSnackbar({ open: true, message: "Errore nell'invio comando", severity: "error" });
        }
    };

    return (
        <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    {climateControl?.name?.value || device.id}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    {/* On/Off */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1">Accendi/Spegni</Typography>
                        <Button
                            variant={onOff === "on" ? "contained" : "outlined"}
                            color="success"
                            onClick={() => setOnOff("on")}
                            sx={{ mr: 1, mt: 1 }}
                        >
                            On
                        </Button>
                        <Button
                            variant={onOff === "off" ? "contained" : "outlined"}
                            color="error"
                            onClick={() => setOnOff("off")}
                            sx={{ mt: 1 }}
                        >
                            Off
                        </Button>
                    </Grid>

                    {/* Modalità */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            label="Modalità Operativa"
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            fullWidth
                            sx={{ mt: 1 }}
                        >
                            {climateControl.operationMode.values.map((m) => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Temperatura */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Temperatura (°C)"
                            type="number"
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            inputProps={{
                                min: 16,
                                max: 32,
                                step: 0.5
                            }}
                            fullWidth
                            sx={{ mt: 1 }}
                        />
                    </Grid>
                </Grid>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdate}
                    sx={{ mt: 3 }}
                >
                    Invia Comando
                </Button>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert severity={snackbar.severity} variant="filled">
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </CardContent>
        </Card>
    );
}

export default DeviceControlMui;
