const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

const User = require('../models/user.model');
const Playlist = require('../models/playlist');
const UserPlaylistProgress = require('../models/UserPlaylistProgress');

// 📌 Dashboard - shows playlists assigned to the logged-in user
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.userid;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const playlistsAll = await Playlist.find({ assignedTo: 'all' }).lean();
    const playlistsUser = await Playlist.find({ assignedTo: 'user', userId: userObjectId }).lean();

    const playlists = [...playlistsAll, ...playlistsUser];

    res.render('dashboard', {
      user,
      playlists
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Something went wrong loading the dashboard');
  }
});

// 📌 Videos page - renders specific playlist
router.get('/videos', authMiddleware, async (req, res) => {
  try {
    const playlistId = req.query.playlistId;
    const userId = new mongoose.Types.ObjectId(req.user.userid);

    const userData = await User.findById(userId);
    if (!userData) return res.status(404).send("User not found");

    let progress = await UserPlaylistProgress.findOne({ userId, playlistId });
    if (!progress) {
      progress = await UserPlaylistProgress.create({ userId, playlistId, completedCount: 0 });
    }

    res.render('videos', {
      playlistId,
      userId,
      userData,
      completedCount: progress.completedCount
    });
  } catch (err) {
    console.error("Videos page error:", err);
    res.status(500).send("Error loading videos");
  }
});

// 📌 Update user progress (active/idle time + completed videos)
router.post('/api/update-time', authMiddleware, async (req, res) => {
  const {
    activeTime,
    idleTime,
    completedVideos,
    totalVideos,
    playlistId,
    skippedSeconds,
    skippedVideo
  } = req.body;

  const userId = new mongoose.Types.ObjectId(req.user.userid);

  try {
    // ✅ Store everything inside UserPlaylistProgress only
    await UserPlaylistProgress.findOneAndUpdate(
      { userId, playlistId },
      {
        completedCount: completedVideos,
        totalVideos: totalVideos,
        $inc: {
          activeTime: activeTime || 0,
          idleTime: idleTime || 0,
          skippedSeconds: skippedSeconds || 0,
          skippedVideos: skippedVideo ? 1 : 0
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Playlist progress saved" });
  } catch (err) {
    console.error("Update time error:", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
});




// 📌 Admin - view users
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).lean();
    const allPlaylists = await Playlist.find({}).lean();
    const progressData = await UserPlaylistProgress.find({}).lean();

    const grouped = {};

    users.forEach(user => {
      grouped[user._id] = {
        username: user.username,
        userId: user._id,
        playlists: []
      };
    });

    for (const progress of progressData) {
      if (!progress.userId) continue; // ✅ Avoid crash on null userId

      const userId = progress.userId.toString();
      const playlistMeta = allPlaylists.find(p => p.playlistId === progress.playlistId);
      const playlistTitle = playlistMeta ? playlistMeta.title : "(Unknown Playlist)";
      const totalVideos = playlistMeta && playlistMeta.totalVideos !== undefined
        ? playlistMeta.totalVideos
        : 0;

      if (!grouped[userId]) continue;

      grouped[userId].playlists.push({
        playlistTitle,
        completedCount: progress.completedCount || 0,
        skippedVideos: progress.skippedVideos || 0,
        skippedSeconds: progress.skippedSeconds || 0,
        totalVideos
      });
    }

    res.render('admin', { groupedData: Object.values(grouped) });

  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Error loading admin panel");
  }
});


// 📌 Admin - manage playlists
router.get('/admin/playlists', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    const playlists = await Playlist.find({}).populate('userId');

    const groupedPlaylists = {};
    playlists.forEach(p => {
      const key = p.assignedTo === 'all' ? 'all' : p.userId?._id;
      if (!groupedPlaylists[key]) groupedPlaylists[key] = [];
      groupedPlaylists[key].push(p);
    });

    res.render('adminPlaylists', { users, groupedPlaylists });
  } catch (err) {
    console.error("Admin playlists page error:", err);
    res.status(500).send("Error loading playlist management");
  }
});

// 📌 Admin - create playlist
router.post('/admin/playlists', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, playlistId, assignedTo } = req.body;

    const newPlaylist = new Playlist({
      title,
      playlistId,
      assignedTo: assignedTo === 'all' ? 'all' : 'user',
      userId: assignedTo === 'all' ? null : assignedTo
    });

    await newPlaylist.save();
    res.redirect('/admin/playlists');
  } catch (err) {
    console.error("Error saving playlist:", err);
    res.status(500).send("Error creating new playlist");
  }
});

// 📌 Admin - delete playlist
router.post('/admin/playlists/delete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) {
      return res.status(400).send('Playlist ID is required');
    }

    await Playlist.deleteMany({ playlistId });
    res.redirect('/admin/playlists');
  } catch (err) {
    console.error("Error deleting playlist:", err);
    res.status(500).send("Error deleting playlist");
  }
});

module.exports = router;
