import express from 'express';
import { getNearbyCare } from '../controllers/nearby-care.controller.js';

const router = express.Router();

router.post('/', getNearbyCare);

export default router;
