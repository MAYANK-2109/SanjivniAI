import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

if (uri && !uri.includes('cluster.mongodb.net') /* Check if user has replaced placeholder */) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else if (uri) {
  // Connection string contains actual hostname or user replaced placeholder
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        console.warn('MongoDB connection warning:', err.message);
        return null;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((err) => {
      console.warn('MongoDB connection warning:', err.message);
      return null;
    });
  }
} else {
  clientPromise = Promise.resolve(null);
}

export default clientPromise;

export async function getDatabase() {
  try {
    const client = await clientPromise;
    if (!client) return null;
    return client.db('sanjeevani_db');
  } catch (e) {
    console.warn('MongoDB getDatabase failed:', e.message);
    return null;
  }
}
