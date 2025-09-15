//import delle librerie mongoose e bcrypt
const mongoose = require ('mongoose');
const bcrypt = require('bcryptjs');

//schemaType per gli utenti

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "L'username è obbligatorio"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    nome: {
        type: String,
        required: [true, "Il nome è obbligatorio"],

    },
    cognome: {
        type: String,
        required: [true, "Il cognome è obbligatorio"],

    },
    dataNascita: {
        type: Date,
        required: true,
        default: Date.now
    },
    dataAssunzione: {
        type: Date,
        required: true,
        default: Date.now
    },
    cellulare: {
        type: Number,
        required: [true, "Il numero di cellulare è obbligatorio"],
    },
    email: {
        type: String,
        required: [true, "L'email è obbligatoria"],
        unique: true,
        trim: true,
        lowercase: true,

    },
    password: {
        type: String,
        required: [true, "La password è obbligatoria"],
        minlength: [6, "La password deve essere di almeno 6 caratteri"],
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware pre-save per hashare la password prima di salvarla
userSchema.pre('save', async function (next) {
    // Esegui l'hashing solo se la password è stata modificata (o è nuova)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch(error){
        next(error)
    }
});

// Metodo per confrontare la password inserita con quella hashata nel DB
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema)