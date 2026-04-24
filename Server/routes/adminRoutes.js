const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const Review = require('../models/Review');

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalFaculty, totalReviews, pendingReviews, activeFaculty] = await Promise.all([
      Faculty.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ status: 'Pending' }),
      Faculty.countDocuments({ status: 'Active' }),
    ]);

    const ratingAgg = await Review.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const deptStats = await Faculty.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusStats = await Faculty.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const reviewTrend = await Review.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalFaculty,
        totalReviews,
        pendingReviews,
        activeFaculty,
        avgRating: ratingAgg[0]?.avgRating?.toFixed(1) || 0,
        approvedReviews: ratingAgg[0]?.count || 0,
        deptStats,
        statusStats,
        reviewTrend,
      }
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/activity
router.get('/activity', async (req, res) => {
  try {
    const [recentReviews, recentFaculty] = await Promise.all([
      Review.find().populate('faculty', 'name').sort({ createdAt: -1 }).limit(10),
      Faculty.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const activity = [
      ...recentReviews.map(r => ({
        type: 'Review',
        action: `Review submitted for ${r.faculty?.name || 'Unknown Faculty'}`,
        status: r.status,
        time: r.createdAt,
      })),
      ...recentFaculty.map(f => ({
        type: 'Faculty',
        action: `Faculty profile created: ${f.name}`,
        status: f.status,
        time: f.createdAt,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

    res.json({ success: true, data: activity });
  } catch (err) {
    console.error('Activity error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/top-faculty
router.get('/top-faculty', async (req, res) => {
  try {
    const topFaculty = await Review.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$faculty', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'faculties', localField: '_id', foreignField: '_id', as: 'faculty' } },
      { $unwind: '$faculty' },
      {
        $project: {
          _id: 0,
          facultyId: '$_id',
          name: '$faculty.name',
          department: '$faculty.department',
          designation: '$faculty.designation',
          profilePhoto: '$faculty.profilePhoto',
          avgRating: 1,
          totalReviews: 1,
        }
      }
    ]);
    res.json({ success: true, data: topFaculty.map(f => ({ ...f, avgRating: parseFloat(f.avgRating.toFixed(1)) })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// System settings (in-memory, no DB needed)
let systemSettings = {
  siteName: 'FacultyHub',
  allowAnonymousReviews: true,
  autoApproveReviews: false,
  maxReviewsPerStudent: 3,
  maintenanceMode: false,
  emailNotifications: true,
  reviewVisibility: 'Approved Only',
  academicYear: '2024-2025',
};

router.get('/settings', (req, res) => {
  res.json({ success: true, data: systemSettings });
});

router.put('/settings', (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ success: true, message: 'Settings saved.', data: systemSettings });
});

module.exports = router;