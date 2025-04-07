const mongoose = require('mongoose');

const ReverseImageSchema = new mongoose.Schema({
  inputImage: { type: String, required: true },
  outputImages: [String],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReverseImage', ReverseImageSchema);
