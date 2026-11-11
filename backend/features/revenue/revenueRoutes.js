import express from 'express';
import { processSimulatedCheckout, getInstructorRevenueMetrics } from './revenueController.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout', protect, processSimulatedCheckout);
router.get('/instructor/revenue', protect, authorize('instructor', 'admin'), getInstructorRevenueMetrics);

export default router;
