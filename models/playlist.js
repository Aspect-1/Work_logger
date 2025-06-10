const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: String,
  playlistId: { type: String, required: true },
  assignedTo: {
  type: String,
  enum: ['all', 'user', 'group'],
  default: 'all'
},
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function () {
      return this.assignedTo === 'group';
    }
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.assignedTo === 'user';
    }
  },
  totalVideos: {
    type: Number,
    default: 0
  }
});


const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
