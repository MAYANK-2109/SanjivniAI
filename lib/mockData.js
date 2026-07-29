/**
 * lib/mockData.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Centralized mock / seed data for all Sanjeevani API routes.
 * Used as fallback when MongoDB is unavailable or a collection is empty.
 *
 * DO NOT import from app/api/* routes — only import from lib/*.
 */

// ── Role Profiles ────────────────────────────────────────────────────────────
export const INITIAL_PROFILES = [
  {
    role: 'ambulance',
    name: 'Paramedic Team Alpha (Unit 102)',
    id: 'AMB-102',
    hospitalAssigned: 'Apex City Hospital - Emergency Response',
    vehicle: 'Type III ALS Ambulance',
    driver: 'Rajesh Kumar (ALS Certified)',
    status: 'ON CALL - Dispatch Active',
    badgeColor: '#EF4444',
    email: 'dispatch@ems.in',
    password: 'demo1234',
  },
  {
    role: 'doctor',
    name: 'Dr. Ananya Sharma, MD',
    id: 'DOC-8842',
    specialty: 'Emergency Medicine & Critical Triage',
    hospital: 'Apex City Hospital',
    license: 'MCI-2018-9941',
    status: 'On Duty - Triage Active',
    badgeColor: '#3B82F6',
    email: 'doctor@example.com',
    password: 'demo1234',
  },
  {
    role: 'hospital',
    name: 'Apex City Emergency & Trauma Center',
    id: 'HOSP-001',
    code: 'ACH-TRAUMA-1',
    location: 'Sector 4, Central Healthcare Zone',
    status: 'L1 Trauma Center - Active Intake',
    badgeColor: '#10B981',
    email: 'admin@hospital.in',
    password: 'demo1234',
  },
];

// In-memory store for newly registered profiles when MongoDB is offline
export const REGISTERED_PROFILES = [...INITIAL_PROFILES];

export function findRegisteredUser(role, identifier) {
  const cleanId = (identifier || '').toLowerCase().trim();
  return REGISTERED_PROFILES.find(
    (p) =>
      p.role === role &&
      ((p.email && p.email.toLowerCase() === cleanId) || (p.phone && p.phone === cleanId))
  );
}

export function saveRegisteredUser(profile) {
  REGISTERED_PROFILES.push(profile);
}

// ── Dispatches ────────────────────────────────────────────────────────────────
export const INITIAL_DISPATCHES = [
  {
    caseId: 'CAS-9921',
    patientName: 'Ramesh Verma',
    age: 54,
    gender: 'Male',
    condition: 'Acute Chest Pain & Severe Dyspnea',
    acuityScore: 92,
    severity: 'RED',
    vitals: { hr: 124, bp: '165/100', spo2: 89, temp: '37.8°C' },
    destination: 'Apex City Emergency & Trauma Center',
    etaMinutes: 7,
    status: 'EN ROUTE',
    erNotified: true,
    unit: 'Ambulance Unit 102',
    updatedAt: new Date(),
  },
  {
    caseId: 'CAS-9944',
    patientName: 'Pooja Nair',
    age: 31,
    gender: 'Female',
    condition: 'Multiple Trauma / Road Incident',
    acuityScore: 88,
    severity: 'RED',
    vitals: { hr: 110, bp: '100/65', spo2: 94, temp: '36.9°C' },
    destination: 'Apex City Emergency & Trauma Center',
    etaMinutes: 14,
    status: 'EN ROUTE',
    erNotified: true,
    unit: 'Ambulance Unit 205',
    updatedAt: new Date(),
  },
];

