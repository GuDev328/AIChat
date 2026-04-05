import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
  uri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

const globalCache = global._mongooseCache ?? { conn: null, promise: null, uri: null };
global._mongooseCache = globalCache;

export async function connectDB(uri: string): Promise<Mongoose> {
  if (!uri) {
    throw new Error("No MongoDB URI provided to connectDB");
  }

  if (globalCache.conn && globalCache.uri === uri) {
    return globalCache.conn;
  }

  if (globalCache.conn && globalCache.uri !== uri) {
    await mongoose.disconnect();
    globalCache.conn = null;
    globalCache.promise = null;
  }

  if (!globalCache.promise) {
    globalCache.uri = uri;
    globalCache.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    return globalCache.conn;
  } catch (err) {
    globalCache.promise = null;
    globalCache.uri = null;
    throw err;
  }
}
