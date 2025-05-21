const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [12, 'Email must be at least 12 characters long']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [6, 'Password must be at least 6 characters long']
    },
    activeTime: {
        type: Number,
        default: 0 // in seconds
    },
    idleTime: {
        type: Number,
        default: 0
    },
    completedVideos: {
        type: Number,
        default: 0
    },
    totalVideos: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

const user = mongoose.model('User', userSchema)

module.exports = user