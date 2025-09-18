import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Divider,
    Grid,
    Slider,
    Switch,
    FormControlLabel,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Button
} from "@mui/material";
import AcUnitIcon from "@mui/icons-material/AcUnit"; // Cooling
import WhatshotIcon from "@mui/icons-material/Whatshot"; // Heating
import OpacityIcon from "@mui/icons-material/Opacity"; // Dry
import AirIcon from "@mui/icons-material/Air"; // Fan
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"; // Auto
import { useClimateControl } from "./UseClimateControl";
import { motion } from "framer-motion";
import { Power } from "lucide-react";

import "./style/climate-control.css";

const modeIcons = {
    auto: <AutoAwesomeIcon />,
    cooling: <AcUnitIcon />,
    heating: <WhatshotIcon />,
    dry: <OpacityIcon />,
    fanOnly: <AirIcon />,
};

const ClimateControlPanel = ({ status, deviceId }) => {
    const { sendCommand } = useClimateControl(deviceId);
    const [localStatus, setLocalStatus] = useState(status);
    const [tempValue, setTempValue] = useState(localStatus?.setpointTemperature ?? 22);
    const [fanValue, setFanValue] = useState(localStatus?.fanSpeed ?? 1);

    useEffect(() => {
        setLocalStatus(status);
    }, [status]);

    useEffect(() => {
        setTempValue(localStatus?.setpointTemperature ?? 22);
        setFanValue(localStatus?.fanSpeed ?? 1);
    }, [localStatus]);

    if (!localStatus) return <Typography color="error">Dati non disponibili</Typography>;

    const handleCommand = async (key, value) => {
        try {
            await sendCommand(key, value);

            if (key === "temperature") {
                setLocalStatus((prev) => ({ ...prev, setpointTemperature: value })); // 🔥 usa la chiave giusta
                setTempValue(value);
            } else if (key === "fanSpeed") {
                setLocalStatus((prev) => ({ ...prev, fanSpeed: value }));
                setFanValue(value);
            } else if (key === "onOff") {
                setLocalStatus((prev) => ({ ...prev, onOff: value }));
            } else if (key === "mode") {
                setLocalStatus((prev) => ({ ...prev, mode: value }));
            }
        } catch (e) {
            console.error("Errore comando:", e);
        }
    };

    const handleSliderTempChangeCommitted = (_, val) => {
        setTempValue(val); // Aggiorna localmente
        handleCommand("temperature", val); // Invia al backend
        console.log(tempValue);
    };

    const handleSliderFanChangeCommitted = (_, val) => {
        setFanValue(val); // Aggiorna localmente
        handleCommand("fanSpeed", val); // Invia al backend
    };

    return (
        <div className="climate-wrapper">
            <Card className="climate-card">
                <CardContent>
                    <h5 className="climate-title mb-3">Controllo Climatizzatore</h5>
                    <h5 className="climate-title mb-3">{localStatus.name}</h5>


                    {/* Pulsante Power */}
                    <div className="d-flex justify-content-center mb-4">
                        <button
                            className={`power-btn ${localStatus.onOff === "on" ? "on" : "off"}`}
                            onClick={() =>
                                handleCommand("onOff", localStatus.onOff === "on" ? "off" : "on")
                            }
                        >
                            <Power size={60} color="#fff" />
                        </button>
                    </div>

                    {/* Modalità */}
                    <div className="mode-toggle btn-group d-flex mb-3">
                        {localStatus.availableModes?.map((m) => (
                            <button
                                key={m}
                                className={`btn ${localStatus.mode === m ? "active" : ""}`}
                                onClick={() => handleCommand("mode", m)}
                            >
                                {modeIcons[m] || m}
                            </button>
                        ))}
                    </div>

                    {/* Slider temperatura */}
                    <div className="custom-slider mb-3">
                        <label className="form-label temp-label">
                            Temperatura Target: {tempValue}°C
                        </label>
                        <input
                            type="range"
                            min="16"
                            max="32"
                            step="0.5"
                            value={tempValue}
                            className="form-range"
                            onChange={(e) => setTempValue(parseFloat(e.target.value))}
                            onMouseUp={(e) =>
                                handleSliderTempChangeCommitted(null, parseFloat(e.target.value))
                            }
                        />
                    </div>

                    {/* Temperatura ambiente */}
                    <p className="room-temp">
                        Temperatura Ambiente:{" "}
                        {localStatus.roomTemperature !== null
                            ? `${localStatus.roomTemperature}°C`
                            : "--"}
                    </p>

                    {/* Fan Speed */}
                    {localStatus.fanSpeed !== null && (
                        <div className="fan-slider mb-3">
                            <label className="form-label temp-label">
                                Velocità Ventola: {fanValue}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="1"
                                value={fanValue}
                                onChange={(e) => setFanValue(parseInt(e.target.value))}
                                onMouseUp={(e) =>
                                    handleSliderFanChangeCommitted(null, parseInt(e.target.value))
                                }
                            />
                            <div className="fan-marks">
                                <span>Bassa</span>
                                <span>Media</span>
                                <span>Alta</span>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export default ClimateControlPanel;
