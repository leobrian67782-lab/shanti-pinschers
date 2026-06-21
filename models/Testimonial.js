const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    message: { type: String, required: true },
    puppyName: { type: String }, // which puppy they took home, optional
    photo: {
      url: String,
      publicId: String,
    },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
