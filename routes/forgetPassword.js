const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "haiderkamran8603@gmail.com",
    pass: "ttyt hrfe yfam vdzv"
  }
});

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account with that email exists' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; 

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    const resetUrl = `http://localhost:4000/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `You are receiving this because you requested a password reset.\n\n
        Please click on the following link to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Password reset link sent to your email' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error processing password reset' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Token and new password are required' 
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Password reset token is invalid or has expired' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ 
      message: 'Password has been successfully reset' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});


module.exports = router;