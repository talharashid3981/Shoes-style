import mongoose from 'mongoose';

// ✅ Atomic counter model for generating sequential order IDs
// Uses MongoDB's findOneAndUpdate + $inc which is guaranteed atomic
// — no race conditions, no duplicates, unlike timestamp+random approach

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);