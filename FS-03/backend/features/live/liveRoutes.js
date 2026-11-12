import express from 'express';
import { getLiveRoomToken } from './liveController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/token/:courseId', protect, getLiveRoomToken);

export default router;
