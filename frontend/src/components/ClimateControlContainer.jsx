import React from "react";
import ClimateControlPanel from "./ClimateControlPanel";
import { useClimateControl } from "./UseClimateControl";

export default function ClimateControlContainer({ deviceId, status }) {
    const { sendCommand } = useClimateControl(deviceId);


    return (
        <div>
            {status && (
                <ClimateControlPanel
                    onCommand={sendCommand}
                    deviceId={deviceId}
                    status={status}
                />
            )}
        </div>
    );
}
