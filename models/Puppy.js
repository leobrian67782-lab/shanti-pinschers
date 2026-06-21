const mongoose = require('mongoose');

const puppySchema = new mongoose.Schema(
  {
    ledgerNo: { type: String, unique: true }, // e.g. "No. 014" - the signature pedigree-card element
    name: { type: String, required: true },
    sex: { type: String, enum: ['Male', 'Female'], required: true },
    color: {
      type: String,
      enum: ['Red', 'Black & Rust', 'Chocolate & Rust', 'Black & Tan', 'Fawn'],
      required: true,
    },
    dob: { type: Date, required: true },
    sireName: { type: String },
    damName: { type: String },
    litter: { type: mongoose.Schema.Types.ObjectId, ref: 'Litter' },
    price: { type: Number },
    priceNote: { type: String, default: '' }, // e.g. "Deposit secures puppy"
    description: { type: String },
    photos: [
      {
        url: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available',
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Puppy', puppySchema);
