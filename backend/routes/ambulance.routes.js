import express from 'express';
import { getDispatches, updateDispatch } from '../controllers/ambulance.controller.js';

const router = express.Router();

router.get('/', getDispatches);
router.post('/', updateDispatch);

export default router;
