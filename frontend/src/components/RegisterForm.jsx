//import dei component necessari
import React, {useState} from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    IconButton,
    InputAdornment,
    Alert,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import axios from 'axios';
import {BACKEND_URL} from "../config/config";
import 'bootstrap/dist/css/bootstrap.min.css';
import './style/RegisterForm.css';

const RegisterForm = ({setIsLogin}) => {

    const [username, setUsername] = useState('');
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [dataNascita, setDataNascita] = useState('');
    const [cellulare, setCellulare] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        //chiamata http con Axios per inviare al backend i dati del form di registrazione
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try{
            const res = await axios.post(
                `${BACKEND_URL}/api/auth/register`,
                { username, nome, cognome, dataNascita, cellulare, email, password },
                {withCredentials: true}
            )

            setSuccessMsg('Registrazione avvenuta con successo');
        } catch (error) {
            const message = error.response?.data?.error?.message;
            setErrorMsg(message);
        }
    };

    //funzione per mostrare la password
    const handleShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    //funzione per prevenire comportamenti di default
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    }

    //componente registrazione utente
    return (
        <Box>
            <Paper className="register-form-container p-4 shadow rounded">
                <Typography className="mb-4 text-center register-title">
                    Registrati
                </Typography>

                <form onSubmit={handleSubmit} className="d-flex flex-wrap gap-3">

                    <TextField
                        label="Nome"
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="form-input"
                    />

                    <TextField
                        label="Cognome"
                        type="text"
                        required
                        value={cognome}
                        onChange={(e) => setCognome(e.target.value)}
                        className="form-input"
                    />

                    <TextField
                        label="Username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="form-input"
                    />

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Data di Nascita*"
                            className="form-input"
                            value={dataNascita}
                            onChange={(newValue) => setDataNascita(newValue)}
                            renderInput={(params) => <TextField {...params} className="form-input" required />}
                        />
                    </LocalizationProvider>

                    <TextField
                        label="Cellulare"
                        type="tel"
                        required
                        value={cellulare}
                        onChange={(e) => setCellulare(e.target.value.replace(/\D/g, ''))}
                        className="form-input"
                    />

                    <TextField
                        label="Email"
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                    />

                    <TextField
                        label="Password"
                        type={showPassword? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle pssw visibility"
                                        onClick={handleShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* visualizza i messaggi d'errore */}
                    {errorMsg && (
                        <Alert severity="error">
                            {errorMsg}
                        </Alert>
                    )}

                    {successMsg && (
                        <Alert severity="success">
                            {successMsg && setIsLogin(true)}
                        </Alert>
                    )}

                    <div className="w-100 text-center mt-3">
                        <Button
                            type="submit"
                            variant="contained"
                        >
                            Registrati
                        </Button>
                    </div>
                </form>
            </Paper>
        </Box>
    )
}

export default RegisterForm;