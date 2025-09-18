import { useState, useEffect, useCallback } from "react";
import axios from "axios";

import {BACKEND_URL} from "../config/config";

export function useClimateControl(deviceId) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // 🔧 Esegui comandi
    const sendCommand = useCallback(
        async (type, value) => {
            try {
                let endpoint = "";
                switch (type) {
                    case "onOff":
                        endpoint = "onOff";
                        break;
                    case "mode":
                        endpoint = "mode";
                        break;
                    case "temperature":
                        endpoint = "temperature";
                        break;
                    default:
                        throw new Error("Comando non supportato");
                }

                await axios.patch(`${BACKEND_URL}/api/daikin/devices/${deviceId}/${endpoint}`, { value });

            } catch (err) {
                console.error("Errore comando:", err);
                setError(err.response?.data || err.message || "Errore comando");
            }
        },
        [deviceId]
    );

    return {
        status,
        loading,
        error,
        sendCommand,
    };
}
