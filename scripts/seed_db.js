// scripts/seed_db.js
// Script to populate MongoDB with real doctors and ambulances.

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('cluster.mongodb.net')) {
  console.error("Please set a valid MONGODB_URI in .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

const DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Rajesh Sharma",
    specialization: "General Physician",
    experience: "15+ years",
    rating: 4.8,
    reviews: 124,
    availability: "Available Now",
    hospital: "AIIMS Delhi",
    fee: 800,
    tags: ["Fever", "Cough", "General Illness"],
    image: "RS",
    color: "#3B82F6"
  },
  {
    id: "doc-2",
    name: "Dr. Anjali Desai",
    specialization: "Cardiologist",
    experience: "12+ years",
    rating: 4.9,
    reviews: 312,
    availability: "Available in 10 min",
    hospital: "Fortis Escorts",
    fee: 1500,
    tags: ["Chest Pain", "BP Issues", "Heart Care"],
    image: "AD",
    color: "#EF4444"
  },
  {
    id: "doc-3",
    name: "Dr. Sameer Khan",
    specialization: "Orthopedic",
    experience: "8+ years",
    rating: 4.7,
    reviews: 89,
    availability: "Available Now",
    hospital: "Max Super Speciality",
    fee: 1200,
    tags: ["Joint Pain", "Fractures", "Spine"],
    image: "SK",
    color: "#10B981"
  },
  {
    id: "doc-4",
    name: "Dr. Neha Gupta",
    specialization: "Pediatrician",
    experience: "10+ years",
    rating: 4.9,
    reviews: 420,
    availability: "Available Now",
    hospital: "Rainbow Children's",
    fee: 1000,
    tags: ["Child Care", "Vaccination", "Fever"],
    image: "NG",
    color: "#F59E0B"
  }
];

const AMBULANCES = [
  {
    driver_id: "amb-1",
    name: 'Ravi Kumar Singh',
    initials: 'RK',
    vehicle: 'DL 8C AM 4421',
    model: 'Force Traveller ALS',
    tier: 'als',
    rating: 4.8,
    trips: 1247,
    experience: '6 yrs',
    phone: '+91 98765 43210',
    color: '#10B981',
    location: {
      type: "Point",
      coordinates: [77.2095, 28.6152] // Longitude, Latitude
    },
    status: 'available'
  },
  {
    driver_id: "amb-2",
    name: 'Suresh Yadav',
    initials: 'SY',
    vehicle: 'DL 3C AM 7893',
    model: 'TATA Winger BLS',
    tier: 'bls',
    rating: 4.6,
    trips: 893,
    experience: '4 yrs',
    phone: '+91 91234 56780',
    color: '#06B6D4',
    location: {
      type: "Point",
      coordinates: [77.2060, 28.6170]
    },
    status: 'available'
  },
  {
    driver_id: "amb-3",
    name: 'Mohd. Tariq',
    initials: 'MT',
    vehicle: 'HR 26 AM 1122',
    model: 'Mahindra Bolero BLS',
    tier: 'bls',
    rating: 4.5,
    trips: 450,
    experience: '2 yrs',
    phone: '+91 99887 77665',
    color: '#F59E0B',
    location: {
      type: "Point",
      coordinates: [77.2150, 28.6100]
    },
    status: 'available'
  }
];

const PROFILES = [
  { id: 'hospital', name: 'AIIMS Trauma Center', role: 'hospital' },
  { id: 'doctor', name: 'Dr. Rajesh Sharma', role: 'doctor' },
  { id: 'ambulance', name: 'Ravi Kumar Singh', role: 'ambulance', ambulance_id: 'amb-1' }
];

const HOSPITALS = [
  {
    id: "hosp-1",
    name: "AIIMS Trauma Center",
    location: "New Delhi",
    status: "Normal Operations",
    resources: {
      icuBeds: { total: 40, available: 3 },
      erBeds: { total: 20, available: 5 },
      bloodBank: { 'O+': '24 units', 'A-': '5 units' },
      specialists: 14
    }
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db('sanjeevani_db');
    
    console.log("Clearing existing data...");
    await db.collection('doctors').deleteMany({});
    await db.collection('ambulances').deleteMany({});

    console.log("Inserting doctors...");
    await db.collection('doctors').insertMany(DOCTORS);

    console.log("Inserting ambulances...");
    await db.collection('ambulances').insertMany(AMBULANCES);

    console.log("Inserting profiles...");
    await db.collection('profiles').deleteMany({});
    await db.collection('profiles').insertMany(PROFILES);

    console.log("Inserting hospitals...");
    await db.collection('hospitals').deleteMany({});
    await db.collection('hospitals').insertMany(HOSPITALS);

    // Create geospatial index for ambulances
    console.log("Creating 2dsphere index for ambulances...");
    await db.collection('ambulances').createIndex({ location: "2dsphere" });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding DB:", error);
  } finally {
    await client.close();
  }
}

run();
