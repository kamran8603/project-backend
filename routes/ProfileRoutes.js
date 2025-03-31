const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Profile = require('../models/Profile');
const User = require('../models/User');


router.get('/', auth, async (req, res) => {
  try {
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    
    if (!profile) {
      const user = await User.findById(req.user.id);
      
      profile = new Profile({
        user: req.user.id,
        firstName: 'New',
        lastName: 'User',
        email: user.email,
        phone: '',
        vehicleNumber: 'TRUCK-001',
        truckType: 'semi'
      });
      
      await profile.save();
    }

    res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server Error' 
    });
  }
});


router.put('/', auth, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'vehiclePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, vehicleNumber, truckType } = req.body;

    const updateData = {
      firstName,
      lastName,
      email,
      phone,
      vehicleNumber,
      truckType
    };

    // Handle file uploads
    if (req.files?.profilePhoto) {
      updateData.profilePhoto = `/uploads/${req.files.profilePhoto[0].filename}`;
    }
    if (req.files?.vehiclePhoto) {
      updateData.vehiclePhoto = `/uploads/${req.files.vehiclePhoto[0].filename}`;
    }

    // Update profile (upsert: true creates if doesn't exist)
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      profile
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server Error' 
    });
  }
});

module.exports = router;