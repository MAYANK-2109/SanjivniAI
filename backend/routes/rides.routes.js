import express from 'express';
import { requestRide, getRideStatus, driverGetRide, driverUpdateRide } from '../controllers/rides.controller.js';

const router = express.Router();

router.post('/request', requestRide);
router.get('/status', getRideStatus);
router.get('/driver', driverGetRide);
router.post('/driver', driverUpdateRide);

export default router;
