import mongoose from 'mongoose';

const moodLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood: { type: Number, required: true, min: 1, max: 10 },
    energy: { type: Number, required: true, min: 1, max: 10 },
    // Numeric scores and emotion tags stay readable so MongoDB can aggregate them.
    emotions: { type: [String], default: [] },
    // Free-text note is encrypted like journal content (may be empty).
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

moodLogSchema.index({ user: 1, date: -1 });

export default mongoose.model('MoodLog', moodLogSchema);
