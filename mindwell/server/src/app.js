import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import moodRoutes from './routes/mood.js';
import accountRoutes from './routes/account.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

const origins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }),
  authRoutes
);
app.use('/api/journal', journalRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api', accountRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
