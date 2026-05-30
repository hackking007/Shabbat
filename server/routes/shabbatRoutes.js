import express from 'express';
import { getShabbatInfo } from '../controllers/shabbatController.js';

const router = express.Router();

router.get('/', getShabbatInfo);


export default router;
