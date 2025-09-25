const mongoose = require("mongoose");

const netatmoTokenSchema = new mongoose.Schema({
    access_token: String,
    refresh_token: String,
    expires_at: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minuti dopo adesso
    }
});

module.exports = mongoose.model("NetatmoToken", netatmoTokenSchema);
