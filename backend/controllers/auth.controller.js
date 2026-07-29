import { getDatabase } from '../config/db.js';
import { INITIAL_PROFILES } from '../config/mockData.js';

function makeToken(profile) {
  const payload = { id: profile.id, role: profile.role, name: profile.name, ts: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function generateId(role) {
  const prefix = role === 'ambulance' ? 'AMB' : role === 'doctor' ? 'DOC' : 'HOSP';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const identifier = (email || '').trim();

    if (!identifier || !role) {
      return res.status(400).json({ success: false, error: 'Email/Phone and role are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+\d][\d\s\-()]{7,15}$/;

    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      return res.status(400).json({ success: false, error: 'Invalid format. Please provide a valid email address or phone number.' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    let profile = null;

    try {
      const db = await getDatabase();
      if (db) {
        profile = await db.collection('profiles').findOne({
          role,
          $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
        });

        if (profile && profile.password && profile.password !== password) {
          return res.status(401).json({ success: false, error: 'Incorrect password for this account.' });
        }
      }
    } catch (dbErr) {
      console.warn('[auth/login] MongoDB error, falling back to static profiles:', dbErr.message);
    }

    if (!profile) {
      const staticProfile = INITIAL_PROFILES.find(
        (p) =>
          p.role === role &&
          (p.email.toLowerCase() === identifier.toLowerCase() || p.phone === identifier)
      );

      if (staticProfile) {
        if (staticProfile.password === password) {
          profile = staticProfile;
        } else {
          return res.status(401).json({ success: false, error: 'Incorrect password for this account.' });
        }
      }
    }

    if (!profile) {
      return res.status(401).json({
        success: false,
        error: `No ${role} account found matching "${identifier}". Please check your email/phone or register a new account.`,
      });
    }

    const { password: _pw, ...safeProfile } = profile;
    const token = makeToken(safeProfile);

    return res.json({
      success: true,
      profile: safeProfile,
      token,
      _source: profile._id ? 'mongodb' : 'mock',
    });
  } catch (error) {
    console.error('[auth/login] Fatal error:', error);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

export const register = async (req, res) => {
  try {
    const { role, email, password, confirm_pw, ...rest } = req.body;
    const identifier = (email || '').trim();

    if (!role || !identifier) {
      return res.status(400).json({ success: false, error: 'Role and Email/Phone are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+\d][\d\s\-()]{7,15}$/;

    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      return res.status(400).json({ success: false, error: 'Invalid Email/Phone format. Enter a valid email (e.g. user@domain.com) or phone number (e.g. +91 9876543210).' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    if (confirm_pw !== undefined && password !== confirm_pw) {
      return res.status(400).json({ success: false, error: 'Password and Confirm Password do not match.' });
    }

    if (role === 'ambulance') {
      if (!rest.org_name?.trim() || !rest.driver_name?.trim() || !rest.vehicle_reg?.trim()) {
        return res.status(400).json({ success: false, error: 'Organization name, Driver name, and Vehicle registration are required for Ambulance.' });
      }
    } else if (role === 'doctor') {
      if (!rest.full_name?.trim() || !rest.med_reg?.trim() || !rest.specialization?.trim()) {
        return res.status(400).json({ success: false, error: 'Full name, Medical Registration number, and Specialization are required for Doctor.' });
      }
    } else if (role === 'hospital') {
      if (!rest.hospital_name?.trim() || !rest.reg_no?.trim() || !rest.city?.trim()) {
        return res.status(400).json({ success: false, error: 'Hospital name, Registration number, and City are required for Hospital.' });
      }
    }

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

    let savedToDb = false;
    try {
      const db = await getDatabase();
      if (db) {
        const existing = await db.collection('profiles').findOne({
          role,
          email: email.toLowerCase(),
        });

        if (existing) {
          return res.status(409).json({ success: false, error: 'An account with this email already exists for this role.' });
        }

        await db.collection('profiles').insertOne(newProfile);
        savedToDb = true;
      }
    } catch (dbErr) {
      console.warn('[auth/register] MongoDB error, proceeding as demo registration:', dbErr.message);
    }

    const { password: _pw, ...safeProfile } = newProfile;
    const token = makeToken(safeProfile);

    return res.json({
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
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
};
