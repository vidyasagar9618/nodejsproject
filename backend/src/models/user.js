const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    img_url: {
        type: String,
        required: true
    },
});

// Create User model based on schema
const User = mongoose.model('User', userSchema);

module.exports = User;