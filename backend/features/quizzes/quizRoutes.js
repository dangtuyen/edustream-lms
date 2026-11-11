import express from 'express';
import { createQuiz, getQuizByCourse, submitQuizAnswers } from './quizController.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', protect, getQuizByCourse);
router.post('/submit', protect, submitQuizAnswers);
router.post('/', protect, authorize('instructor', 'admin'), createQuiz);

export default router;
