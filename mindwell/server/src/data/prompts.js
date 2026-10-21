export const PROMPTS = [
  'What made you smile today?',
  'Name three things you are grateful for right now.',
  'What is one thing you did today that you are proud of?',
  'Describe a moment today when you felt calm.',
  'Who made a positive difference in your day, and how?',
  'What is weighing on your mind, and what is one small step you could take?',
  'What would you tell a friend who felt the way you feel today?',
  'Write about a small pleasure you noticed today.',
  'What did your body need today, and did you listen?',
  'What is something you are looking forward to?',
  'Describe a challenge you handled better than you expected.',
  'What is one thing you can let go of tonight?',
  'Which people or places make you feel safe?',
  'What did you learn about yourself this week?',
  'Write a kind note to your future self.',
  'What emotion visited you most today? Where did you feel it in your body?',
  'What boundary would help you protect your energy?',
  'List five things you can see, hear, or feel right now.',
  'What is a recent memory that makes you feel warm?',
  'What would a gentle day look like for you tomorrow?',
  'What are you worried about, and what is within your control?',
  'Describe something beautiful you noticed recently.',
  'What are you grateful that you did not give up on?',
  'How did you take care of yourself today?',
  'What do you need to forgive yourself for?',
  'What conversation are you avoiding, and what might help you start it?',
  'What gave you energy today? What drained it?',
  'Write about a time you felt truly at peace.',
  'What is one thing that went right today, however small?',
  'If today had a colour, what would it be and why?',
];

export const EMOTIONS = [
  'happy',
  'calm',
  'grateful',
  'excited',
  'tired',
  'anxious',
  'sad',
  'angry',
  'stressed',
  'lonely',
];

export function promptForToday(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86400000);
  return PROMPTS[day % PROMPTS.length];
}

export function randomPrompt(exclude) {
  const pool = PROMPTS.filter((p) => p !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
