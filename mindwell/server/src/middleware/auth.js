import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unsealKey } from '../utils/crypto.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let payload;
  let dek;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    dek = unsealKey(payload.k);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ message: 'Account not found' });

  req.user = user;
  req.dek = dek;
  next();
});

export const requirePremium = (req, res, next) => {
  if (req.user.isPremium) return next();
  return res.status(403).json({ message: 'This is a premium feature', code: 'PREMIUM_REQUIRED' });
};
