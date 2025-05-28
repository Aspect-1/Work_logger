const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

const User = require('../models/user.model');
const Playlist = require('../models/playlist');

// Dashboard - shows playlists assigned to the logged-in user
const mongoose = require('mongoose'); // Ensure this is at the top

router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // ✅ Access userId correctly from token
    const userId = user.userid;

    // DEBUG 1: Check extracted userid and type
    console.log('user.userid:', userId, 'typeof:', typeof userId);

    // ✅ Safely convert to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // DEBUG 2: Split queries
    const playlistsAll = await Playlist.find({ assignedTo: 'all' }).lean();
    const playlistsUser = await Playlist.find({ assignedTo: 'user', userId: userObjectId }).lean();

    // DEBUG 3: Print results
    console.log('Public playlists:', playlistsAll);
    console.log('User-specific playlists:', playlistsUser);

    // Merge both
    const playlists = [...playlistsAll, ...playlistsUser];

    // Render dashboard
    res.render('dashboard', {
      user,
      playlists
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).send('Something went wrong loading the dashboard');
  }
});



// Videos page - renders specific playlist
router.get('/videos', authMiddleware, async (req, res) => {
  try {
    const playlistId = req.query.playlistId;
    const userId = req.user.userid; // ✅ Use userid from JWT payload

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).send("User not found");
    }

    res.render('videos', { playlistId, userId, userData });
  } catch (err) {
    console.error("Videos page error:", err);
    res.status(500).send("Error loading videos");
  }
});


// Update user progress (active/idle time, completed videos)
router.post('/api/update-time', authMiddleware, async (req, res) => {
  const { activeTime, idleTime, completedVideos, totalVideos } = req.body;
  const userId = req.user._id;

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
    console.error("Update time error:", err);
    res.status(500).json({ error: "Failed to update user progress" });
  }
});

// Admin dashboard - view all users
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin', { users });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).send("Error loading admin panel");
  }
});

// Admin playlist management page
router.get('/admin/playlists', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    const playlists = await Playlist.find({}).populate('userId');

    // Group playlists by userId or 'all'
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

// Admin playlist creation (assign to all or specific user)
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

// Delete a playlist by playlistId
router.post('/admin/playlists/delete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) {
      return res.status(400).send('Playlist ID is required');
    }

    // Delete playlists with this playlistId (you may have duplicates, so delete all)
    await Playlist.deleteMany({ playlistId });

    res.redirect('/admin/playlists');
  } catch (err) {
    console.error("Error deleting playlist:", err);
    res.status(500).send("Error deleting playlist");
  }
});


module.exports = router;
