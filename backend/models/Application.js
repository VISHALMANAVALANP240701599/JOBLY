const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificates: { type: String }, // Optional path to uploaded document/resume
  status: { type: String, default: 'applied', enum: ['applied', 'reviewed', 'rejected', 'accepted'] }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
