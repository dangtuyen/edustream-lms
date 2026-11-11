import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Minimal Inline Schema for runtime decoupling
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' }
});

const User = mongoose.model('User', UserSchema);

async function seedSystem() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/lms');
    console.log('Connected to MongoDB for Seeding...');

    // Clear old experimental records
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);

    await User.insertMany([
      { name: 'Alice Student', email: 'student@test.com', password: passwordHash, role: 'student' },
      { name: 'Bob Instructor', email: 'instructor@test.com', password: passwordHash, role: 'instructor' },
      { name: 'Charlie Admin', email: 'admin@test.com', password: passwordHash, role: 'admin' }
    ]);

    console.log('Database successfully seeded! Accounts Ready:');
    console.log(' -> student@test.com / password123');
    console.log(' -> instructor@test.com / password123');
    console.log(' -> admin@test.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
}

seedSystem();
