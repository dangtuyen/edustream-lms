import { Enrollment, InstructorWallet } from './revenueModel.js';
import Course from '../courses/courseModel.js';

/**
 * @desc    Simulated internal payment gateway sandbox checkout engine
 * @route   POST /api/revenue/checkout
 * @access  Private (Student)
 */
export const processSimulatedCheckout = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Please log in to your student account before checking out.' });
  }
  const { courseId, cardNumber, cardExpiry, cvv } = req.body;
  const studentId = req.user._id;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Target course context data missing.' });

    // Prevent duplicate entries checks
    const alreadyEnrolled = await Enrollment.findOne({ student: studentId, course: courseId });
    if (alreadyEnrolled) return res.status(400).json({ message: 'You have already enrolled in this dynamic curriculum pathway.' });

    // Simulated sandbox gateway logic rule: Card numbers starting with '4000' trigger success, '5000' trigger failure
    if (cardNumber && cardNumber.startsWith('5000')) {
      return res.status(402).json({ message: 'Simulated sandbox processor declined the payment authorization.' });
    }

    // Create purchase transaction record
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      amountPaid: course.price || 0
    });
    await enrollment.save();

    // Route revenue assets allocation directly to the instructor's native internal wallet model
    if (course.price > 0) {
      await InstructorWallet.findOneAndUpdate(
        { instructor: course.instructor },
        { 
          $inc: { 
            totalBalance: course.price, 
            lifetimeEarnings: course.price 
          } 
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: 'Payment approved. Course access granted successfully.', enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Payment gateway runtime failure.', error: error.message });
  }
};

/**
 * @desc    Fetch comprehensive revenue dashboard metrics analytics for individual instructor accounts
 * @route   GET /api/revenue/instructor/revenue
 * @access  Private (Instructor)
 */
export const getInstructorRevenueMetrics = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Please log in to your student account before checking out.' });
  }
  const instructorId = req.user._id;

  try {
    // Locate wallet totals assets metrics
    let wallet = await InstructorWallet.findOne({ instructor: instructorId });
    if (!wallet) {
      wallet = await InstructorWallet.create({ instructor: instructorId, totalBalance: 0, lifetimeEarnings: 0 });
    }

    // Pull individual transaction histories logs matching this instructor's master listings
    const courses = await Course.find({ instructor: instructorId }).select('_id');
    const courseIdsArray = courses.map(c => c._id);

    const enrollmentLogs = await Enrollment.find({ course: { $in: courseIdsArray } })
      .populate('student', 'name email')
      .populate('course', 'title price')
      .sort({ enrolledAt: -1 });

    // Group calculation vectors to draw charts analytics on frontend side
    const courseEarningsReport = await Enrollment.aggregate([
      { $match: { course: { $in: courseIdsArray } } },
      { $group: { _id: '$course', totalEarned: { $sum: '$amountPaid' }, salesCount: { $count: {} } } }
    ]);

    // Populate titles safely onto aggregated calculations rows
    const populatedCourseEarnings = await Course.populate(courseEarningsReport, { path: '_id', select: 'title' });

    res.status(200).json({
      summary: {
        currentBalance: wallet.totalBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        totalSalesCount: enrollmentLogs.length
      },
      transactions: enrollmentLogs,
      chartData: populatedCourseEarnings.map(item => ({
        courseTitle: item._id?.title || 'Removed Course',
        revenue: item.totalEarned,
        sales: item.salesCount
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to extract revenue dashboard indices.', error: error.message });
  }
};
