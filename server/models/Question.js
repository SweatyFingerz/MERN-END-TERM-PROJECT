const mongoose = require('mongoose');
const { Schema } = mongoose;

const answerSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  votes: [{ _id: false, user: { type: Schema.Types.ObjectId, ref: 'User' }, value: { type: Number, enum: [1, -1] } }],
}, { timestamps: true });

const questionSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  tags: [String],
  answers: [answerSchema],
  acceptedAnswer: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true });

questionSchema.index({ createdAt: -1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);
