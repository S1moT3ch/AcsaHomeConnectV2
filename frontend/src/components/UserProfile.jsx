//import dei componenti necessari
import React, {useEffect, useState} from 'react';
import axios from "axios";
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Typography,
    Grid
} from '@mui/material';
import {BACKEND_URL} from "../config/config";

import Bar from "./Bar";

function UserProfile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null)

    const [editMode, setEditMode] = useState(false);
    const [email, setEmail] = useState('');
    const [cellulare, setCellulare] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(null);

    useEffect(() => {
        //chiamata http con Axios con autenticazione per recuperare le info dell'utente attualmente loggato
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization:  `Bearer ${token}`,
                    },
                    withCredentials: true,
                });

                if (res.status !== 200) {
                    throw new Error('Errore nel recupero dati');
                }

                const data = await res.data;
                setUser(data);

                setEmail(data.email || '');
                setCellulare(data.cellulare || '')
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [])

    //funzione gestore click su bottone modifica
    const handleEditClick = () => {
        setEditMode(true);
        setSaveError(null);
        setSaveSuccess(null);
    };

    //funzione per salvare le modifiche effettuaute
    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        //chiamata http con Axios con autenticazione per aggiornare i dati utente
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.put(
                `${BACKEND_URL}/api/auth/editMe`,
                {email, cellulare},
                {
                headers: {
                    'content-type': 'application/json',
                    Authorization:  `Bearer ${token}`,
                },
                    withCredentials: true,
            })

            if (res.status !== 200) {
                throw new Error('Errore nel salvataggio dati');
            }

            setUser(res.data);
            setEditMode(false);
            setSaveSuccess('Dati aggiornati con successo');
        } catch (err) {
            setSaveError(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    }

    //funzione per calcolare l'anzianità di servizio di un dipendente
    const calcolaAnzianita = (dataAssunzione) => {
        const assunzione = new Date(dataAssunzione);
        const oggi = new Date();

        let anni = oggi.getFullYear() - assunzione.getFullYear();
        let mesi = oggi.getMonth() - assunzione.getMonth();
        let giorni = oggi.getDate() - assunzione.getDate();

        if (giorni <0) {
            mesi -= 1;
            const giorniMesePrec = new Date(oggi.getFullYear(), oggi.getMonth(), 0).getDate();
            giorni += giorniMesePrec
        }

        if (mesi <0) {
            anni -= 1;
            mesi += 12;
        }

        return `${anni} anni, ${mesi} mesi e ${giorni} giorni`;
    }

    //se i dati sono in caricamento, attendi
    if (loading) return <p>Caricamento dati...</p>;
    //se si è verificato un errore, renderizza l'errore
    if (error) return <p>Errore: {error}</p>;
    // se non è stao recuperato alcun utente, mostra che non è possibile mostrare alcun dato
    if (!user) return <p>Nessun dato utente disponibile</p>;

    //componente profilo Utente
    return (
        <Box>
            <Bar />
            <Box sx={{ mx: 'auto', mt: 2}}>
                <Paper elevation={3} sx={{ p: 4 }}>

                    <Typography variant="h5" gutterBottom>
                        Profilo Utente
                    </Typography>

                    {/* layout responsivo per device con schermi più piccoli*/}
                    <Grid container spacing={2} sx={{ mb: 2, display: "flex", flexDirection: "column" }}>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Username:</strong> {user.username}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Nome:</strong> {user.nome}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Cognome:</strong> {user.cognome}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Data di Nascita:</strong> {user.dataNascita.split('T')[0]}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Data di Assunzione:</strong> {user.dataAssunzione.split('T')[0]}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography><strong>Anzianità:</strong> {calcolaAnzianita(user.dataAssunzione)}</Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* se si è in modalità modifica, mostra possibilità di modificare i campi, altrimenti visualizzali soltanto */}
                        {editMode? (
                            <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", gap:2 }}>
                                <TextField
                                    label="Cellulare"
                                    type="tel"
                                    value={cellulare}
                                    //in questo campo si possono scrivere solo numeri
                                    onChange={(e) => setCellulare(e.target.value.replace(/\D/g, ''))}
                                    disabled={!editMode}
                                />

                                <TextField
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!editMode}
                                />
                            </Grid>
                        ) : (
                            <Grid container spacing={2} sx={{ mb: 2, display: "flex", flexDirection: "column"}}>
                                <Grid item xs={12} sm={6}>
                                    <Typography><strong>Cellulare:</strong> {user.cellulare}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography><strong>Email:</strong> {user.email}</Typography>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>

                    {/* mostra eventuali errori o messaggi di successo */}
                    {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
                    {saveSuccess && <Alert severity="success" sx={{ mt: 2 }}>{saveSuccess}</Alert>}

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* se non si è in modalità modifica, renderizza il pulsante "Modifica", altrimenti renderizza il pulsante "Salva" */}
                        {!editMode ? (
                            <Button variant="contained" color="primary" onClick={handleEditClick}>Modifica</Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleSave}
                            >
                                {saving ? <CircularProgress /> : 'Salva'}
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}

export default UserProfile;
