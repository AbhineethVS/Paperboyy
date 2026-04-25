// Mongoose schema for KTU-format paper questions with part/module numbering and CO metadata.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    paperId: { type: Schema.Types.ObjectId, ref: 'Paper', required: true, index: true },
    questionText: { type: String, required: true },
    part: { type: String, enum: ['A', 'B'], required: true },
    module: {
      type: Number,
      required() {
        return this.part === 'B';
      },
    },
    questionNumber: { type: Number, required: true },
    subPart: { type: String },
    order: { type: Number, required: true },
    marks: { type: Number },
    co: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Question ?? mongoose.model('Question', questionSchema);
