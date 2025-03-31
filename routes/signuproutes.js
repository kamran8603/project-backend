const express = require('express');
const router = express.Router();
const User = require('../models/User'); 

router.post('/', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    console.log(username, email, phone, password)

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = new User({
      username,
      email,
      phone,
      password
    });

    await user.save();

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userObject
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;