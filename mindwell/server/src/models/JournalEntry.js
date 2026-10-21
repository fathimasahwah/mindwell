import mongoose from 'mongoose';

const journalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // AES-256-GCM ciphertext ("iv.tag.ciphertext"). Never plain text.
    title: { type: String, required: true },
    content: { type: String, required: true },
    // The writing prompt is a public, generic string, so it is stored as-is.
    prompt: { type: String, default: '' },
  },
  { timestamps: true }
);

journalEntrySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('JournalEntry', journalEntrySchema);
