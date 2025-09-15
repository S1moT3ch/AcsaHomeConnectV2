//import dipendenze e moduli necessari
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const  { verifyAccessToken } = require('../middlewares/authMiddleware');

//registrazione utente
router.post('/register', authController.registerUser);

//login utente
router.post('/login', authController.loginUser);

//verifica autenticazione per frontend
router.get('/check-auth', verifyAccessToken, (req, res) => {
    res.status(200).json({ message: 'Autenticato '});
});

//informazioni utente
router.get('/me', verifyAccessToken, authController.whoAmI);

//modifica dati utente
router.put('/editMe', verifyAccessToken, authController.edit)

//refresh del token
router.post('/refreshToken', authController.refreshToken);

//logout utente
router.post('/logout', authController.logoutUser);

module.exports = router;