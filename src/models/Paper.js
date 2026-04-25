// Mongoose schema for archive paper metadata (filters, approval state, link back to source submission).
import mongoose from 'mongoose';

const { Schema } = mongoose;

const paperSchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    course: { type: String, index: true },
    branch: { type: String, index: true },
    semester: { type: Number, index: true },
    subject: { type: String, index: true },
    subjectName: { type: String, index: true },
    subjectCode: { type: String },
    fileUrl: { type: String },
    year: { type: Number, index: true },
    month: { type: String },
    paperType: {
      type: String,
      enum: ['endsem', 'periodic', 'model'],
    },
    sourceSubmissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
    status: {
      type: String,
      enum: ['draft', 'approved'],
      default: 'draft',
    },
  },
  { timestamps: true },
);

paperSchema.index({ course: 1, branch: 1, semester: 1, year: 1 });

export default mongoose.models.Paper ?? mongoose.model('Paper', paperSchema);
