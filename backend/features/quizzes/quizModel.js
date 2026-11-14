import mongoose from 'mongoose';

// Schema for individual quiz question choices
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true }, // Index of the correct choice (0, 1, 2, 3)
  points: { type: Number, default: 10 }
});

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  questions: [questionSchema]
}, { timestamps: true });

// Schema to record student progress and scores
const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{ type: Number }], // Indexes chosen by the student
  score: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  completedAt: { type: Date, default: Date.now }
});

export const Quiz = mongoose.model('Quiz', quizSchema);
export const QuizSubmission = mongoose.model('QuizSubmission', submissionSchema);
