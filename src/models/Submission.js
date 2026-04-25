// Mongoose schema for student file submissions awaiting admin review or conversion to papers.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const submissionHintSchema = new Schema(
  {
    course: { type: String },
    branch: { type: String },
    semester: { type: Number },
    year: { type: Number },
    subject: { type: String },
  },
  { _id: false },
);

const submissionSchema = new Schema(
  {
    uploaderUserId: { type: String, required: true, index: true },
    uploaderEmail: { type: String },
    hint: submissionHintSchema,
    fileUrl: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'rejected', 'converted'],
      default: 'pending',
      index: true,
    },
    rejectReason: { type: String },
    adminNotes: { type: String },
    convertedPaperId: { type: Schema.Types.ObjectId, ref: 'Paper' },
  },
  { timestamps: true },
);

export default mongoose.models.Submission ?? mongoose.model('Submission', submissionSchema);
