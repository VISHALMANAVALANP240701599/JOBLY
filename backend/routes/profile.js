const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { verifyToken } = require('../middlewares/authMiddleware');

// GET /api/profile — fetch logged-in user's profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/profile — update profile
router.put('/', verifyToken, async (req, res) => {
  try {
    const {
      name, mobile, dob, workStatus, experience,
      bio, skills, location, linkedin, portfolio,
      photo, certifications
    } = req.body;

    const updates = {};
    if (name          !== undefined) updates.name          = name;
    if (mobile        !== undefined) updates.mobile        = mobile;
    if (dob           !== undefined) updates.dob           = dob;
    if (workStatus    !== undefined) updates.workStatus    = workStatus;
    if (experience    !== undefined) updates.experience    = experience;
    if (bio           !== undefined) updates.bio           = bio;
    if (skills        !== undefined) updates.skills        = skills;
    if (location      !== undefined) updates.location      = location;
    if (linkedin      !== undefined) updates.linkedin      = linkedin;
    if (portfolio     !== undefined) updates.portfolio     = portfolio;
    if (photo         !== undefined) updates.photo         = photo;
    if (certifications !== undefined) updates.certifications = certifications;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/profile/:id — recruiter views a seeker's profile
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
