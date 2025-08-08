const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["message", "match", "unmatch", "story", "reminder", "system"],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    link: { 
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    delivered: { 
        type: Boolean,
        default: false
    },
    metadata: { 
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
