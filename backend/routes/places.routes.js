import express from 'express';
import { autocomplete, reverseGeocode } from '../controllers/places.controller.js';

const router = express.Router();

router.get('/autocomplete', autocomplete);
router.get('/reverse', reverseGeocode);

export default router;
