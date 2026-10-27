const router = require('express').Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const User = require('../models/User');
const { wrap, auth, optionalAuth } = require('../middleware/auth');

const PAGE_SIZE = 10;
const ACCEPT_REP = 15; // reputation for an accepted answer
const VOTE_REP = 5; // reputation per vote on an answer

const bad = (res, code, message) => res.status(code).json({ message });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rep = (id, n) => (n ? User.updateOne({ _id: id }, { $inc: { reputation: n } }) : null);
const valid = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : bad(res, 404, 'Question not found');
const cleanTags = (t) => [...new Set((Array.isArray(t) ? t : String(t || '').split(','))
  .map((x) => String(x).trim().toLowerCase().slice(0, 20)).filter(Boolean))].slice(0, 5);

// Convert a populated question into the API shape: scores + the viewer's own vote, accepted answer first
const shape = (doc, uid) => {
  const q = doc.toObject();
  const isAcc = (a) => String(a._id) === String(q.acceptedAnswer);
  q.answers = q.answers
    .map(({ votes, ...a }) => ({
      ...a,
      score: votes.reduce((s, v) => s + v.value, 0),
      myVote: votes.find((v) => String(v.user) === String(uid))?.value || 0,
    }))
    .sort((a, b) => isAcc(b) - isAcc(a) || b.score - a.score);
  return q;
};
const send = async (res, id, uid, status = 200) => {
  const q = await Question.findById(id).populate('author', 'name reputation').populate('answers.author', 'name reputation');
  res.status(status).json(shape(q, uid));
};

// List with search, tag filter, unanswered filter and pagination
router.get('/', wrap(async (req, res) => {
  const { q, tag, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const filter = {};
  if (q?.trim()) { const r = new RegExp(esc(String(q).trim()), 'i'); filter.$or = [{ title: r }, { body: r }]; }
  if (tag) filter.tags = String(tag).toLowerCase();
  if (sort === 'unanswered') filter['answers.0'] = { $exists: false };
  const [total, items] = await Promise.all([
    Question.countDocuments(filter),
    Question.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE)
      .populate('author', 'name').lean(),
  ]);
  res.json({
    items: items.map(({ answers, ...x }) => ({ ...x, answerCount: answers.length })),
    page, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}));

router.get('/tags/popular', wrap(async (_req, res) => {
  const tags = await Question.aggregate([
    { $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } }, { $limit: 12 },
  ]);
  res.json(tags.map((t) => ({ tag: t._id, count: t.count })));
}));

router.get('/:id', valid, optionalAuth, wrap(async (req, res) => {
  const exists = await Question.exists({ _id: req.params.id });
  if (!exists) return bad(res, 404, 'Question not found');
  await send(res, req.params.id, req.userId);
}));

router.post('/', auth, wrap(async (req, res) => {
  const { title, body, tags } = req.body;
  if (!title?.trim() || title.trim().length < 10) return bad(res, 400, 'Title must be at least 10 characters');
  if (!body?.trim() || body.trim().length < 20) return bad(res, 400, 'Describe your doubt in at least 20 characters');
  const q = await Question.create({ author: req.userId, title, body, tags: cleanTags(tags) });
  await send(res, q._id, req.userId, 201);
}));

router.put('/:id', auth, valid, wrap(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) return bad(res, 404, 'Question not found');
  if (String(q.author) !== req.userId) return bad(res, 403, 'Only the author can edit this doubt');
  const { title, body, tags } = req.body;
  if (!title?.trim() || title.trim().length < 10) return bad(res, 400, 'Title must be at least 10 characters');
  if (!body?.trim() || body.trim().length < 20) return bad(res, 400, 'Describe your doubt in at least 20 characters');
  Object.assign(q, { title, body, tags: cleanTags(tags) });
  await q.save();
  await send(res, q._id, req.userId);
}));

router.delete('/:id', auth, valid, wrap(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) return bad(res, 404, 'Question not found');
  if (String(q.author) !== req.userId) return bad(res, 403, 'Only the author can delete this doubt');
  await q.deleteOne();
  res.json({ message: 'Doubt deleted' });
}));

router.post('/:id/answers', auth, valid, wrap(async (req, res) => {
  const body = req.body.body?.trim();
  if (!body || body.length < 5) return bad(res, 400, 'Answer must be at least 5 characters');
  const q = await Question.findById(req.params.id);
  if (!q) return bad(res, 404, 'Question not found');
  q.answers.push({ author: req.userId, body });
  await q.save();
  await send(res, q._id, req.userId, 201);
}));

router.delete('/:id/answers/:aid', auth, valid, wrap(async (req, res) => {
  const q = await Question.findById(req.params.id);
  const a = q?.answers.id(req.params.aid);
  if (!a) return bad(res, 404, 'Answer not found');
  if (String(a.author) !== req.userId) return bad(res, 403, 'Only the author can delete this answer');
  const score = a.votes.reduce((s, v) => s + v.value, 0);
  let delta = -score * VOTE_REP;
  if (String(q.acceptedAnswer) === String(a._id)) { q.acceptedAnswer = null; delta -= ACCEPT_REP; }
  const authorId = a.author;
  q.answers.pull(a._id);
  await q.save();
  await rep(authorId, delta);
  await send(res, q._id, req.userId);
}));

// One vote per user per answer; sending the same value again removes the vote
router.post('/:id/answers/:aid/vote', auth, valid, wrap(async (req, res) => {
  const value = Number(req.body.value);
  if (![1, -1].includes(value)) return bad(res, 400, 'Vote must be 1 or -1');
  const q = await Question.findById(req.params.id);
  const a = q?.answers.id(req.params.aid);
  if (!a) return bad(res, 404, 'Answer not found');
  if (String(a.author) === req.userId) return bad(res, 403, "You can't vote on your own answer");
  const i = a.votes.findIndex((v) => String(v.user) === req.userId);
  const old = i > -1 ? a.votes[i].value : 0;
  const next = old === value ? 0 : value;
  if (i > -1) a.votes.splice(i, 1);
  if (next) a.votes.push({ user: req.userId, value: next });
  await q.save();
  await rep(a.author, (next - old) * VOTE_REP);
  await send(res, q._id, req.userId);
}));

// Only the asker can mark a solution; clicking again un-marks it
router.post('/:id/answers/:aid/accept', auth, valid, wrap(async (req, res) => {
  const q = await Question.findById(req.params.id);
  const a = q?.answers.id(req.params.aid);
  if (!a) return bad(res, 404, 'Answer not found');
  if (String(q.author) !== req.userId) return bad(res, 403, 'Only the asker can mark a solution');
  const give = (ans, n) => (String(ans.author) === req.userId ? null : rep(ans.author, n)); // no rep for self-answers
  const prev = q.acceptedAnswer && q.answers.id(q.acceptedAnswer);
  if (prev) await give(prev, -ACCEPT_REP);
  if (prev && String(prev._id) === String(a._id)) q.acceptedAnswer = null;
  else { q.acceptedAnswer = a._id; await give(a, ACCEPT_REP); }
  await q.save();
  await send(res, q._id, req.userId);
}));

module.exports = router;
