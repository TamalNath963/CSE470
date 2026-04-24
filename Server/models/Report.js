const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  reportType: { type: String, enum: ['Semester', 'Annual', 'Custom'], required: true },
  semester: { type: String, default: '' },
  year: { type: Number, required: true },
  period: { type: String, default: '' },

  // Performance Metrics
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  avgTeaching: { type: Number, default: 0 },
  avgKnowledge: { type: Number, default: 0 },
  avgCommunication: { type: Number, default: 0 },
  avgAvailability: { type: Number, default: 0 },
  coursesHandled: { type: Number, default: 0 },
  totalStudents: { type: Number, default: 0 },

  // Ratings breakdown
  ratingDistribution: { type: Object, default: {1:0,2:0,3:0,4:0,5:0} },

  // Admin comments
  adminRemarks: { type: String, default: '' },
  performanceGrade: { type: String, enum: ['Excellent','Good','Satisfactory','Needs Improvement',''], default: '' },

  generatedBy: { type: String, default: 'System' },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);