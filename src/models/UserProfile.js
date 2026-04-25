// Mongoose schema for local user accounts (email/password), academic profile fields, and bookmarks.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userProfileSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: { type: String },
    course: { type: String },
    branch: { type: String },
    year: { type: Number },
    semester: { type: Number },
    bookmarkedPaperIds: [{ type: Schema.Types.ObjectId, ref: 'Paper' }],
  },
  { timestamps: true },
);

export default mongoose.models.UserProfile ?? mongoose.model('UserProfile', userProfileSchema);
