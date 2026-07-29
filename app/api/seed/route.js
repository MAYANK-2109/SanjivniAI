import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const INITIAL_PROFILES = [
  {
    role: 'ambulance',
    name: 'Paramedic Team Alpha (Unit 102)',
    id: 'AMB-102',
    hospitalAssigned: 'Apex City Hospital - Emergency Response',
    vehicle: 'Type III ALS Ambulance',
    driver: 'Rajesh Kumar (ALS Certified)',
    status: 'ON CALL - Dispatch Active',
    badgeColor: '#EF4444'
  },
  {
    role: 'doctor',
    name: 'Dr. Ananya Sharma, MD',
    id: 'DOC-8842',
    specialty: 'Emergency Medicine & Critical Triage',
    hospital: 'Apex City Hospital',
    license: 'MCI-2018-9941',
    status: 'On Duty - Triage Active',
    badgeColor: '#3B82F6'
  },
  {
    role: 'hospital',
    name: 'Apex City Emergency & Trauma Center',
    id: 'HOSP-001',
    code: 'ACH-TRAUMA-1',
    location: 'Sector 4, Central Healthcare Zone',
    status: 'L1 Trauma Center - Active Intake',
    badgeColor: '#10B981'
  }
];

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
    updatedAt: new Date()
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
    updatedAt: new Date()
  }
];

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
      { disease: 'Pulmonary Embolism (ICD-10 I26.9)', prob: '5%' }
    ],
    recommendedLabs: ['12-Lead ECG Immediately', 'Troponin-I Stat', 'Chest X-Ray Portable', 'D-Dimer'],
    recommendedCare: 'Emergency Angiography / Cath Lab Activation',
    location: 'En route in Ambulance Unit 102 (ETA 7m)',
    language: 'Hindi / English',
    doctorNotes: '',
    updatedAt: new Date()
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
      { disease: 'Gastroenteritis (ICD-10 A09)', prob: '6%' }
    ],
    recommendedLabs: ['Abdominal Ultrasound Stat', 'CBC with Differential', 'CRP'],
    recommendedCare: 'Surgical Consult & IV Antibiotic Triage',
    location: 'ER Waiting Bay 4',
    language: 'Hindi',
    doctorNotes: '',
    updatedAt: new Date()
  }
];

export const INITIAL_HOSPITALS = [
  {
    hospitalId: 'HOSP-001',
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
    updatedAt: new Date()
  }
];

export async function POST() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'MongoDB URI is not configured in .env.local yet.'
      }, { status: 400 });
    }

    // Seed Profiles
    await db.collection('profiles').deleteMany({});
    await db.collection('profiles').insertMany(INITIAL_PROFILES);

    // Seed Dispatches
    await db.collection('dispatches').deleteMany({});
    await db.collection('dispatches').insertMany(INITIAL_DISPATCHES);

    // Seed Patients
    await db.collection('patients').deleteMany({});
    await db.collection('patients').insertMany(INITIAL_PATIENTS);

    // Seed Hospitals
    await db.collection('hospitals').deleteMany({});
    await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);

    return NextResponse.json({
      success: true,
      message: 'MongoDB successfully seeded with Sanjeevani collections!',
      collectionsSeeded: ['profiles', 'dispatches', 'patients', 'hospitals']
    });
  } catch (error) {
    console.error('MongoDB Seed Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
