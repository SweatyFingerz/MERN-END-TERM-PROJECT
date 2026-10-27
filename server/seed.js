// Demo data for screenshots / the demo video:  npm run seed
// Only replaces the @demo.com accounts and their doubts. Real accounts are left alone.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Question = require('./models/Question');

const USERS = { asha: 'Asha Patil', ravi: 'Ravi Kulkarni', meera: 'Meera Joshi', kabir: 'Kabir Shaikh', sneha: 'Sneha Naik' };

const DATA = [
  { by: 'asha', hrs: 2, tags: ['react', 'hooks'], title: 'Why does useEffect run twice in development?',
    body: 'My useEffect logs twice on mount. Is something wrong with my component, or is this expected behaviour?',
    answers: [
      { by: 'ravi', up: ['meera', 'kabir', 'sneha'], accepted: true, body: 'That is React 18 StrictMode. In development it mounts, unmounts and re-mounts every component once to surface missing cleanups. It does not happen in a production build.' },
      { by: 'kabir', up: ['asha'], body: 'You can remove <StrictMode> in main.jsx to stop it, but it is better to fix the effect so it cleans up after itself.' },
    ] },
  { by: 'ravi', hrs: 5, tags: ['mongodb', 'mongoose'], title: 'How do I populate a field inside an array of subdocuments?',
    body: 'My question has an answers array and each answer has an author reference. How do I populate all the authors in one query?',
    answers: [{ by: 'meera', up: ['ravi', 'asha'], accepted: true, body: 'Use dot notation: Question.find().populate("answers.author", "name"). Mongoose will populate the reference inside every array element.' }] },
  { by: 'meera', hrs: 9, tags: ['auth', 'node', 'security'], title: 'JWT in localStorage or an httpOnly cookie?',
    body: 'For a MERN app, where should I keep the JWT, and what are the trade-offs against XSS and CSRF?',
    answers: [
      { by: 'asha', up: ['ravi', 'kabir'], body: 'httpOnly cookies cannot be read by JavaScript, so an XSS bug cannot steal the token, but you then need CSRF protection. localStorage is simpler but exposed to XSS. For a college project, localStorage is fine as long as you sanitise input.' },
    ] },
  { by: 'kabir', hrs: 14, tags: ['express', 'cors'], title: 'CORS error only after deploying frontend to Vercel',
    body: 'Everything works on localhost, but the deployed site says the request was blocked by CORS policy. What am I missing?',
    answers: [{ by: 'sneha', up: ['kabir', 'ravi', 'meera'], accepted: true, body: 'Your backend CORS origin must match the exact Vercel URL, with no trailing slash. Set CLIENT_URL in the server environment variables and redeploy the server.' }] },
  { by: 'sneha', hrs: 20, tags: ['javascript', 'async'], title: 'What is the difference between Promise.all and Promise.allSettled?',
    body: 'I fetch three APIs together. When one fails, everything fails. How do I get the results of the ones that worked?',
    answers: [{ by: 'ravi', up: ['sneha', 'asha'], accepted: true, body: 'Promise.all rejects as soon as any promise rejects. Promise.allSettled waits for all of them and gives you { status, value or reason } for each, so you can keep the successful ones.' }] },
  { by: 'asha', hrs: 27, tags: ['react', 'state'], title: 'State does not update immediately after setState. Why?',
    body: 'I call setCount(count + 1) and then console.log(count), but it prints the old value.',
    answers: [{ by: 'kabir', up: ['asha', 'meera'], body: 'State updates are scheduled, not immediate. The new value is available on the next render. Use a useEffect that depends on count, or compute the next value in a variable first.' }] },
  { by: 'meera', hrs: 33, tags: ['mongodb', 'design'], title: 'Embed answers inside the question or keep a separate collection?',
    body: 'Which schema is better for a Q&A app: answers embedded in the question document or in their own collection?', answers: [] },
  { by: 'ravi', hrs: 41, tags: ['git', 'github'], title: 'I accidentally committed my .env file. What now?',
    body: 'I pushed a .env with my database password to a public repo. Is deleting the file in a new commit enough?',
    answers: [{ by: 'asha', up: ['ravi', 'sneha', 'kabir'], accepted: true, body: 'No. The secret is still in the git history. Rotate the password immediately, then remove the file with git rm --cached and add .env to .gitignore.' }] },
  { by: 'kabir', hrs: 50, tags: ['css', 'layout'], title: 'Flexbox or Grid for a page layout?',
    body: 'I keep mixing them up. When should I pick Grid over Flexbox?', answers: [] },
  { by: 'sneha', hrs: 60, tags: ['node', 'deployment'], title: 'Render free tier takes a minute to respond. Can I avoid it?',
    body: 'My API on Render is slow on the first request after some idle time. Is there a way to keep it awake?',
    answers: [{ by: 'meera', up: ['sneha'], body: 'The free tier sleeps after idle time. A free uptime monitor that pings your /api/health route every 5 minutes keeps it awake.' }] },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const old = await User.find({ email: /@demo\.com$/ }).select('_id');
  const ids = old.map((u) => u._id);
  await Question.deleteMany({ author: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });

  const pw = await bcrypt.hash('demo123', 10);
  const u = {};
  for (const [k, name] of Object.entries(USERS)) u[k] = await User.create({ name, email: `${k}@demo.com`, password: pw });

  const rep = {};
  for (const d of DATA) {
    const q = await Question.create({
      author: u[d.by]._id, title: d.title, body: d.body, tags: d.tags,
      createdAt: new Date(Date.now() - d.hrs * 36e5),
      answers: d.answers.map((a) => ({
        author: u[a.by]._id, body: a.body,
        votes: (a.up || []).map((k) => ({ user: u[k]._id, value: 1 })),
      })),
    });
    const accIdx = d.answers.findIndex((a) => a.accepted);
    if (accIdx > -1) { q.acceptedAnswer = q.answers[accIdx]._id; await q.save(); }
    d.answers.forEach((a) => { rep[a.by] = (rep[a.by] || 0) + (a.up || []).length * 5 + (a.accepted && a.by !== d.by ? 15 : 0); });
  }
  for (const [k, n] of Object.entries(rep)) await User.updateOne({ _id: u[k]._id }, { $inc: { reputation: n } });

  console.log(`Seeded ${DATA.length} doubts. Log in with asha@demo.com / demo123 (same password for ravi, meera, kabir, sneha).`);
  process.exit(0);
})();