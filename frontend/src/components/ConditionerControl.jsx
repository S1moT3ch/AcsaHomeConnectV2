import React, { useState } from "react";
import axios from "axios";
import {BACKEND_URL} from "../config/config";

function ConditionerControl({ device }) {

    const climateControl = device.managementPoints.find(
        mp => mp.managementPointType === "climateControl"
    );

    const deviceName = climateControl?.name?.value || device.id;
    const [mode, setMode] = useState("cool");
    const [setpoint, setSetpoint] = useState(22);
    const [message, setMessage] = useState("");

    const handleControl = async () => {
        try {
            const resp = await axios.put(
                `${BACKEND_URL}/api/devices/${device.id}/control`,
                { mode, setpoint },
                { withCredentials: true }
            );
            setMessage("✅ Comando inviato con successo");
            console.log("Risposta controllo:", resp.data);
        } catch (err) {
            console.error("Errore controllo:", err);
            setMessage("❌ Errore nell'invio comando");
        }
    };

    return (
        <div className="border p-3 mb-3 rounded">
            <h3 className="font-bold">{deviceName}</h3>

            <div className="mt-2">
                <label className="block mb-1">Modalità</label>
                <select value={mode} onChange={e => setMode(e.target.value)} className="border rounded p-1">
                    <option value="cool">Cool</option>
                    <option value="heat">Heat</option>
                    <option value="fan">Fan</option>
                    <option value="auto">Auto</option>
                </select>
            </div>

            <div className="mt-2">
                <label className="block mb-1">Setpoint (°C)</label>
                <input
                    type="number"
                    value={setpoint}
                    onChange={e => setSetpoint(Number(e.target.value))}
                    className="border rounded p-1 w-20"
                />
            </div>

            <button
                onClick={handleControl}
                className="mt-3 px-3 py-1 bg-green-600 text-white rounded"
            >
                Invia comando
            </button>

            {message && <p className="mt-2">{message}</p>}
        </div>
    );
}

export default ConditionerControl;