const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  reviewText: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
  reviewerLabel: {
    type: String,
    default: 'Anonymous Student',
    trim: true,
  },
  teachingQuality: { type: Number, min: 1, max: 5, default: null },
  subjectKnowledge: { type: Number, min: 1, max: 5, default: null },
  communication: { type: Number, min: 1, max: 5, default: null },
  availability: { type: Number, min: 1, max: 5, default: null },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  adminNote: { type: String, default: '' },
  semester: { type: String, default: '' },
  subject: { type: String, default: '' },
}, { timestamps: true });

reviewSchema.statics.getAverageRating = async function (facultyId) {
  const result = await this.aggregate([
    { $match: { faculty: new mongoose.Types.ObjectId(facultyId), status: 'Approved' } },
    {
      $group: {
        _id: '$faculty',
        avgRating: { $avg: '$rating' },
        avgTeaching: { $avg: '$teachingQuality' },
        avgKnowledge: { $avg: '$subjectKnowledge' },
        avgCommunication: { $avg: '$communication' },
        avgAvailability: { $avg: '$availability' },
        totalReviews: { $sum: 1 },
      }
    }
  ]);
  return result[0] || null;
};

module.exports = mongoose.model('Review', reviewSchema);