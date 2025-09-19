import React, { useEffect, useState } from "react";
import axios from "axios";
import ClimateControlContainer from "./ClimateControlContainer";
import { BACKEND_URL } from "../config/config";
import {
    Box,
} from "@mui/material";
import Bar from "./Bar";

function DeviceList() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState([]);

    function extractStatus(device) {
        if (!device || !Array.isArray(device.managementPoints)) {
            return null;
        }

        const climateControl = device.managementPoints.find(
            (mp) => mp.managementPointType === "climateControl"
        );

        if (!climateControl) return null;

        const mode = climateControl.operationMode?.value ?? "auto";

        return {
            id: device.id,
            name: climateControl.name?.value ?? "Senza nome",
            onOff: climateControl.onOffMode?.value ?? "off",
            mode,
            roomTemperature:
                climateControl.sensoryData?.value?.roomTemperature?.value ?? null,
            setpointTemperature:
                climateControl.temperatureControl?.value?.operationModes?.[mode]
                    ?.setpoints?.roomTemperature?.value ?? null,
            fanSpeed:
                climateControl.fanControl?.value?.operationModes?.[mode]?.fanSpeed
                    ?.modes?.fixed?.value ?? null,
            availableModes: ["auto", "cooling", "heating", "fanOnly", "dry"]
        };
    }



    useEffect(() => {
        const controller = new AbortController();

        const fetchDevices = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const resp = await axios.get(`${BACKEND_URL}/api/daikin/devices`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:  `Bearer ${token}`,
                    },
                    withCredentials: true,
                    signal: controller.signal, // lega la richiesta all'AbortController
                });
                setDevices(resp.data);

                // mappiamo lo status di ciascun device
                const mapped = resp.data.map(extractStatus).filter(Boolean);
                setStatuses(mapped);
            } catch (err) {
                // ignora errori causati da abort()
                if (err.name !== "CanceledError" && err.name !== "AbortError") {
                    console.error("Errore fetch devices:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();

        // cleanup: se il componente viene smontato o l'effetto rieseguito,
        // annulliamo la fetch in corso per evitare doppioni
        return () => controller.abort();
    }, []);

    if (loading) return <p>Caricamento...</p>;

    return (
        <Box>
            <Bar />
            <div className="container mt-4">
                <div className="card shadow-sm p-3 mb-4">
                    <h2 className="card-title h4 mb-3 text-primary fw-bold">
                        I tuoi dispositivi
                    </h2>
                    <div className="row">
                        {devices.map((d) => {
                            const status = statuses.find((s) => s?.id === d.id);
                            return (
                                <div className="d-flex justify-content-evenly" key={d.id}>
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body">
                                            <ClimateControlContainer
                                                deviceId={d.id}
                                                status={status ?? {}} // fallback oggetto vuoto
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Box>
    );
}
export default DeviceList;
