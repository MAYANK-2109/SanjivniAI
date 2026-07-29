/**
 * app/api/auth/login/route.js
 * Handles login for all roles: ambulance, doctor, hospital.
 *
 * POST /api/auth/login
 * Body: { email, password, role }
 *
 * Returns: { success, profile, token }
 *
 * For this demo the "token" is a simple base64 payload (not a real JWT).
 * In production, replace with a proper JWT or NextAuth session.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_PROFILES } from '@/lib/mockData';

function makeToken(profile) {
  const payload = { id: profile.id, role: profile.role, name: profile.name, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ success: false, error: 'Email and role are required.' }, { status: 400 });
    }

    let profile = null;

    // ── 1. Try MongoDB ────────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        profile = await db.collection('profiles').findOne({
          role,
          $or: [{ email: email.toLowerCase() }, { phone: email }],
        });

        // Verify password (in production, use bcrypt)
        if (profile && profile.password && profile.password !== password) {
          profile = null; // wrong password
        }
      }
    } catch (dbErr) {
      console.warn('[auth/login] MongoDB error, falling back to static profiles:', dbErr.message);
    }

    // ── 2. Fallback to static demo profiles ──────────────────────────
    if (!profile) {
      const staticProfile = INITIAL_PROFILES.find((p) => p.role === role);
      if (staticProfile) {
        // In demo mode, accept any password or the demo password
        const passwordOk = !password || password === staticProfile.password || password.length >= 4;
        if (passwordOk) {
          profile = staticProfile;
        }
      }
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Use any password with 4+ characters for the demo.' },
        { status: 401 }
      );
    }

    // Strip password before sending to client
    const { password: _pw, ...safeProfile } = profile;
    const token = makeToken(safeProfile);

    return NextResponse.json({
      success: true,
      profile: safeProfile,
      token,
      _source: profile._id ? 'mongodb' : 'mock',
    });
  } catch (error) {
    console.error('[auth/login] Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
