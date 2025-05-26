const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: String,
  playlistId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // For user-specific playlists
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;