require('dotenv').config(); //carica le variabili d'ambiente dal file .env nella root folder del progetto
//definizione delle dipendenze necessarie
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const socketio = require('socket.io');
const session = require("express-session");

//routers
const authRoutes = require('./routes/authRoutes');
const daikinRoutes = require('./routes/daikinRoutes');

const app = express(); //creazione dell'app con il framework express
const server = http.createServer(app); //creazione server http con l'app Express come parametro

//avvio e gestione di socketIO
const io = socketio(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});
const messages = [];
const onlineUsers = new Map()

io.on('connection', (socket) => {
    console.log('Utente connesso: ', socket.id);

    socket.on('login', (userId) => {
        onlineUsers.set(socket.id, userId);
        console.log(`Utente ${userId} connesso con socket ${socket.id}`);
    });

    socket.on('sendMessage', ({ from, to, text }) => {
        const timestamp = new Date();
        const message = { from, to, text, timestamp };
        messages.push(message);

        for (const [sockId, userId] of onlineUsers.entries()) {
            if (userId === to) {
                io.to(sockId).emit('receiveMessage', message);
            }
        }

        for (const [sockId, userId] of onlineUsers.entries()) {
            if (userId === from) {
                io.to(sockId).emit('receiveMessage', message);
            }
        }
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

//middleware definiti in ordine di esecuzione
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

//routes API
app.use('/api/auth', authRoutes);
app.use(daikinRoutes);

// Route di base per test
app.get('/',(req, res) => {
    res.send('Benvenuto nel backend di AcsaHomeConnect')
});

// Semplice gestore di errori globale
app.use((err, req, res, next) => {
    console.error("Errore nella richiesta:");
    res.status(500).send('Qualcosa è andato storto!');
});

//collegamento del database MongoDB
mongoose.connect(process.env.DB_CONNECTION_STRING)
const db = mongoose.connection

//apertura connessione con il database e avvio del server
db.once('open', () => server.listen(PORT, () => console.log(`App connessa a DB e in ascolto sulla porta ${PORT}`)))