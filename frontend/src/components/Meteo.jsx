//import dei componenti necessari
import React, { useState, useEffect } from 'react';
import {METEO_API_KEY} from "../config/config"
import {CITY} from "../config/config"
import axios from 'axios';
import { Box, Typography, Paper } from '@mui/material';

const Meteo = () => {
    const [meteo, setMeteo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState(null);

    //chiamata http con Axios ad un'API di OpenWeatherMap per recuperare i dati meteo
    useEffect(() => {
        const fetchMeteo = async () => {
            try {
                const res = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${METEO_API_KEY}`
                );
                setMeteo(res.data);
            } catch (err) {
                setError("Impossibile caricare il meteo");
            } finally {
                setLoading(false);
            }
        };

        fetchMeteo();
    }, []);

    if (loading) return <Typography>Caricamento meteo...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    //icona del meteo previsto
    const iconUrl = `https://openweathermap.org/img/wn/${meteo.weather[0].icon}@2x.png`;

    //componente meteo con le relative informazioni
    return (
        <Paper
            sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Box>
                <Typography variant="h6">Meteo</Typography>
                <Typography variant="h6">{meteo.name}</Typography>
                <Typography>Temperatura: {Math.round(meteo.main.temp)}°C</Typography>
                <Typography>Percepita: {Math.round(meteo.main.feels_like)}°C</Typography>
                <Typography>Umidità: {meteo.main.humidity}%</Typography>
                <Typography>Vento: {meteo.wind.speed} m/s</Typography>
            </Box>
            <Box>
                <img src={iconUrl} alt={meteo.weather[0].description} style={{width: "140%"}} />
            </Box>
        </Paper>
    );
};

export default Meteo;