// ── Patients ──────────────────────────────────────────────────────────────────
export const INITIAL_PATIENTS = [
  {
    patientId: 'PAT-9012',
    name: 'Ramesh Verma',
    age: 54,
    gender: 'Male',
    severity: 'RED',
    acuityScore: 92,
    chiefComplaint: 'Acute crushing chest pain radiating to left jaw & breathlessness',
    vitalSummary: 'HR 124, BP 165/100, SpO2 89%',
    redFlags: ['ST Elevation Suspected', 'Hypoxia', 'Diaphoresis'],
    differential: [
      { disease: 'Acute Myocardial Infarction (ICD-10 I21.9)', prob: '88%' },
      { disease: 'Aortic Dissection (ICD-10 I71.0)', prob: '7%' },
      { disease: 'Pulmonary Embolism (ICD-10 I26.9)', prob: '5%' },
    ],
    recommendedLabs: ['12-Lead ECG Immediately', 'Troponin-I Stat', 'Chest X-Ray Portable', 'D-Dimer'],
    recommendedCare: 'Emergency Angiography / Cath Lab Activation',
    location: 'En route in Ambulance Unit 102 (ETA 7m)',
    language: 'Hindi / English',
    doctorNotes: '',
    updatedAt: new Date(),
  },
  {
    patientId: 'PAT-8841',
    name: 'Sunita Devi',
    age: 42,
    gender: 'Female',
    severity: 'ORANGE',
    acuityScore: 78,
    chiefComplaint: 'Sudden onset severe right lower quadrant abdominal pain with fever',
    vitalSummary: 'HR 98, BP 130/85, Temp 38.6°C',
    redFlags: ['Rebound Tenderness', 'High Grade Fever', 'Leukocytosis Suspected'],
    differential: [
      { disease: 'Acute Appendicitis (ICD-10 K35.8)', prob: '82%' },
      { disease: 'Ovarian Cyst Rupture (ICD-10 N83.2)', prob: '12%' },
      { disease: 'Gastroenteritis (ICD-10 A09)', prob: '6%' },
    ],
    recommendedLabs: ['Abdominal Ultrasound Stat', 'CBC with Differential', 'CRP'],
    recommendedCare: 'Surgical Consult & IV Antibiotic Triage',
    location: 'ER Waiting Bay 4',
    language: 'Hindi',
    doctorNotes: '',
    updatedAt: new Date(),
  },
];

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const INITIAL_HOSPITALS = [
  {
    hospitalId: 'HOSP-001',
    id: 'hosp-1',
    name: 'Apex City Emergency & Trauma Center',
    erStatus: 'NORMAL_INTAKE',
    capacity: {
      icuTotal: 20,
      icuFree: 3,
      erBedsTotal: 45,
      erBedsFree: 8,
      ventilatorsTotal: 15,
      ventilatorsFree: 2,
      traumaBaysTotal: 6,
      traumaBaysFree: 1,
    },
    updatedAt: new Date(),
  },
];

// ── Mock Ambulance Drivers (for ride flow fallback) ────────────────────────────
export const MOCK_DRIVERS = [
  {
    id: 'DRV-001',
    driver_id: 'DRV-001',
    name: 'Rajesh Kumar',
    initials: 'RK',
    color: '#EF4444',
    rating: '4.9',
    trips: 1240,
    experience: '8 yrs',
    phone: '+919876543210',
    vehicle: 'DL-01-AB-1234',
    model: 'Tata Winger ALS',
    status: 'available',
  },
  {
    id: 'DRV-002',
    driver_id: 'DRV-002',
    name: 'Suresh Patel',
    initials: 'SP',
    color: '#F59E0B',
    rating: '4.7',
    trips: 876,
    experience: '5 yrs',
    phone: '+919876543211',
    vehicle: 'MH-02-CD-5678',
    model: 'Force Traveller BLS',
    status: 'available',
  },
  {
    id: 'DRV-003',
    driver_id: 'DRV-003',
    name: 'Anil Sharma',
    initials: 'AS',
    color: '#10B981',
    rating: '4.8',
    trips: 2100,
    experience: '12 yrs',
    phone: '+919876543212',
    vehicle: 'KA-03-EF-9012',
    model: 'Toyota HiAce ICU',
    status: 'available',
  },
];

// ── In-memory ride store (fallback when MongoDB is offline) ───────────────────
// This is a simple server-side in-memory map. It resets on server restart.
// In production with MongoDB, this is never used.
export const IN_MEMORY_RIDES = new Map();

/**
 * Generate a short mock ride ID (not a MongoDB ObjectId).
 */
export function generateMockRideId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
