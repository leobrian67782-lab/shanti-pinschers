const mongoose = require('mongoose');

const litterSchema = new mongoose.Schema(
  {
    ledgerNo: { type: String, unique: true }, // e.g. "L-2026-03"
    title: { type: String, required: true }, // e.g. "Onyx x Bella"
    sireName: { type: String, required: true },
    damName: { type: String, required: true },
    dob: { type: Date }, // leave blank if expected, not yet born
    expectedDate: { type: Date },
    description: { type: String },
    photos: [
      {
        url: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ['expected', 'born', 'weaning', 'sold-out', 'archived'],
      default: 'expected',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Litter', litterSchema);
