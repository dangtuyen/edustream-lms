import mongoose from 'mongoose';

// Transaction data schema mapping course purchases
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amountPaid: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  paymentMethod: { type: String, default: 'Simulated Test Card' },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Wallet schema tracking instructor financial assets balances
const walletSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalBalance: { type: Number, default: 0 },
  lifetimeEarnings: { type: Number, default: 0 }
}, { timestamps: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export const InstructorWallet = mongoose.model('InstructorWallet', walletSchema);
