//import della libreria mongoose
const mongoose = require('mongoose');

//schemaType per i refreshToken
const refreshTokenSchema =  new mongoose.Schema({
    token: {
        type: String,
        requires: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);