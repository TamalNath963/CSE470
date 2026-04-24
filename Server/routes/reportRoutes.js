const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Faculty = require('../models/Faculty');

// GET /api/reports/summary
// Auto-generates report for all faculty from their reviews — no manual generation needed
router.get('/summary', async (req, res) => {
  try {
    const { facultyId, semester } = req.query;

    // Build match filter
    const match = { status: 'Approved' };
    if (facultyId) match.faculty = require('mongoose').Types.ObjectId.createFromHexString(facultyId);
    if (semester) match.semester = { $regex: semester, $options: 'i' };

    // Aggregate reviews grouped by faculty
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$faculty',
          avgRating: { $avg: '$rating' },
          avgTeaching: { $avg: '$teachingQuality' },
          avgKnowledge: { $avg: '$subjectKnowledge' },
          avgCommunication: { $avg: '$communication' },
          avgAvailability: { $avg: '$availability' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' },
          semesters: { $addToSet: '$semester' },
        }
      },
      {
        $lookup: {
          from: 'faculties',
          localField: '_id',
          foreignField: '_id',
          as: 'faculty'
        }
      },
      { $unwind: '$faculty' },
      { $sort: { avgRating: -1 } }
    ];

    const results = await Review.aggregate(pipeline);

    // Format and add performance grade
    const data = results.map(r => {
      const avg = parseFloat(r.avgRating.toFixed(1));
      let grade = '';
      if (avg >= 4.5) grade = 'Excellent';
      else if (avg >= 3.5) grade = 'Good';
      else if (avg >= 2.5) grade = 'Satisfactory';
      else grade = 'Needs Improvement';

      // Rating distribution
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      r.ratings.forEach(rating => { dist[rating] = (dist[rating] || 0) + 1; });

      return {
        facultyId: r._id,
        facultyName: r.faculty.name,
        department: r.faculty.department,
        designation: r.faculty.designation || '',
        profilePhoto: r.faculty.profilePhoto || '',
        status: r.faculty.status,
        avgRating: avg,
        avgTeaching: r.avgTeaching ? parseFloat(r.avgTeaching.toFixed(1)) : null,
        avgKnowledge: r.avgKnowledge ? parseFloat(r.avgKnowledge.toFixed(1)) : null,
        avgCommunication: r.avgCommunication ? parseFloat(r.avgCommunication.toFixed(1)) : null,
        avgAvailability: r.avgAvailability ? parseFloat(r.avgAvailability.toFixed(1)) : null,
        totalReviews: r.totalReviews,
        grade,
        distribution: dist,
        semesters: r.semesters.filter(Boolean),
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('Report summary error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/faculty/:facultyId — Detailed report for one faculty
router.get('/faculty/:facultyId', async (req, res) => {
  try {
    const { semester } = req.query;
    const mongoose = require('mongoose');
    const fid = new mongoose.Types.ObjectId(req.params.facultyId);

    const match = { faculty: fid, status: 'Approved' };
    if (semester) match.semester = { $regex: semester, $options: 'i' };

    const [faculty, reviews, aggResult] = await Promise.all([
      Faculty.findById(fid),
      Review.find(match).sort({ createdAt: -1 }),
      Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgTeaching: { $avg: '$teachingQuality' },
            avgKnowledge: { $avg: '$subjectKnowledge' },
            avgCommunication: { $avg: '$communication' },
            avgAvailability: { $avg: '$availability' },
            totalReviews: { $sum: 1 },
            ratings: { $push: '$rating' },
          }
        }
      ])
    ]);

    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });

    const agg = aggResult[0];
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (agg) agg.ratings.forEach(r => { dist[r] = (dist[r] || 0) + 1; });

    // Semester-wise breakdown
    const semesterMap = {};
    reviews.forEach(r => {
      const sem = r.semester || 'Unspecified';
      if (!semesterMap[sem]) semesterMap[sem] = { count: 0, total: 0 };
      semesterMap[sem].count++;
      semesterMap[sem].total += r.rating;
    });
    const semesterComparison = Object.entries(semesterMap).map(([sem, val]) => ({
      semester: sem,
      count: val.count,
      avgRating: parseFloat((val.total / val.count).toFixed(1)),
    }));

    res.json({
      success: true,
      data: {
        faculty: {
          id: faculty._id,
          name: faculty.name,
          department: faculty.department,
          designation: faculty.designation,
          qualification: faculty.qualification,
          experience: faculty.experience,
          profilePhoto: faculty.profilePhoto,
          status: faculty.status,
        },
        stats: agg ? {
          avgRating: parseFloat(agg.avgRating.toFixed(1)),
          avgTeaching: agg.avgTeaching ? parseFloat(agg.avgTeaching.toFixed(1)) : null,
          avgKnowledge: agg.avgKnowledge ? parseFloat(agg.avgKnowledge.toFixed(1)) : null,
          avgCommunication: agg.avgCommunication ? parseFloat(agg.avgCommunication.toFixed(1)) : null,
          avgAvailability: agg.avgAvailability ? parseFloat(agg.avgAvailability.toFixed(1)) : null,
          totalReviews: agg.totalReviews,
          distribution: dist,
        } : null,
        semesterComparison,
        reviews,
      }
    });
  } catch (err) {
    console.error('Faculty report error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/top-faculty — Top rated faculty
router.get('/top-faculty', async (req, res) => {
  try {
    const results = await Review.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: '$faculty', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'faculties', localField: '_id', foreignField: '_id', as: 'faculty' } },
      { $unwind: '$faculty' },
      { $project: { _id: 0, facultyId: '$_id', name: '$faculty.name', department: '$faculty.department', designation: '$faculty.designation', profilePhoto: '$faculty.profilePhoto', avgRating: 1, totalReviews: 1 } }
    ]);
    res.json({ success: true, data: results.map(r => ({ ...r, avgRating: parseFloat(r.avgRating.toFixed(1)) })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;