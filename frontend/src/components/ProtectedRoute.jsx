//import dei componenti necessari
import { useEffect, useState} from 'react';
import {Navigate, Outlet } from 'react-router-dom';
import {checkAuth} from '../services/authService';

//funzione per vericare l'autenticazione lato client
function ProtectedRoute() {
    const [isAuth, setIsAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    //uso middleware lato client per verificare l'autenticazione
    useEffect(() => {
        const verify = async() => {
            const result = await checkAuth();
            setIsAuth(result);
            setLoading(false);
        };

        verify();
    }, []);

    //se la funzione non è ancora terminata, renderizza "Caricamento..."
    if (loading) return <p>Caricamento</p>;
    //se la funzione restituisce false, ritorna al login
    if (!isAuth) return <Navigate to ='/login' replace />

    //renderizza i vari componenti figli definiti in React Router
    return <Outlet />;
}

export default ProtectedRoute;