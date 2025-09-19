//import dei componenti necessari

import React, {useState} from 'react';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
} from "@mui/material";
import {BACKEND_URL} from "../config/config";

import 'bootstrap/dist/css/bootstrap.min.css';
import './style/Login.css';
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import {checkAuth} from "../services/authService";


const Login = () => {
    const navigate = useNavigate()

    const [isLogin, setIsLogin] = useState(true);
    const [isAuth, setIsAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        //uso middleware lato-client per verificare l'autenticazione
        const verify = async() => {
            const result = await checkAuth();
            setIsAuth(result);
            setLoading(false);
        };

        verify();
    }, [navigate]);

    //se l'utente è già autenticato, vai direttamente alla pagina utente (dashboard)
    if (isAuth) {
        navigate('/user', {replace: true});
    }

    //funzione per cambiare visuliazzazione tra form login e form registrazione
    const toggleForm = () => {
        setIsLogin(prev => !prev);
    }

    //componente per gestire login o registrazione utente
    return (
        <Box className = "login-container container mt-4 p-4 shadow rounded">

            <div className="logo-container">
                <img src="/logo_full_AHC.png" alt="Logo AHC" className="logo mt-3"/>
            </div>

            <LoginForm />
        </Box>
    )
};

export default Login;