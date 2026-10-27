// Optional demo data for screenshots / the demo video:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Question = require('./models/Question');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Question.deleteMany({})]);
  const pw = await bcrypt.hash('demo123', 10);
  const [asha, ravi] = await User.create([
    { name: 'Asha', email: 'asha@demo.com', password: pw },
    { name: 'Ravi', email: 'ravi@demo.com', password: pw },
  ]);
  await Question.create([
    { author: asha._id, title: 'Why does useEffect run twice in development?', tags: ['react', 'hooks'],
      body: 'My useEffect logs twice on mount. Is something wrong with my component or is this expected behaviour?',
      answers: [{ author: ravi._id, body: 'It is React 18 StrictMode. In development it mounts, unmounts and re-mounts to surface missing cleanups. It does not happen in production.' }] },
    { author: ravi._id, title: 'How do I populate a nested field in Mongoose?', tags: ['mongodb', 'mongoose'],
      body: 'I have an answers array containing author references and want to populate them in one query. What is the syntax?' },
    { author: asha._id, title: 'JWT in localStorage or an httpOnly cookie?', tags: ['auth', 'node'],
      body: 'For a MERN app, which is the better place to keep the JWT, and what are the trade-offs against XSS and CSRF?' },
  ]);
  console.log('Seeded. Log in with asha@demo.com / demo123 or ravi@demo.com / demo123');
  process.exit(0);
})();
