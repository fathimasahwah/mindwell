import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Key material for encryption at rest (see utils/crypto.js)
    kdfSalt: { type: String, required: true },
    wrappedKey: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
