import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import ambulanceRoutes from './routes/ambulance.routes.js';
import ambulancesRoutes from './routes/ambulances.routes.js';
import nearbyCareRoutes from './routes/nearby-care.routes.js';
import ridesRoutes from './routes/rides.routes.js';
import triageRoutes from './routes/triage.routes.js';
import seedRoutes from './routes/seed.routes.js';
import placesRoutes from './routes/places.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Sanjeevani API Backend Running', version: '1.0.0' });
});

// Mount all routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/ambulances', ambulancesRoutes);
app.use('/api/nearby-care', nearbyCareRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/places', placesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Sanjeevani backend running on http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});
