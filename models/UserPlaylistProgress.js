// models/UserPlaylistProgress.js
const mongoose = require('mongoose');

const userPlaylistProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playlistId: { type: String, required: true },
  completedCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('UserPlaylistProgress', userPlaylistProgressSchema);
