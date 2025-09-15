//import delle librerie e modelli necessari
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware per verificare l'Access Token JWT
const verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if(!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Non autorizzato: Token mancante o malformato' });
    }

    const token = authHeader.split(' ')[1]; //prende il token dopo "Bearer "

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error('Errore verifica JWT:', err.name, err.message);
            return res.status(403).json({ message: 'Proibito: Token non valido o scaduto' });
        }

        //il token è valido, aggiungi l'ID dell'utente
        req.userId = decoded.userId
        next();
    });
};

module.exports = { verifyAccessToken } ;