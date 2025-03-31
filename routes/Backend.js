const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// User Model (from your existing code)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  firstName: String,
  lastName: String,
  role: {
    type: String,
    enum: ['user', 'driver', 'admin'],
    default: 'user'
  },
  phone: String,
}, { timestamps: true });

// Driver Profile Model
const driverProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['mini_truck', 'pickup_truck', 'container_truck', 'lorry', 'trailer']
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  }
}, { timestamps: true });

// Create geospatial index
driverProfileSchema.index({ location: '2dsphere' });

// Add methods to User schema
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) {
    throw new Error('Missing password for comparison');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const User = mongoose.model('User', userSchema);
const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = new User({ email, password, firstName, lastName, phone, role });
    await user.save();

    const token = user.generateAuthToken();
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.generateAuthToken();
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Driver Routes
app.post('/api/drivers/register', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ success: false, message: 'Only drivers can register profiles' });
    }

    const { vehicleType, vehicleNumber, licenseNumber, longitude, latitude } = req.body;
    
    const existingProfile = await DriverProfile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ success: false, message: 'Profile already exists' });
    }

    const driverProfile = new DriverProfile({
      user: req.user.id,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    await driverProfile.save();
    res.status(201).json({ success: true, driverProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/drivers/location', authenticate, async (req, res) => {
  try {
    const { longitude, latitude, isAvailable } = req.body;
    
    const driverProfile = await DriverProfile.findOneAndUpdate(
      { user: req.user.id },
      { 
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        isAvailable
      },
      { new: true }
    );

    if (!driverProfile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    res.json({ success: true, driverProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/drivers/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 10000 } = req.query; // radius in meters
    
    if (!longitude || !latitude) {
      return res.status(400).json({ 
        success: false,
        message: 'Longitude and latitude are required' 
      });
    }

    const drivers = await DriverProfile.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isAvailable: true
    }).populate('user', 'firstName lastName phone');

    res.json({ 
      success: true,
      drivers 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;