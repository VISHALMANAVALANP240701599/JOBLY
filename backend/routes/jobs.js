const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// POST /api/jobs (Recruiter only)
router.post('/', verifyToken, checkRole(['recruiter']), async (req, res) => {
  try {
    const { title, description, location, salary, company, type } = req.body;
    
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      company,
      type,
      recruiterId: req.userId
    });
    
    await newJob.save();
    res.status(201).json({ message: 'Job created successfully', job: newJob });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/jobs (All users)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().populate('recruiterId', 'name email companyName').sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/jobs/:id (Single job details)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiterId', 'name email companyName');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/jobs/:id (Recruiter only)
router.put('/:id', verifyToken, checkRole(['recruiter']), async (req, res) => {
  try {
    const { title, description, location, salary, company, type } = req.body;
    
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    // Ensure the recruiter owns this job
    if (job.recruiterId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this job' });
    }
    
    job.title = title || job.title;
    job.description = description || job.description;
    job.location = location || job.location;
    job.salary = salary || job.salary;
    job.company = company || job.company;
    job.type = type || job.type;
    
    await job.save();
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/jobs/:id (Recruiter only)
router.delete('/:id', verifyToken, checkRole(['recruiter']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.recruiterId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
