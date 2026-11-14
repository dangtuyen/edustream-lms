import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    isLive: { type: Boolean, default: false },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lessons: [
      {
        title: String,
        videoUrl: String,
        processingStatus: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' }
      }
    ]
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
