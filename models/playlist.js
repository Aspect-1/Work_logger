const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: String,
  playlistId: { type: String, required: true },
  assignedTo: {
    type: String,
    enum: ['all', 'user'],
    default: 'all'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.assignedTo === 'user';
    }
  }
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
