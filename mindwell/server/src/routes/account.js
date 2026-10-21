import { Router } from 'express';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import JournalEntry from '../models/JournalEntry.js';
import MoodLog from '../models/MoodLog.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { decrypt } from '../utils/crypto.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
async function collectData(req) {
  const [entries, moods] = await Promise.all([
    JournalEntry.find({ user: req.user._id }).sort({ createdAt: 1 }),
    MoodLog.find({ user: req.user._id }).sort({ date: 1 }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: { name: req.user.name, email: req.user.email, isPremium: req.user.isPremium },
    journalEntries: entries.map((e) => ({
      id: e._id,
      title: decrypt(e.title, req.dek),
      content: decrypt(e.content, req.dek),
      prompt: e.prompt,
      createdAt: e.createdAt,
    })),
    moodLogs: moods.map((m) => ({
      id: m._id,
      mood: m.mood,
      energy: m.energy,
      emotions: m.emotions,
      note: m.note ? decrypt(m.note, req.dek) : '',
      date: m.date,
    })),
  };
}

// Data freedom (GDPR): every user can download everything, free or premium.
router.get(
  '/export',
  protect,
  asyncHandler(async (req, res) => {
    const data = await collectData(req);
    const stamp = new Date().toISOString().slice(0, 10);

    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="mindwell-export-${stamp}.pdf"`);
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res);

      doc.fontSize(22).text('MindWell data export');
      doc.fontSize(10).fillColor('#666666').text(`${data.account.name} (${data.account.email})`);
      doc.text(`Exported ${new Date(data.exportedAt).toLocaleString()}`).moveDown(1.5);

      doc.fillColor('#000000').fontSize(16).text('Journal entries').moveDown(0.5);
      if (!data.journalEntries.length) doc.fontSize(11).text('No entries.');
      data.journalEntries.forEach((e) => {
        doc.fontSize(13).fillColor('#000000').text(e.title);
        doc.fontSize(9).fillColor('#666666').text(new Date(e.createdAt).toLocaleString());
        if (e.prompt) doc.text(`Prompt: ${e.prompt}`);
        doc.moveDown(0.3).fontSize(11).fillColor('#000000').text(e.content).moveDown(1);
      });

      doc.addPage().fontSize(16).fillColor('#000000').text('Mood log').moveDown(0.5);
      if (!data.moodLogs.length) doc.fontSize(11).text('No mood logs.');
      data.moodLogs.forEach((m) => {
        const line = `${new Date(m.date).toLocaleDateString()}  mood ${m.mood}/10  energy ${m.energy}/10`;
        doc.fontSize(11).text(line + (m.emotions.length ? `  [${m.emotions.join(', ')}]` : ''));
        if (m.note) doc.fontSize(10).fillColor('#555555').text(`   ${m.note}`).fillColor('#000000');
      });

      doc.end();
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="mindwell-export-${stamp}.json"`);
    res.send(JSON.stringify(data, null, 2));
  })
);

// Demo billing: flips the premium flag. Replace with Stripe Checkout + webhook in production.
router.post(
  '/billing/upgrade',
  protect,
  asyncHandler(async (req, res) => {
    req.user.isPremium = true;
    await req.user.save();
    res.json({ isPremium: true });
  })
);

router.post(
  '/billing/downgrade',
  protect,
  asyncHandler(async (req, res) => {
    req.user.isPremium = false;
    await req.user.save();
    res.json({ isPremium: false });
  })
);

// Right to erasure
router.delete(
  '/account',
  protect,
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    if (!password || !(await bcrypt.compare(password, req.user.passwordHash))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }
    await Promise.all([
      JournalEntry.deleteMany({ user: req.user._id }),
      MoodLog.deleteMany({ user: req.user._id }),
      User.deleteOne({ _id: req.user._id }),
    ]);
    res.json({ ok: true });
  })
);

export default router;
