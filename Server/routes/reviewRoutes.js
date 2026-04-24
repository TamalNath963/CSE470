const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Faculty = require('../models/Faculty');

// POST /api/reviews — Submit a review
router.post('/', async (req, res) => {
  try {
    const {
      faculty, rating, reviewText, reviewerLabel,
      teachingQuality, subjectKnowledge, communication,
      availability, semester, subject
    } = req.body;

    if (!faculty || !rating || !reviewText)
      return res.status(400).json({ success: false, message: 'Faculty, rating, and review text are required.' });
    if (reviewText.length < 10)
      return res.status(400).json({ success: false, message: 'Review must be at least 10 characters.' });

    const facultyExists = await Faculty.findById(faculty);
    if (!facultyExists)
      return res.status(404).json({ success: false, message: 'Faculty not found.' });

    const review = new Review({
      faculty,
      rating: Number(rating),
      reviewText: reviewText.trim(),
      reviewerLabel: reviewerLabel?.trim() || 'Anonymous Student',
      teachingQuality: teachingQuality ? Number(teachingQuality) : null,
      subjectKnowledge: subjectKnowledge ? Number(subjectKnowledge) : null,
      communication: communication ? Number(communication) : null,
      availability: availability ? Number(availability) : null,
      semester: semester || '',
      subject: subject || '',
      status: 'Pending',
    });

    await review.save();
    res.status(201).json({
      success: true,
      message: 'Review submitted! It will be visible after admin approval.',
      data: review,
    });
  } catch (err) {
    console.error('Submit review error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/faculty/:facultyId — Get approved reviews for a faculty
router.get('/faculty/:facultyId', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { faculty: req.params.facultyId };
    filter.status = status || 'Approved';

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    const stats = await Review.getAverageRating(req.params.facultyId);

    const allApproved = await Review.find({ faculty: req.params.facultyId, status: 'Approved' });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allApproved.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.json({
      success: true,
      count: reviews.length,
      stats: stats ? {
        avgRating: parseFloat(stats.avgRating.toFixed(1)),
        avgTeaching: stats.avgTeaching ? parseFloat(stats.avgTeaching.toFixed(1)) : null,
        avgKnowledge: stats.avgKnowledge ? parseFloat(stats.avgKnowledge.toFixed(1)) : null,
        avgCommunication: stats.avgCommunication ? parseFloat(stats.avgCommunication.toFixed(1)) : null,
        avgAvailability: stats.avgAvailability ? parseFloat(stats.avgAvailability.toFixed(1)) : null,
        totalReviews: stats.totalReviews,
      } : null,
      distribution,
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/admin/all — Get all reviews (admin)
router.get('/admin/all', async (req, res) => {
  try {
    const { status, facultyId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (facultyId) filter.faculty = facultyId;
    const reviews = await Review.find(filter)
      .populate('faculty', 'name department')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/reviews/:id/status — Approve or reject
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '' },
      { new: true }
    ).populate('faculty', 'name department');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, message: `Review ${status}.`, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/stats/:facultyId — Average rating stats
router.get('/stats/:facultyId', async (req, res) => {
  try {
    const stats = await Review.getAverageRating(req.params.facultyId);
    const allApproved = await Review.find({ faculty: req.params.facultyId, status: 'Approved' });
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allApproved.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
    res.json({
      success: true,
      data: stats ? {
        avgRating: parseFloat(stats.avgRating.toFixed(1)),
        avgTeaching: stats.avgTeaching ? parseFloat(stats.avgTeaching.toFixed(1)) : null,
        avgKnowledge: stats.avgKnowledge ? parseFloat(stats.avgKnowledge.toFixed(1)) : null,
        avgCommunication: stats.avgCommunication ? parseFloat(stats.avgCommunication.toFixed(1)) : null,
        avgAvailability: stats.avgAvailability ? parseFloat(stats.avgAvailability.toFixed(1)) : null,
        totalReviews: stats.totalReviews,
        distribution,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;