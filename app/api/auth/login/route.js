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

    const identifier = (email || '').trim();

    if (!identifier || !role) {
      return NextResponse.json({ success: false, error: 'Email/Phone and role are required.' }, { status: 400 });
    }

    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+\d][\d\s\-()]{7,15}$/;

    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Please provide a valid email address or phone number.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    let profile = null;

    // ── 1. Try MongoDB ────────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        profile = await db.collection('profiles').findOne({
          role,
          $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
        });

        if (profile && profile.password && profile.password !== password) {
          return NextResponse.json(
            { success: false, error: 'Incorrect password for this account.' },
            { status: 401 }
          );
        }
      }
    } catch (dbErr) {
      console.warn('[auth/login] MongoDB error, falling back to static profiles:', dbErr.message);
    }

    // ── 2. Fallback to static demo profiles ──────────────────────────
    if (!profile) {
      // Find exact profile matching role AND email/phone
      const staticProfile = INITIAL_PROFILES.find(
        (p) =>
          p.role === role &&
          (p.email.toLowerCase() === identifier.toLowerCase() || p.phone === identifier)
      );

      if (staticProfile) {
        if (staticProfile.password === password) {
          profile = staticProfile;
        } else {
          return NextResponse.json(
            { success: false, error: 'Incorrect password for this account.' },
            { status: 401 }
          );
        }
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: `No ${role} account found matching "${identifier}". Please check your email/phone or register a new account.`,
        },
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
