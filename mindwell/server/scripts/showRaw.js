// Privacy demo: prints what journal entries look like inside MongoDB.
// Run `npm run raw`, then screenshot the output for your documentation.
import 'dotenv/config';
import mongoose from 'mongoose';
import JournalEntry from '../src/models/JournalEntry.js';

await mongoose.connect(process.env.MONGODB_URI);
const docs = await JournalEntry.find().sort({ createdAt: -1 }).limit(3).lean();

if (!docs.length) {
  console.log('No journal entries yet. Create one in the app first.');
} else {
  console.log('Raw documents as stored in MongoDB (what a database admin would see):\n');
  console.log(JSON.stringify(docs, null, 2));
}
await mongoose.disconnect();
