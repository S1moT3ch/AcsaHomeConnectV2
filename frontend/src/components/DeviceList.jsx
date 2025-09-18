import React, { useEffect, useState } from "react";
import axios from "axios";
import ClimateControlContainer from "./ClimateControlContainer";
import { BACKEND_URL } from "../config/config";

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
                const resp = await axios.get(`${BACKEND_URL}/api/devices`, {
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
        <div>
            <h2 className="text-xl font-bold mb-2">I tuoi dispositivi</h2>
            {devices.map((d) => {
                const status = statuses.find((s) => s?.id === d.id);
                return (
                    <ClimateControlContainer
                        key={d.id}
                        deviceId={d.id}
                        status={status ?? {}} // fallback oggetto vuoto
                    />
                );
            })}
        </div>
    );
}

export default DeviceList;
