import {Enrollment} from '../revenue/revenueModel.js';
import { Queue } from 'bullmq';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from './courseModel.js';
import {Quiz, QuizSubmission} from '../quizzes/quizModel.js';
import IORedis from 'ioredis';
import mongoose from 'mongoose';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

// Establish dedicated messaging distribution pipelines channel
const videoQueue = new Queue('video-transcoding-pipeline', { connection });

export const addLessonToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { title } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Target course context could not be located.' });

    // Validate ownership boundaries
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden operation on this catalog record.' });
    }

    if (!req.file) return res.status(400).json({ message: 'Missing multimedia binary asset parameters.' });

    // Generate nested curriculum schema tracking items
    const newLesson = {
      title,
      videoUrl: '',
      processingStatus: 'pending'
    };

    course.lessons.push(newLesson);
    const updatedCourse = await course.save();
    const assignedLessonRecord = updatedCourse.lessons[updatedCourse.lessons.length - 1];

    // Enqueue transcoding job payload criteria safely to Redis cluster
    await videoQueue.add(`transcode-${assignedLessonRecord._id}`, {
      courseId: course._id,
      lessonId: assignedLessonRecord._id,
      inputPath: req.file.path
    });

    res.status(201).json({
      message: 'Lesson structure successfully committed. Transcoding job spawned into backend queue.',
      lesson: assignedLessonRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to append lesson metadata framework.', error: error.message });
  }
};

export const  createCourse = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const course = await Course.create({ title, description, price, instructor: req.user.id });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const  addLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lesson = { title, processingStatus: 'pending' };
    course.lessons.push(lesson);
    await course.save();

    const addedLesson = course.lessons[course.lessons.length - 1];

    if (req.file) {
      // Trigger background HLS transcode using BullMQ
      await videoQueue.add('transcodeHLS', {
        courseId,
        lessonId: addedLesson._id,
        filePath: req.file.path,
        fileName: req.file.filename
      });
      addedLesson.processingStatus = 'processing';
      await course.save();
    }

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const  getCourses = async (req, res) => {
  const courses = await Course.find().populate('instructor', 'name');
  res.json(courses);
};

