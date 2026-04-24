const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  // Basic Profile
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  subjectsTaught: {
    type: [String],
    default: [],
  },

  // Professional Details
  qualification: {
    type: String,
    trim: true,
    default: '',
  },
  experience: {
    type: Number, // in years
    default: 0,
  },
  designation: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },

  // Profile Photo
  profilePhoto: {
    type: String, // filename/path
    default: '',
  },

  // Status
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Retired'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Faculty', facultySchema);