const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST /api/applications/apply (Seeker only)
router.post('/apply', verifyToken, checkRole(['seeker']), upload.single('certificate'), async (req, res) => {
  try {
    const { jobId } = req.body;

    // 1. Check if the seeker has a saved profile (at least name + mobile)
    const user = await User.findById(req.userId);
    if (!user || !user.name || !user.mobile) {
      return res.status(400).json({
        message: 'Please complete your profile (name & mobile required) before applying.'
      });
    }

    // 2. Check if job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // 3. Prevent duplicate applications
    const existing = await Application.findOne({ jobId, seekerId: req.userId });
    if (existing) return res.status(400).json({ message: 'You have already applied for this job' });

    // 4. Create application
    const newApp = new Application({
      jobId,
      seekerId: req.userId,
      certificates: req.file ? req.file.path : null,
      status: 'applied'
    });

    await newApp.save();
    res.status(201).json({ message: 'Application submitted successfully', application: newApp });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/applications (role-based)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.userRole === 'recruiter') {
      // Get all jobs posted by this recruiter
      const recruiterJobs = await Job.find({ recruiterId: req.userId }).select('_id');
      const jobIds = recruiterJobs.map(j => j._id);

      // Get applications for those jobs with FULL seeker profile
      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('jobId', 'title company location salary')
        .populate('seekerId', 'name email mobile skills experience workStatus bio location photo certifications')
        .sort({ createdAt: -1 });

      res.status(200).json(applications);
    } else {
      // Seeker — their own applications
      const applications = await Application.find({ seekerId: req.userId })
        .populate('jobId', 'title company location salary')
        .sort({ createdAt: -1 });

      res.status(200).json(applications);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/applications/job/:jobId — recruiter views applicants for a specific job
router.get('/job/:jobId', verifyToken, checkRole(['recruiter']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Verify recruiter owns this job
    if (String(job.recruiterId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('seekerId', 'name email mobile skills experience workStatus bio location photo certifications')
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/applications/:id/status — recruiter updates application status
router.put('/:id/status', verifyToken, checkRole(['recruiter']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['applied', 'reviewed', 'rejected', 'accepted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter owns the job
    if (String(application.jobId.recruiterId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    res.json({ message: `Application ${status}`, application });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
