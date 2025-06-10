// models/UserPlaylistProgress.js
const mongoose = require('mongoose');

const userPlaylistProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playlistId: { type: String, required: true },
  completedCount: { type: Number, default: 0 },
  skippedSeconds: { type: Number, default: 0 },
  skippedVideos: { type: Number, default: 0 },
  activeTime: { type: Number, default: 0 },
  idleTime: { type: Number, default: 0 },
  totalVideos: { type: Number, default: 0 },

}, { timestamps: true });


module.exports = mongoose.model('UserPlaylistProgress', userPlaylistProgressSchema);
