import React, {useEffect, useState} from "react";
import {
    Card,
    CardContent,
    Typography,
    Switch,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
} from "@mui/material";
import { useClimateControl } from "./UseClimateControl";
import axios from "axios";
import {BACKEND_URL} from "../config/config";

const ClimateControlPanel = ({ deviceId }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const {sendCommand } = useClimateControl(deviceId);

    useEffect(() => {
        if (!deviceId) return;
        const fetchStatus = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${BACKEND_URL}/api/daikin/devices/${deviceId}/status`);
                setStatus(data);
                setError(null);
            } catch (err) {
                console.error("Errore caricando stato:", err);
                setError(err.response?.data || err.message || "Errore caricando stato");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [deviceId]);

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{JSON.stringify(error)}</Typography>;
    if (!status || !status.managementPoints)
        return <Typography>Caricamento stato...</Typography>;

    const climate = status.managementPoints.find(
        (mp) => mp.managementPointType === "climateControl"
    );

    if (!climate) return <Typography color="error">Dispositivo climateControl non trovato</Typography>;

    const onOffMode = climate.onOffMode?.value || "off";
    const mode = climate.operationMode?.value || "auto";

    const targetTemp =
        climate.temperatureControl?.value?.operationModes?.[mode]?.setpoints?.roomTemperature?.value || 22;
    const currentTemp = climate.sensoryData?.value?.roomTemperature?.value ?? null;

    // Fan speed (solo modalità con fixed)
    const fanSpeed =
        climate.fanControl?.value?.operationModes?.[mode]?.fanSpeed?.modes?.fixed?.value ?? null;

    return (
        <Card sx={{ maxWidth: 400, mx: "auto", mt: 4, p: 2, borderRadius: 3 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Controllo Climatizzatore
                </Typography>

                {/* Accensione */}
                <Typography variant="body1">Accensione</Typography>
                <Switch
                    checked={onOffMode === "on"}
                    onChange={(e) => sendCommand("onOff", e.target.checked ? "on" : "off")}
                />

                {/* Modalità */}
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Modalità</InputLabel>
                    <Select value={mode} onChange={(e) => sendCommand("mode", e.target.value)}>
                        {climate.operationMode?.values.map((m) => (
                            <MenuItem key={m} value={m}>
                                {m}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Temperatura Target */}
                <Typography variant="body1" sx={{ mt: 3 }}>
                    Temperatura Target: {targetTemp}°C
                </Typography>
                <Slider
                    value={targetTemp}
                    min={16}
                    max={32}
                    step={0.5}
                    valueLabelDisplay="auto"
                    onChangeCommitted={(_, val) => sendCommand("temperature", val)}
                />

                {/* Temperatura Ambiente */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Temperatura Ambiente: {currentTemp !== null ? `${currentTemp}°C` : "--"}
                </Typography>

                {/* Fan Speed */}
                {fanSpeed !== null && (
                    <>
                        <Typography variant="body1" sx={{ mt: 3 }}>
                            Velocità Ventola: {fanSpeed}
                        </Typography>
                        <Slider
                            value={fanSpeed}
                            min={1}
                            max={3}
                            step={1}
                            marks
                            valueLabelDisplay="auto"
                            onChangeCommitted={(_, val) =>
                                console.log("Fan speed comando (da implementare se API supporta)", val)
                            }
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ClimateControlPanel;
