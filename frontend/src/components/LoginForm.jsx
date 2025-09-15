//import dei componenti necessari
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
import {
    Visibility,
    VisibilityOff
} from "@mui/icons-material";
import {BACKEND_URL} from "../config/config";

import 'bootstrap/dist/css/bootstrap.min.css';
import './style/LoginForm.css';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    //chiamata http con Axios per inviare al backend i dati del login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await axios.post(
                `${BACKEND_URL}/api/auth/login`,
                { email, password },
                { withCredentials: true }
            );

            //salvataggio accessToken in localStorage per future chiamate http con autentcazione stateless
            localStorage.setItem('accessToken', res.data.accessToken)
            setSuccessMsg('Login effettuato!');
            //se il login va a buon fine, naviga alla dashboard
            navigate('/user');
        } catch (err) {
            const message = err.response?.data?.message;
            setErrorMsg(message);
        }
    };

    //funzione per mostrare la password
    const handleShowPassword = () => {
        setShowPassword((prev) => !prev);
    };

    //funzione per prevenire eventi di default
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    }

    //Componente per effettuare il login
    return (
        <Box className="container mt-5">
            <Paper className="login-form-container p-4 shadow rounded">
                <Typography variant="h5" className="mb-4 text-center access-title">
                    Accedi
                </Typography>
                <form onSubmit = {handleSubmit} className="d-flex flex-column gap-3">
                    <TextField
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField
                        label="Password"
                        type={showPassword? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                    {/* visualizzazione messaggi di errore */}
                    {errorMsg && (
                        <Alert severity="error">
                            {errorMsg}
                        </Alert>
                    )}

                    {successMsg && (
                        <Alert severity="success">
                            {successMsg}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        className="login-button"
                    >
                        Login
                    </Button>

                </form>
            </Paper>
        </Box>
    );
};

export default LoginForm;