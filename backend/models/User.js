const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  name:   { type: String },
  issuer: { type: String },
  year:   { type: String },
  url:    { type: String }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['seeker', 'recruiter'], required: true },
  companyName: { type: String },
  dob:         { type: String },
  mobile:      { type: String },
  workStatus:  { type: String },
  experience:  { type: Number },
  // Extended profile fields
  photo:          { type: String },   // base64 data-URL or file path
  bio:            { type: String },
  skills:         [{ type: String }],
  location:       { type: String },
  linkedin:       { type: String },
  portfolio:      { type: String },
  certifications: [certificationSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
