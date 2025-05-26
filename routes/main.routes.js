const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

const User = require('../models/user.model');
const Playlist = require('../models/playlist');

async function getUserData(userId) {
return await User.findById(userId);
}


router.get('/dashboard', authMiddleware, async (req, res) => {
  const user = req.user;

  const playlists = await Playlist.find({ userId: user._id });

  res.render('dashboard', {
    userData: user,
    playlists: playlists // send array of playlists for that user
  });
});



router.get('/videos', authMiddleware, async (req, res) => {
const playlistId = req.query.playlistId;
const userId = req.user.userid;
const userData = await User.findById(userId);
res.render('videos', { playlistId, userId, userData });
});

// updation
router.post('/api/update-time', authMiddleware, async (req, res) => {
  const { activeTime, idleTime, completedVideos, totalVideos } = req.body;
  const userId = req.user.userid;

  try {
    await User.findByIdAndUpdate(userId, {
      activeTime,
      idleTime,
      completedVideos,
      totalVideos
    });
    console.log("User progress updated successfully");
    res.status(200).json({ message: "Progress saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user progress" });
  }
});

router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
const users = await User.find({});
res.render('admin', { users });
});

module.exports = router;