export const getCourseDetails = async (req, res) => {
  const { id } = req.params;
  
  let userId = req.user && req.user._id ? req.user._id.toString() : null;

  if (!userId && req.query.userId) {
    userId = req.query.userId.toString();
  }

  try {
    const course = await Course.findById(id).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    let isEnrolled = false;

    if (userId && mongoose.Types.ObjectId.isValid(userId) && mongoose.Types.ObjectId.isValid(id)) {
      const studentObjectId = new mongoose.Types.ObjectId(userId);
      const courseObjectId = new mongoose.Types.ObjectId(id);

      const enrollmentRecord = await Enrollment.findOne({
        student: studentObjectId,
        course: courseObjectId
      });

      if (enrollmentRecord) {
        isEnrolled = true;
      }
    }

    res.status(200).json({
      ...course.toObject(),
      isEnrolled: isEnrolled || course.price === 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Database validation failure', error: error.message });
  }
};

export const completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    let enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment record not found' });
    
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      await enrollment.save();
    }
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch paginated public course catalog listings
export const getAllCourses = async (req, res) => {
  try {
    // Parse query parameters with structured safety fallbacks
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6; // Deliver 6 clean cards per grid row view
    const skip = (page - 1) * limit;

    const totalCourses = await Course.countDocuments({});
    const courses = await Course.find({})
      .populate('instructor', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      courses,
      pagination: {
        total: totalCourses,
        page,
        limit,
        pages: Math.ceil(totalCourses / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve application courses catalog.', error: error.message });
  }
};

// Fetch paginated instructor management listings
export const getInstructorCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 4; // Deliver 4 layout records per grid block view
    const skip = (page - 1) * limit;

    const queryConditions = { instructor: req.user._id };
    const totalCourses = await Course.countDocuments(queryConditions);
    const courses = await Course.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      courses,
      pagination: {
        total: totalCourses,
        page,
        limit,
        pages: Math.ceil(totalCourses / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve instructor course listings.', error: error.message });
  }
};

// Update course metadata
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const ownerId = course.instructor?._id ? course.instructor._id.toString() : course.instructor?.toString();
    const userId = req.user._id.toString();

    if (ownerId && ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit courses you created' });
    }

    const { title, description, price, isLive } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = Number(price);
    if (isLive !== undefined) course.isLive = Boolean(isLive);

    const updatedCourse = await course.save();
    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lesson title and optionally replace its video file
export const updateLesson = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { title } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const ownerId = course.instructor?._id ? course.instructor._id.toString() : course.instructor?.toString();
    const userId = req.user._id.toString();

    if (ownerId && ownerId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit lessons in your own courses' });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (title) lesson.title = title;

    if (req.file) {
      lesson.videoUrl = '';
      lesson.processingStatus = 'pending';
      await course.save();

      await videoQueue.add(`transcode-${lesson._id}`, {
        courseId: course._id.toString(),
        lessonId: lesson._id.toString(),
        inputPath: req.file.path
      });
    } else {
      await course.save();
    }

    res.status(200).json({ message: 'Lesson updated successfully', lesson });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a lesson from the course syllabus
export const deleteLesson = async (req, res) => {
  const { courseId, lessonId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }

    course.lessons = course.lessons.filter((l) => l._id.toString() !== lessonId);
    await course.save();

    res.status(200).json({ message: 'Lesson removed successfully', lessons: course.lessons });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete lesson', error: error.message });
  }
};

/**
 * @desc    Verify educational progress data parameters and render download binary PDF certificate streams
 * @route   GET /api/courses/:courseId/certificate
 * @access  Private (Student only)
 */
export const generateCertificate = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const userName = req.user.name || 'Exceptional Student';

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Target course context data missing.' });

    // Step 1: Verify progress parameters by fetching quiz validation records from MongoDB
    const activeQuiz = await Quiz.findOne({ course: courseId });
    if (!activeQuiz) {
      return res.status(400).json({ message: 'This curriculum pathway does not support certificate generation mechanisms.' });
    }

    const successfulSubmission = await QuizSubmission.findOne({
      user: userId,
      quiz: activeQuiz._id,
      passed: true
    });

    if (!successfulSubmission) {
      return res.status(403).json({ 
        message: 'Progress validation denied. You must pass the comprehensive evaluation quiz before claiming your degree.' 
      });
    }

    // Step 2: Initialize modern PDF document structure layers on the fly
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape', // Standard horizontal degree format
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // Configure client headers for clean attached browser down-stream delivery download
    const filename = `Certificate-${courseId}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Draw luxury structural outer double-border layout context matrices
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke('#1e293b');

    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
       .lineWidth(1)
       .stroke('#64748b');

    // Render central branding typography metadata
    doc.moveDown(4);
    doc.fillColor('#4f46e5')
       .fontSize(36)
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', { align: 'center' });

    doc.moveDown(1.5);
    doc.fillColor('#334155')
       .fontSize(14)
       .font('Helvetica')
       .text('Proudly Presented and Conferred To:', { align: 'center' });

    // Render Student name callout parameters values
    doc.moveDown(1);
    doc.fillColor('#0f172a')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(userName.toUpperCase(), { align: 'center' });

    doc.moveDown(1);
    doc.lineWidth(1)
       .moveTo(200, doc.y)
       .lineTo(doc.page.width - 200, doc.y)
       .stroke('#cbd5e1');

    // Append course reference description text streams
    doc.moveDown(1.5);
    doc.fillColor('#64748b')
       .fontSize(14)
       .font('Helvetica')
       .text('For successfully navigating and clearing all multi-choice evaluation pipelines listed within:', { align: 'center' });

    doc.moveDown(0.5);
    doc.fillColor('#1e293b')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(`"${course.title}"`, { align: 'center' });

    // Inject automated dynamic time certification timestamps metrics
    doc.moveDown(3);
    doc.fillColor('#94a3b8')
       .fontSize(10)
       .font('Helvetica')
       .text(`Verification Hash ID: ${successfulSubmission._id}`, { align: 'center' });
       
    doc.text(`Issued On: ${new Date(successfulSubmission.completedAt).toLocaleDateString()}`, { align: 'center' });

    // Finalize data write cycles to unblock network port response flows
    doc.end();

  } catch (error) {
    res.status(500).json({ message: 'Failed to process document write automation layers.', error: error.message });
  }
};