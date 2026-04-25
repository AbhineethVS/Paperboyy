// Establishes the MongoDB connection via Mongoose using MONGODB_URI from the environment (no URI logging).
import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (typeof uri !== 'string' || !uri.trim()) {
    console.error('[db] MongoDB connection failed: MONGODB_URI is missing or empty.');
    throw new Error('MONGODB_URI is required');
  }

  try {
    await mongoose.connect(uri.trim());
    console.log('[db] MongoDB connected successfully.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[db] MongoDB connection failed:', message);
    throw err;
  }
}
