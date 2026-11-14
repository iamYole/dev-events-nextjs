import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Keep one cache on the Node.js global so Next.js development reloads reuse it.
const cached =
  globalThis.mongooseCache ??
  (globalThis.mongooseCache = { connection: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (cached.connection) {
    return cached.connection;
  }

  // Share an in-flight connection attempt across concurrent callers.
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((connection) => connection);
  }

  try {
    cached.connection = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.connection;
}

export default connectToDatabase;
