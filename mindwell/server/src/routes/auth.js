import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { encrypt, decrypt, deriveKey, randomKey, sealKey } from '../utils/crypto.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  isPremium: u.isPremium,
});

const issueToken = (user, dek) =>
  jwt.sign({ sub: user._id.toString(), k: sealKey(dek) }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email' });
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (await User.exists({ email: String(email).toLowerCase() })) {
      return res.status(409).json({ message: 'That email is already registered' });
    }

    // Create the per-user data key and wrap it with a key derived from the password.
    const salt = crypto.randomBytes(16);
    const dek = randomKey();
    const kek = await deriveKey(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      kdfSalt: salt.toString('base64'),
      wrappedKey: encrypt(dek.toString('base64'), kek),
    });

    res.status(201).json({ token: issueToken(user, dek), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Unwrap the data key with the password-derived key.
    const kek = await deriveKey(password, Buffer.from(user.kdfSalt, 'base64'));
    const dek = Buffer.from(decrypt(user.wrappedKey, kek), 'base64');

    res.json({ token: issueToken(user, dek), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
