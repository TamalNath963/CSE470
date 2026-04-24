const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Helper to parse subjects — handles both string and array
const parseSubjects = (s) => {
  if (!s) return [];
  if (Array.isArray(s)) return s.map(x => x.trim()).filter(Boolean);
  if (typeof s === 'string') return s.split(',').map(x => x.trim()).filter(Boolean);
  return [];
};

// POST /api/faculty — Create Faculty Profile
router.post('/', async (req, res) => {
  try {
    const { name, email, department, subjectsTaught, qualification, experience, designation, phone, status } = req.body;
    if (!name || !email || !department)
      return res.status(400).json({ success: false, message: 'Name, email and department are required.' });

    const existing = await Faculty.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(400).json({ success: false, message: 'A faculty profile with this email already exists.' });

    const faculty = new Faculty({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      subjectsTaught: parseSubjects(subjectsTaught),
      qualification: qualification || '',
      experience: experience ? Number(experience) : 0,
      designation: designation || '',
      phone: phone || '',
      status: status || 'Active',
    });

    await faculty.save();
    res.status(201).json({ success: true, message: 'Faculty profile created successfully.', data: faculty });
  } catch (err) {
    console.error('Create faculty error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/faculty — List/Search Faculty
router.get('/', async (req, res) => {
  try {
    const { department, subject, status, search } = req.query;
    const filter = {};
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (subject) filter.subjectsTaught = { $elemMatch: { $regex: subject, $options: 'i' } };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { subjectsTaught: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }
    const faculties = await Faculty.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: faculties.length, data: faculties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/faculty/:id — Get Single Faculty
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/faculty/:id — Update Faculty Profile
router.put('/:id', async (req, res) => {
  try {
    const { name, email, department, subjectsTaught, qualification, experience, designation, phone, status } = req.body;
    const updateData = {
      name, email, department, qualification,
      experience: experience ? Number(experience) : 0,
      designation, phone, status,
      subjectsTaught: parseSubjects(subjectsTaught),
    };
    // Remove undefined fields
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.json({ success: true, message: 'Faculty profile updated successfully.', data: faculty });
  } catch (err) {
    console.error('Update faculty error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/faculty/:id/photo — Upload Profile Photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });

    // Delete old photo if exists
    if (faculty.profilePhoto) {
      const oldPath = path.join(__dirname, '../uploads', faculty.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    faculty.profilePhoto = req.file.filename;
    await faculty.save();
    res.json({
      success: true, message: 'Photo uploaded successfully.',
      photoUrl: `/uploads/${req.file.filename}`, data: faculty,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/faculty/:id/status — Update Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'On Leave', 'Retired'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    res.json({ success: true, message: `Status updated to "${status}".`, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/faculty/:id — Delete Faculty
router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    if (faculty.profilePhoto) {
      const photoPath = path.join(__dirname, '../uploads', faculty.profilePhoto);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    res.json({ success: true, message: 'Faculty deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;