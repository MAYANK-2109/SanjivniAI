import express from 'express';
import { getPatients, updatePatient } from '../controllers/doctor.controller.js';

const router = express.Router();

router.get('/', getPatients);
router.post('/', updatePatient);

export default router;
