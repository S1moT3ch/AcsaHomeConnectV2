import React, { useEffect, useState } from "react";
import axios from "axios";
import ConditionerControl from "./ConditionerControl";
import DeviceControlMui from "./DeviceControlMui";
import {BACKEND_URL} from "../config/config";

function DeviceList() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const resp = await axios.get(`${BACKEND_URL}/api/devices`, {
                    withCredentials: true
                });
                setDevices(resp.data);
            } catch (err) {
                console.error("Errore fetch devices:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    if (loading) return <p>Caricamento...</p>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">I tuoi dispositivi</h2>
            {devices.map((d) => (
                <DeviceControlMui key={d.id} device={d} />
            ))}

        </div>
    );
}

export default DeviceList;
