const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  reputation: { type: Number, default: 0 },
}, { timestamps: true }));
