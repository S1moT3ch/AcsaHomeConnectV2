//import dei componenti necessari
import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Grid,
    CircularProgress,
} from '@mui/material';
import axios from 'axios';
import {BACKEND_URL} from "../config/config";
import {useNavigate} from "react-router-dom";

import Meteo from './Meteo';
import News from './News';
import Bar from './Bar';


const User = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    //chiamata http con Axios con autenticazione per recuperare le info dell'utente attualmente loggato
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:  `Bearer ${token}`,
                    },
                    withCredentials: true,
                });
                setUser(res.data);
            } catch (err) {
                console.error('Errore nel recupero dati utente:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    //chiamata http con Axios per effettuare il logout utente
    const handleLogout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, {
                withCredentials: true,
            });
            localStorage.removeItem('accessToken'); //rimozione dell' accessToken da localStorage
            navigate('/login'); //redirect a login
        } catch (error) {
            console.error("Errore durante il logout: ", error);
        }
    }

    //se il componente è ancora in fase di caricamento, mostra il cerchio che ruota
    if (loading) {
        return (
            <Box display="flex" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    //se il componente è stato caricato in tutte le sue parti, renderizza la dashboard
    return (
        <Box>
            <Bar />
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ m: 3}}>
                    {/* mostra nome dell'utente attualmente loggato */}
                    Benvenuto{user?.nome ?`, ${user.nome}` : ''}!
                </Typography>

                {/* mostra i componenti Grid interni con layout display: flex*/}
                <Grid container spacing={2} mt={2} sx={{display: "flex", justifyContent: "space-evenly"}}>

                    {/*
                        componenti Meteo e News mostrati in colonna.
                        Essi occuperanno tutto lo spazio disponibile
                        in larghezza per schermi piccoli,
                        altrimenti occuperanno 9 colonne delle 12 disponibili
                    */}
                    <Grid item xs={12} md={9} xl={9} container direction="column" spacing={2} sx={{ width: "60vw" }}>
                        <Grid item>
                            <Meteo />
                        </Grid>

                        <Grid item>
                            <News />
                        </Grid>
                    </Grid>

                    {/*
                        bottoni di navigazione mostrati in colonna.
                        Essi occuperanno tutto lo spazio disponibile
                        in larghezza per schermi piccoli,
                        altrimenti occuperanno 3 colonne delle 12 disponibili
                    */}
                    <Grid item xs={12} sm={3} xl={3} sx={{ display: 'flex', flexDirection: 'column' , gap:2}}>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/profile')} // al click del pulsante naviga alla pagina profilo utente
                            size="large"
                            sx={{ fontSize: "1.2rem", paddingY: 1.5 }}
                        >
                            Area Riservata
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/conditioners')} // al click del pulsante naviga alla pagina clima
                            size="large"
                            sx={{ fontSize: "1.2rem", paddingY: 1.5 }}
                        >
                            Climatizzazione
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/heating')} // al click del pulsante naviga alla pagina riscaldamento
                            size="large"
                            sx={{ fontSize: "1.2rem", paddingY: 1.5 }}
                        >
                            Riscaldamento
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/dishwasher')} // al click del pulsante naviga alla pagina lavastoviglie
                            size="large"
                            sx={{ fontSize: "1.2rem", paddingY: 1.5 }}
                        >
                            Lavastoviglie
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleLogout} // al click del pulsante effettua il logout
                            size="large"
                            sx={{ fontSize: "1.2rem", paddingY: 1.5, backgroundColor:"red" }}
                        >
                            Logout
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default User;