import { AccessToken } from 'livekit-server-sdk';
import Course from '../courses/courseModel.js';

/**
 * @desc    Generate safety WebRTC token authentication credentials for a live room session
 * @route   GET /api/live/token/:courseId
 * @access  Private
 */
export const getLiveRoomToken = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user && req.user._id ? req.user._id.toString() : `user-${Date.now()}`;
  const userName = req.user && req.user.name ? req.user.name : 'Anonymous Learner';
  const userRole = req.user && req.user.role ? String(req.user.role).toLowerCase() : 'student';

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course room target not found.' });

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
    });

    const isInstructor = userRole === 'instructor' || userRole === 'admin';

    // REFINED ENGINE SECURITY GRANTS MATRIX
    at.addGrant({
      roomJoin: true,
      room: courseId,
      canPublish: true,        // Force permission true for all room connections to allow instant dynamic capture
      canPublishData: true,    // Retains full interactive messaging pipeline configurations
      canSubscribe: true,      // Confirms clean multi-rate stream ingestion permissions
    });

    const tokenJwt = await at.toJwt();
    res.status(200).json({ 
      token: tokenJwt,
      serverUrl: process.env.LIVEKIT_SERVER_URL || 'ws://localhost:7880'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server SDK token orchestration error.', error: error.message });
  }
};
