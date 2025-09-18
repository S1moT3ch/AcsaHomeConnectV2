import React from "react";
import ClimateControlPanel from "./ClimateControlPanel";
import { useClimateControl } from "./UseClimateControl";

export default function ClimateControlContainer({ deviceId }) {
    const { status, loading, error, sendCommand } = useClimateControl(deviceId);

    if (loading) return <div>Caricamento...</div>;
    if (error) return <div className="text-red-500">Errore: {error}</div>;

    return (
        <div>
            {status && (
                <ClimateControlPanel
                    onCommand={sendCommand}
                />
            )}
        </div>
    );
}
