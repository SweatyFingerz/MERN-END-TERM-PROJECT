const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const { wrap, auth } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, reputation: u.reputation });
const err = (res, code, message) => res.status(code).json({ message });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return err(res, 400, 'Name, email and password are required');
  if (!EMAIL.test(email)) return err(res, 400, 'Enter a valid email address');
  if (password.length < 6) return err(res, 400, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) return err(res, 409, 'An account with this email already exists');
  const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: String(email).toLowerCase() }));
  if (!user || !(await bcrypt.compare(String(password || ''), user.password))) return err(res, 401, 'Incorrect email or password');
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', auth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return err(res, 401, 'Account not found');
  res.json({ user: pub(user) });
}));

router.get('/users/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return err(res, 404, 'User not found');
  const user = await User.findById(req.params.id).select('name reputation createdAt');
  if (!user) return err(res, 404, 'User not found');
  const [questions, answeredCount] = await Promise.all([
    Question.find({ author: user._id }).sort({ createdAt: -1 }).limit(20).select('title createdAt acceptedAnswer answers').lean(),
    Question.countDocuments({ 'answers.author': user._id }),
  ]);
  res.json({
    user,
    answeredCount,
    questions: questions.map(({ answers, ...q }) => ({ ...q, answerCount: answers.length })),
  });
}));

module.exports = router;
