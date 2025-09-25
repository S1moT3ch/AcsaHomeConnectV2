import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FaWifi, FaFire, FaPlay, FaChevronUp, FaChevronDown } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../config/config";
import ThermostatDashboard from "./ThermostatDashboard";
import Bar from "./Bar";
import { Button, Box } from "@mui/material";
import ScheduleManager from "./ScheduleManager";
import ScheduleList from "./ScheduleList";

const Container = styled.div`
    width: 400px;
    height: 240px;
    background: #e1e0e0;
    border-radius: 16px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    position: relative;
    font-family: 'Segment7', sans-serif;
`;

const Display = styled.div`
    font-size: 90px;
    padding-top: 60px;
    padding-left: 60px;
    color: #ffffff;
`;

const SymbolContainer = styled.div`
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 10px;
    color: #888;
`;

const VerticalBar = styled.div`
    position: absolute;
    top: 0;
    right: 25%;
    width: 6px;
    height: 100%;
    background: ${(props) => (props.active ? "red" : "#ccc")};
    border-radius: 2px;
    transition: background 0.5s ease; /* transizione */
`;

const FireIcon = styled(FaFire)`
  color: white;
  opacity: ${(props) => (props.show ? 1 : 0)};
  transform: translateY(${(props) => (props.show ? "0" : "-10px")});
  transition: all 0.4s ease;
`;

const ActionWrapper = styled.div`
    position: absolute;
    top: 50%;
    right: 25px;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &:hover .temp-button,
    &:focus-within .temp-button {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
`;

const ActionButton = styled.div`
    background: #e1e0e0;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 4px rgb(255, 255, 255);
    cursor: pointer;
    color: #ffffff;
`;

const TempButton = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    transform: translateY(${(props) => (props.direction === "up" ? "-10px" : "10px")});

    &.temp-button {
        color: ${(props) => (props.direction === "up" ? "#e74c3c" : "#3498db")};
    }
`;

const CenteredBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  gap: 16px;
`;

const Smarther2UI = () => {
    const [temperature, setTemperature] = useState(20);
    const [mode, setMode] = useState("manual");
    const [measuredTemp, setMeasuredTemp] = useState(null);
    const [boilerOn, setBoilerOn] = useState(false);
    const [firstHome, setFirstHome] = useState([]);
    const [homeId, setHomeId] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showSetTemp, setShowSetTemp] = useState(false);

    const fetchData = async () => {
        try {
            const homesResp = await axios.get(`${BACKEND_URL}/api/netatmo/homes`);
            const firstHome = homesResp.data.homes[0];
            setFirstHome(firstHome);
            setHomeId(firstHome.id);

            const statusResp = await axios.get(`${BACKEND_URL}/api/netatmo/status/${firstHome.id}`);
            const homeData = statusResp.data.home;
            const room = homeData.rooms[0];
            setRoomId(room.id);
            setMode(room.therm_setpoint_mode);
            setTemperature(room.therm_setpoint_temperature || 20);
            setMeasuredTemp(room.therm_measured_temperature);

            if (homeData.modules && homeData.modules.length > 0) {
                setBoilerOn(homeData.modules[0].boiler_status);
            }
        } catch (error) {
            console.error("Errore nel fetch dei dati", error);
        }
    };

    const updateArrowTemperature = async (newTemp) => {
        const mode = "manual";
        try {
            await axios.post(`${BACKEND_URL}/api/netatmo/setstate`, {
                homeId,
                roomId,
                mode,
                temperature: Number(newTemp),
            });
            setTemperature(newTemp);
        } catch (err) {
            console.error("Errore aggiornamento temperatura", err);
        }
    };

    const handleBoost = async () => {
        setLoading(true);
        setMessage(null);

        const mode = "manual";
        try {
            const resp = await axios.post(`${BACKEND_URL}/api/netatmo/boostheating`, {
                homeId,
                roomId,
                mode,
                temperature: 30,
            });

            setMessage(resp.data.message || "Boost attivato!");
        } catch (err) {
            setMessage("Errore: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTempChange = (delta) => {
        let newTemp = Math.min(30, Math.max(5, parseFloat(temperature) + delta));
        setShowSetTemp(true);
        setTemperature(newTemp);
        updateArrowTemperature(newTemp);
        setTimeout(() => setShowSetTemp(false), 5000); // dopo 8 sec torna a mostrare la temperatura reale
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <CenteredBox>
            <Bar />
            <Container>
                <SymbolContainer>
                    <FaWifi size={20} />
                    <FireIcon size={20} show={boilerOn} />
                </SymbolContainer>

                <Display>
                    {showSetTemp
                        ? `${temperature.toFixed(1)}°`
                        : measuredTemp
                            ? `${measuredTemp.toFixed(1)}°`
                            : "--"}
                </Display>

                <VerticalBar active={boilerOn} />

                <ActionWrapper>
                    <TempButton
                        className="temp-button"
                        direction="up"
                        onClick={() => handleTempChange(0.5)}
                    >
                        <FaChevronUp />

                    </TempButton>

                    <ActionButton onClick={handleBoost}>
                        <FaPlay size={20} />
                    </ActionButton>

                    <TempButton
                        className="temp-button"
                        direction="down"
                        onClick={() => handleTempChange(-0.5)}
                    >
                        <FaChevronDown />
                    </TempButton>
                </ActionWrapper>
            </Container>

            {message && <p className="mt-3 text-gray-700">{message}</p>}

            <Button
                variant="contained"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {isOpen ? "Nascondi altre impostazioni" : "Mostra altre impostazioni"}
            </Button>

            {isOpen &&
                <div>
                    <ThermostatDashboard setMessage={setMessage} />
                    <ScheduleManager homeId={homeId} roomId={roomId}/>
                    <ScheduleList home={firstHome} />
                </div>
            }
        </CenteredBox>
    );
};

export default Smarther2UI;
