const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['sedan', 'suv', 'truck', 'van', 'motorcycle']
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
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
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Create geospatial index
driverProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);