/**
 * app/api/auth/register/route.js
 * Handles new account registration for all roles.
 *
 * POST /api/auth/register
 * Body: { role, email, password, ...roleFields }
 *
 * Returns: { success, profile, token }
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_PROFILES } from '@/lib/mockData';

function makeToken(profile) {
  const payload = { id: profile.id, role: profile.role, name: profile.name, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function generateId(role) {
  const prefix = role === 'ambulance' ? 'AMB' : role === 'doctor' ? 'DOC' : 'HOSP';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { role, email, password, confirm_pw, ...rest } = body;

    // ── Basic validation ──────────────────────────────────────────────
    if (!role || !email) {
      return NextResponse.json({ success: false, error: 'Role and email are required.' }, { status: 400 });
    }

    if (password && confirm_pw && password !== confirm_pw) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    if (password && password.length < 4) {
      return NextResponse.json({ success: false, error: 'Password must be at least 4 characters.' }, { status: 400 });
    }

    // Build profile name from role fields
    let name = rest.full_name || rest.driver_name || rest.hospital_name || rest.org_name || email;

    const newProfile = {
      role,
      email: email.toLowerCase(),
      password: password || 'demo1234',
      name,
      id: generateId(role),
      createdAt: new Date(),
      status: 'Active',
      badgeColor: role === 'ambulance' ? '#EF4444' : role === 'doctor' ? '#3B82F6' : '#10B981',
      ...rest,
    };

    // ── 1. Try to save to MongoDB ────────────────────────────────────
    let savedToDb = false;
    try {
      const db = await getDatabase();
      if (db) {
        // Check for duplicate email+role
        const existing = await db.collection('profiles').findOne({
          role,
          email: email.toLowerCase(),
        });

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'An account with this email already exists for this role.' },
            { status: 409 }
          );
        }

        await db.collection('profiles').insertOne(newProfile);
        savedToDb = true;
      }
    } catch (dbErr) {
      console.warn('[auth/register] MongoDB error, proceeding as demo registration:', dbErr.message);
    }

    // Strip password before sending
    const { password: _pw, ...safeProfile } = newProfile;
    const token = makeToken(safeProfile);

    return NextResponse.json({
      success: true,
      profile: safeProfile,
      token,
      _source: savedToDb ? 'mongodb' : 'mock',
      message: savedToDb
        ? 'Account created successfully!'
        : 'Demo account created (MongoDB not configured — data is temporary).',
    });
  } catch (error) {
    console.error('[auth/register] Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
