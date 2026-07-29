import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { specialization, tags } = await request.json();

    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    let query = {};
    if (specialization) {
      // Create a flexible regex search for specialization
      const specParts = specialization.split('/').map(s => s.trim());
      const orConditions = specParts.map(s => ({
        specialization: { $regex: s, $options: 'i' }
      }));
      if (tags && tags.length > 0) {
        orConditions.push({ tags: { $in: tags } });
      }
      query = { $or: orConditions };
    }

    const doctors = await db.collection('doctors').find(query).limit(10).toArray();

    return NextResponse.json({ success: true, doctors });
  } catch (error) {
    console.error('[doctors api]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
