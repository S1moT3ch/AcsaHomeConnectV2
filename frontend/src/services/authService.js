//import dei componenti necessari
import {BACKEND_URL} from "../config/config";
import axios from 'axios';

//middleware client-side con chiamata http con Axios, effettuata con autenticazione,
//per verificare lo stato di autenticazione
export async function checkAuth() {
    try {
        const token = localStorage.getItem('accessToken');

        const res = await axios.get(`${BACKEND_URL}/api/auth/check-auth`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        });

        if (res.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('Errore durante il check auth:', err.response?.status);
        return false;
    }
}