// Mongoose schema for manually authored answers linked to paper questions.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    answerText: { type: String, required: true },
    source: { type: String, default: 'manual' },
  },
  { timestamps: true },
);

export default mongoose.models.Answer ?? mongoose.model('Answer', answerSchema);
