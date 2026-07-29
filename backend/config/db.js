import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') }); // Load root .env

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 5000,
};

let client;
let clientPromise;

if (uri) {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.warn('MongoDB connection warning:', err.message);
    return null;
  });
} else {
  clientPromise = Promise.resolve(null);
}

export default clientPromise;

export async function getDatabase() {
  try {
    const connectedClient = await clientPromise;
    if (!connectedClient) return null;
    return connectedClient.db('sanjeevani_db');
  } catch (e) {
    console.warn('MongoDB getDatabase failed:', e.message);
    return null;
  }
}
