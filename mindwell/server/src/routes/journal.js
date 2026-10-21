import { Router } from 'express';
import mongoose from 'mongoose';
import JournalEntry from '../models/JournalEntry.js';
import { protect } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { promptForToday, randomPrompt } from '../data/prompts.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

const FREE_SEARCH_DAYS = 30;
const MAX_CONTENT = 20000;

const toDto = (e, dek) => ({
  id: e._id,
  title: decrypt(e.title, dek),
  content: decrypt(e.content, dek),
  prompt: e.prompt,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ message: 'Entry not found' });

// Daily guided prompt (?shuffle=1&current=... returns a different random one)
router.get('/prompt/today', (req, res) => {
  const prompt = req.query.shuffle ? randomPrompt(req.query.current) : promptForToday();
  res.json({ prompt });
});

// List + search. Encrypted text can't be searched by MongoDB, so matching entries
// are decrypted in memory for this user only. Free users search the last 30 days.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = { user: req.user._id };

    if (q) {
      const limited = !req.user.isPremium;
      if (limited) filter.createdAt = { $gte: new Date(Date.now() - FREE_SEARCH_DAYS * 86400000) };
      const docs = await JournalEntry.find(filter).sort({ createdAt: -1 });
      const matches = docs
        .map((d) => toDto(d, req.dek))
        .filter((d) => `${d.title} ${d.content}`.toLowerCase().includes(q));
      return res.json({
        entries: matches.slice((page - 1) * limit, page * limit),
        total: matches.length,
        page,
        limited,
      });
    }

    const [docs, total] = await Promise.all([
      JournalEntry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      JournalEntry.countDocuments(filter),
    ]);
    res.json({ entries: docs.map((d) => toDto(d, req.dek)), total, page, limited: false });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, content, prompt } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Write something first' });
    }
    if (String(content).length > MAX_CONTENT) {
      return res.status(400).json({ message: 'Entry is too long' });
    }
    const entry = await JournalEntry.create({
      user: req.user._id,
      title: encrypt(String(title || '').trim().slice(0, 120) || 'Untitled', req.dek),
      content: encrypt(content, req.dek),
      prompt: String(prompt || '').slice(0, 200),
    });
    res.status(201).json({ entry: toDto(entry, req.dek) });
  })
);

router.get(
  '/:id',
  validId,
  asyncHandler(async (req, res) => {
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ entry: toDto(entry, req.dek) });
  })
);

router.put(
  '/:id',
  validId,
  asyncHandler(async (req, res) => {
    const { title, content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Write something first' });
    }
    if (String(content).length > MAX_CONTENT) {
      return res.status(400).json({ message: 'Entry is too long' });
    }
    const entry = await JournalEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    entry.title = encrypt(String(title || '').trim().slice(0, 120) || 'Untitled', req.dek);
    entry.content = encrypt(content, req.dek);
    await entry.save();
    res.json({ entry: toDto(entry, req.dek) });
  })
);

router.delete(
  '/:id',
  validId,
  asyncHandler(async (req, res) => {
    const result = await JournalEntry.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: 'Entry not found' });
    res.json({ ok: true });
  })
);

export default router;
