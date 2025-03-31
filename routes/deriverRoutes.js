const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');


router.put('/location', auth, async (req, res) => {
  try {
    const { lat, lng, isOnline } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        isOnline,
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Location update failed' });
  }
});


router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    
    const drivers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { 
            role: 'driver',
            isOnline: true 
          }
        }
      },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'user',
          as: 'profile'
        }
      },
      { $unwind: '$profile' },
      {
        $project: {
          _id: 1,
          email: 1,
          isOnline: 1,
          currentLocation: 1,
          distance: 1,
          profile: 1
        }
      }
    ]);

    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch drivers' });
  }
});

module.exports = router;