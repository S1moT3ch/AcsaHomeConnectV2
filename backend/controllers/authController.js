// import delle librerie necessarie e dello schema utente
const User = require('../models/userModel');
const RefreshToken = require ('../models/refreshTokenModel');
const jwt = require ('jsonwebtoken');

// Funzione per generare i token
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '25m' } // Access token a breve scadenza
    );
    const refreshToken = jwt.sign(
        { userId: userId},
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken }; // Refresh token a lunga scadenza
};

// Registrazione Utente
exports.registerUser = async (req,res) => {
    try {
        const { username, nome, cognome, dataNascita, dataAssunzione, cellulare, email, password } = req.body;

        // Controlla se l'utente o l'email esistono già
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username già in uso." });
        }
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email già in uso." });
        }

        const newUser = new User({ username, nome, cognome, dataNascita, dataAssunzione, cellulare, email, password });
        await newUser.save(); // La password viene hashata dal middleware pre-save in userModel

        res.status(201).json({ message:"Utente registrato con successo!", userId: newUser._id })
    } catch (error) {
        console.error("Errore registrazione", error);
        // Gestione degli errori di validazione di Mongoose
        if (error.name === 'ValidationError') {
           const messages = Object.values(error.errors).map(val => val.message);
           return res.status(400).json({ messages: message.join('. ') });
        }
        res.status(500).json({ message: "Errore del server durante la registrazione." });
    }
};

// Login Utente
exports.loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email e password sono obbligatori" });
        }

        //ricerca utente per email
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: "Credenziali non valide." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        //se le credenziali sono valide, vengono creati i token
        const { accessToken, refreshToken } = generateTokens(user._id);
        console.log(`[LOGIN] Salvataggio refresh token nel DB: ${refreshToken} per utente ${user._id}`); //log per debug
        await RefreshToken.create({ token: refreshToken, userId: user._id});

        // Si imposta il refresh token in un cookie HTTPOnly
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:'Strict',
            maxAge: 7*24*60*60*1000 //scadenza 7 giorni (come il token)
        })

        // Invia l'access token nel corpo della risposta
        res.json({
            message: "Login effettuato con successo!",
            accessToken,
            user: { // Invio di alcune info utenti non sensibili
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Errore login:", error);
        res.status(500).json({ message: "Errore del server durante il login." });
    }
};

exports.refreshToken = async (req,res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
        return res.status(401).json({ message: "Non autorizzato: Refresh token mancante." });
    }

    const  refreshTokenTokenFromCookie = cookies.jwt

    // debug
    console.log(`[REFRESH] Tentativo di refresh con token dal cookie: ${refreshTokenFromCookie}`);

    const foundToken = await RefeshToken.findOne({ token: refreshTokenTokenFromCookie });
    if (!foundToken) {
        console.log(`[REFRESH] Token ${refreshTokenFromCookie} NON trovato nel DB. Accesso negato.`);
        return res.status(403).json({ message: "Proibito: Refresh token non valido o scaduto (non in DB)." })
    }
    console.log(`[REFRESH] Token ${refreshTokenFromCookie} TROVATO nel DB. Procedo con la verifica JWT.`);

    try {
        // Cerca il refresh token nel DB
        const foundToken = await RefreshToken.findOne({ token: refreshTokenTokenFromCookie});
        if (!foundToken) {
            return res.status(403).json({ message: "Proibito: Refresh token non valido o scaduto." });
        }

        // Verifica il refresh token
        jwt.verify(refreshTokenTokenFromCookie, process.env.REFRESH_TOKEN_SECRET, async (err, decoded ) => {
            if(err || foundToken.userId.toString !== decoded.userId) {
                return res.status(403).json({ message: "Proibito: Refresh token non valido o scaduto." });
            }

            // Il refresh token è valido, genera un nuovo access token
            const newAccessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '25m' }
            );

            res.json({ accessToken: newAccessToken });
        });
    }catch (error) {
        console.error("Errore refresh token:", error);
        res.status(500).json({ message: "Errore del server durante il refresh del token." });
    }
};

// Logout Utente
exports.logoutUser = async (req,res) => {
    const cookies = req.cookies;
    //se il cookie non esiste, restituisce stato 204
    if (!cookies?.jwt) {
        return res.sendStatus(204);
    }

    const refreshTokenFromCookie = cookies.jwt;

    // log per debug
    console.log(`[LOGOUT] Tentativo di eliminare refresh token dal DB: ${refreshTokenFromCookie}`);
    const result = await RefreshToken.deleteOne({ token: refreshTokenFromCookie });
    console.log(`[LOGOUT] Risultato deleteOne: deletedCount = ${result.deletedCount}`);

    if (result.deletedCount === 0) {
        console.warn(`[LOGOUT] ATTENZIONE: Nessun refresh token trovato nel DB da eliminare per il token: ${refreshTokenFromCookie}`);
    }

    try {
        // Rimuovi il refresh token dal database
        await RefreshToken.deleteOne({ token: refreshTokenFromCookie });
        // Pulisci il cookie
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });
        res.status(200).json({message: "Logout effettuato con successo." });

    }catch (error) {
        console.error("Errore logout: ", error);
        res.status(500).json({ message: "Errore del server durante il logout." });
    }
};

// Funzione per trovare l'utente attualmente loggato
exports.whoAmI = async (req,res) => {
    try{
        const user = await User.findById(req.userId)
        res.status(200).json(user);
    } catch (error) {
        console.error("Errore recupero dati utente: ", error);
        res.status(500).json({ message: "Errore del server durante il recupero dati utente." });
    }
}

// Funzione per modificare alcuni dati utente
exports.edit = async (req,res) => {
    const { email, cellulare } = req.body;

    if (!email || !cellulare) {
        return res.status(400).json({ message: "Email e cellulare sono obbligatori" });
    }

    try{
        const user = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({ message: "Utente non trovato" });
        }

        let updateFields = { email, cellulare }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            updateFields,
            {
                new: true,
                runValidators: true,
            }
        )

        // Invia i valori aggiornati nel corpo della risposta
        res.json({
            username: updatedUser.username,
            nome: updatedUser.nome,
            cognome: updatedUser.cognome,
            email: updatedUser.email,
            cellulare: updatedUser.cellulare,
            dataNascita: updatedUser.dataNascita,
            dataAssunzione: updatedUser.dataAssunzione,
        });
    } catch (error) {
        console.error("Errore durante update del profilo: ", error);
        res.status(500).json({ message: "Errore interno del server" });
    }
}