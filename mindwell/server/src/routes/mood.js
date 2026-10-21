import { Router } from 'express';
import mongoose from 'mongoose';
import MoodLog from '../models/MoodLog.js';
import { protect, requirePremium } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { EMOTIONS } from '../data/prompts.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

const FREE_RANGE_DAYS = 7;
const GROUP_FORMAT = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' };

const inScore = (n) => Number.isInteger(n) && n >= 1 && n <= 10;

const toDto = (m, dek) => ({
  id: m._id,
  mood: m.mood,
  energy: m.energy,
  emotions: m.emotions,
  note: m.note ? decrypt(m.note, dek) : '',
  date: m.date,
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const mood = Number(req.body?.mood);
    const energy = Number(req.body?.energy);
    if (!inScore(mood) || !inScore(energy)) {
      return res.status(400).json({ message: 'Mood and energy must be whole numbers from 1 to 10' });
    }
    const emotions = [...new Set((req.body?.emotions || []).map(String))]
      .filter((e) => EMOTIONS.includes(e))
      .slice(0, 5);
    const note = String(req.body?.note || '').trim().slice(0, 500);

    const log = await MoodLog.create({
      user: req.user._id,
      mood,
      energy,
      emotions,
      note: note ? encrypt(note, req.dek) : '',
    });
    res.status(201).json({ log: toDto(log, req.dek) });
  })
);

router.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const logs = await MoodLog.find({ user: req.user._id }).sort({ date: -1 }).limit(10);
    res.json({ logs: logs.map((l) => toDto(l, req.dek)) });
  })
);

// Mood over time. Aggregation averages scores per day / week / month.
// Free: last 7 days, daily. Premium: up to a year, weekly or monthly.
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const range = Math.min(365, Math.max(1, parseInt(req.query.range, 10) || FREE_RANGE_DAYS));
    const group = GROUP_FORMAT[req.query.group] ? req.query.group : 'day';

    if (!req.user.isPremium && (range > FREE_RANGE_DAYS || group !== 'day')) {
      return res
        .status(403)
        .json({ message: 'Advanced analytics are a premium feature', code: 'PREMIUM_REQUIRED' });
    }

    const since = new Date(Date.now() - range * 86400000);
    const points = await MoodLog.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id), date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: GROUP_FORMAT[group], date: '$date' } },
          avgMood: { $avg: '$mood' },
          avgEnergy: { $avg: '$energy' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      range,
      group,
      points: points.map((p) => ({
        label: p._id,
        avgMood: Math.round(p.avgMood * 10) / 10,
        avgEnergy: Math.round(p.avgEnergy * 10) / 10,
        count: p.count,
      })),
    });
  })
);

// Most common emotions (premium)
router.get(
  '/emotions',
  requirePremium,
  asyncHandler(async (req, res) => {
    const range = Math.min(365, Math.max(1, parseInt(req.query.range, 10) || 30));
    const since = new Date(Date.now() - range * 86400000);
    const rows = await MoodLog.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id), date: { $gte: since } } },
      { $unwind: '$emotions' },
      { $group: { _id: '$emotions', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ range, emotions: rows.map((r) => ({ emotion: r._id, count: r.count })) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Mood log not found' });
    }
    const result = await MoodLog.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Mood log not found' });
    res.json({ ok: true });
  })
);

export default router;
