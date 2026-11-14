import Course from '../courses/courseModel.js'; 
import { Quiz, QuizSubmission } from './quizModel.js';

// Create a new quiz for a course (Instructor only)
export const createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, questions } = req.body;
    const quiz = new Quiz({ course: courseId, title, description, questions });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz framework.', error: error.message });
  }
};

// Fetch quiz details or auto-provision a dynamic layout if none exists
export const getQuizByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    // Attempt to locate an existing quiz record binding for this course instance
    let quiz = await Quiz.findOne({ course: courseId });

    // Auto-provisioning logic block: Create a default quiz dynamically if missing
    if (!quiz) {
      const courseContext = await Course.findById(courseId);
      const courseTitle = courseContext ? courseContext.title : 'This Course';

      quiz = new Quiz({
        course: courseId,
        title: `${courseTitle} - Comprehensive Assessment`,
        description: 'Test your understanding of the curriculum tracks and multimedia core variables covered in this section.',
        questions: [
          {
            questionText: 'Which protocol handles the segment-based streaming media handshakes within this virtual classroom environment?',
            options: [
              'HTTP Live Streaming (HLS / .m3u8)',
              'Simple Mail Transfer Protocol (SMTP)',
              'File Transfer Protocol (FTP)',
              'Hypertext Transfer Protocol (HTTP)'
            ],
            correctOptionIndex: 0,
            points: 10
          },
          {
            questionText: 'What background consumer system processes raw video chunks to generate adaptive multi-rate layout outputs?',
            options: [
              'BullMQ working over a Redis cluster instance',
              'Nodemon runtime monitor utilities',
              'Native window.atob Base64 processing layers',
              'Local JSON string serialization parameters'
            ],
            correctOptionIndex: 0,
            points: 10
          },
          {
            questionText: 'What condition triggers automatic user session logouts within this security architecture framework?',
            options: [
              'Reaching the 2-hour JWT token validation lifespan expiration limit',
              'Navigating back to the main public courses catalog matrix grid',
              'Clicking the custom Edit Course Info metadata configuration button',
              'Refreshing the web browser using manual F5 commands execution'
            ],
            correctOptionIndex: 0,
            points: 10
          }
        ]
      });

      // Save the generated document directly into MongoDB
      await quiz.save();
    }

    // Sanitize output layout metrics to hide correctOptionIndex values from the client payload
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      points: q.points
    }));

    res.status(200).json({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: sanitizedQuestions
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to synchronize paginated assessment quiz modules parameters.', 
      error: error.message 
    });
  }
};

// Auto-grading submission workflow
export const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId, answers } = req.body; // answers: array of chosen indexes [0, 2, 1...]
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz profile target not found.' });

    let calculatedScore = 0;
    let totalMaxPoints = 0;

    // Core Auto-Grading Engine Matrix
    quiz.questions.forEach((question, index) => {
      totalMaxPoints += question.points;
      const studentSelection = answers[index];
      
      if (studentSelection === question.correctOptionIndex) {
        calculatedScore += question.points;
      }
    });

    const minimumPassingRatio = 0.6; // 60% standard to pass evaluation
    const isPassed = (calculatedScore / totalMaxPoints) >= minimumPassingRatio;

    // Track student educational progress by saving the submission metrics
    const submission = new QuizSubmission({
      user: req.user._id,
      quiz: quizId,
      answers,
      score: calculatedScore,
      totalPoints: totalMaxPoints,
      passed: isPassed
    });

    await submission.save();

    res.status(200).json({
      message: 'Evaluation engine finished scoring process successfully.',
      score: calculatedScore,
      totalPoints: totalMaxPoints,
      passed: isPassed
    });
  } catch (error) {
    res.status(500).json({ message: 'Auto-grading execution failure.', error: error.message });
  }
};
