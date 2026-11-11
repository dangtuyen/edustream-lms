import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  createCourse, 
  getAllCourses, 
  getInstructorCourses,
  getCourseDetails,
  addLesson,          
  completeLesson,
  generateCertificate,
  addLessonToCourse,
  updateCourse,
  updateLesson, 
  deleteLesson
} from './courseController.js';
import { protect, authorize } from '../../middleware/authMiddleware.js';

const router = express.Router();

const rawUploadDir = 'uploads/raw';
if (!fs.existsSync(rawUploadDir)) {
  fs.mkdirSync(rawUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, rawUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.mp4' && ext !== '.mkv' && ext !== '.mov') {
      return cb(new Error('Invalid media profile type. Only MP4, MKV, or MOV formats are permitted.'), false);
    }
    cb(null, true);
  }
});

router.post('/:courseId/lessons', protect, authorize('instructor', 'admin'), upload.single('video'), addLessonToCourse);


router.get('/', getAllCourses);
router.get('/instructor/my-listings', protect, authorize('instructor'), getInstructorCourses);
router.get('/:id', getCourseDetails);
router.get('/:courseId/certificate', protect, generateCertificate);

router.post('/', protect, authorize('instructor'), createCourse);
router.post('/complete-lesson', protect, completeLesson);

router.post('/:courseId/lessons', protect, authorize('instructor', 'admin'), upload.single('video'), addLesson);

router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.put('/:courseId/lessons/:lessonId', protect, authorize('instructor', 'admin'), upload.single('video'), updateLesson);
router.delete('/:courseId/lessons/:lessonId', protect, authorize('instructor', 'admin'), deleteLesson);
export default router;
