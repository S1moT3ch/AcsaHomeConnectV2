const mongoose = require("mongoose");

const userTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // puoi associare l'utente se hai login
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpires: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("userToken", userTokenSchema);
