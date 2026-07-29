import express from 'express';
import { getHospital, updateHospital } from '../controllers/hospital.controller.js';

const router = express.Router();

router.get('/', getHospital);
router.post('/', updateHospital);

export default router;
