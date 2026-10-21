import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const required = ['MONGODB_URI', 'JWT_SECRET', 'SERVER_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET === process.env.SERVER_SECRET) {
  console.error('JWT_SECRET and SERVER_SECRET must be different values.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`MindWell API listening on :${PORT}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
