import express from 'express';
import { getNearbyAmbulances } from '../controllers/ambulances.controller.js';

const router = express.Router();

router.post('/', getNearbyAmbulances);

export default router;
