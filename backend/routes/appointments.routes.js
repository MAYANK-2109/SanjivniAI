import express from 'express';
import { createAppointment, getAppointments, updateAppointment } from '../controllers/appointments.controller.js';

const router = express.Router();

router.post('/', createAppointment);
router.get('/', getAppointments);
router.patch('/', updateAppointment);

export default router;
