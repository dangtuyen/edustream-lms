
🎓 EduStream LMS — Full-Stack Learning Management System & Live Classroom

A comprehensive, self-hosted Learning Management System (LMS) built with the MERN Stack (MongoDB, Express.js, React, Node.js). EduStream LMS supports on-demand adaptive video streaming (HLS), real-time WebRTC live classes with camera/screen sharing and chat, auto-graded assessments, automated PDF certificate generation, and a self-contained sandbox payment & instructor revenue dashboard.


✨ Key Features

• 🔐 Role-Based Authentication & UI Alerts: JWT authentication supporting Student and Instructor roles, protected routes, and a custom global notification banner system.
• 🎬 Adaptive VOD Streaming (HLS): Asynchronous video upload and transcoding pipeline powered by Multer, BullMQ, Redis, and FFmpeg that converts raw .mp4/.mov files into .m3u8 adaptive playlists played smoothly via hls.js.
• 🎙️ Real-Time WebRTC Live Classrooms: Low-latency live video broadcasting, screen sharing, and instant classroom chat powered by LiveKit (self-hosted SFU).
• 📝 Auto-Graded Quizzes & Progress Tracking: Interactive multiple-choice quizzes with dynamic auto-provisioning per course, automatic server-side grading (60% passing threshold), and score tracking.
• 🎓 Automated PDF Certificates: Dynamic A4 landscape completion certificates generated on-the-fly with PDFKit upon passing course assessments.
• 💰 Self-Contained Sandbox Payments & Revenue Dashboard: Built-in simulated payment gateway (zero external third-party payment dependencies) featuring live card number/expiry auto-formatting, course content unlocking, instructor wallet tracking, native CSS bar charts, and historical enrollment ledgers.
• 📚 Complete Course & Curriculum Management: Paginated course catalog and instructor dashboard, two-column course blueprint builder with draft lesson playlists, and inline course/lesson editing.


🛠️ Tech Stack


Frontend

• React (Vite) & React Router v6
• hls.js — Adaptive .m3u8 HTTP Live Streaming playback
• livekit-client — Real-time WebRTC camera, microphone, screen sharing, and data channels
• Custom CSS3 — Responsive split-screen layouts, global slide-down alert banners, and native bar charts

Backend

• Node.js & Express.js
• MongoDB & Mongoose — Schemas for Users, Courses, Lessons, Quizzes, QuizSubmissions, Enrollments, and InstructorWallets
• BullMQ & IORedis — Background job queue for asynchronous video processing
• FFmpeg — Video transcoding into HLS segments
• LiveKit Server SDK — Secure room access token generation
• PDFKit — Server-side binary PDF certificate generation

📂 Project Structure
```
LMS_Live_Classes_MERN_Project/
├── backend/
│   ├── features/
│   │   ├── auth/          # Registration, login, JWT token generation
│   │   ├── courses/       # Course CRUD, pagination, lesson uploads, PDF certificates
│   │   ├── live/          # LiveKit WebRTC room token provisioning
│   │   ├── payments/      # Sandbox checkout & instructor revenue analytics
│   │   └── quizzes/       # Dynamic quiz provisioning, auto-grading, submissions
│   ├── middleware/        # JWT authentication & role-based authorization
│   ├── uploads/           # Local storage for raw and HLS-processed video files
│   ├── workers/           # BullMQ + FFmpeg video transcoding worker
│   └── server.js          # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/      # Login & Register views
│   │   │   ├── courses/   # CourseList, CourseDetail, HlsVideoPlayer, AddCourse, CheckoutModal, RevenueDashboard
│   │   │   ├── live/      # LiveClassRoom WebRTC stage (camera/screen share) & real-time chat
│   │   │   └── quizzes/   # Interactive QuizView & PDF certificate download
│   │   ├── App.jsx        # Global routing, Navbar & NotificationContext provider
│   │   └── index.css      # Global design tokens, notification banners & responsive grid rules

```


🔌 API Endpoints Overview


Authentication

• POST /api/auth/register — Register a new Student or Instructor account
• POST /api/auth/login — Authenticate user and receive JWT token

Courses & Certificates

• GET /api/courses?page=1&limit=6 — Get paginated public course catalog
• GET /api/courses/instructor/my-listings?page=1&limit=4 — Get paginated instructor courses
• GET /api/courses/:id — Get course details and verify student enrollment status
• POST /api/courses — Create a new course blueprint (Instructor)
• PUT /api/courses/:id — Update course metadata and Live Class toggle (Instructor)
• POST /api/courses/:id/lessons — Upload video lesson to BullMQ/FFmpeg pipeline (Instructor)
• GET /api/courses/:courseId/certificate — Verify passing quiz score and download A4 PDF certificate

Quizzes & Auto-Grading

• GET /api/quizzes/course/:courseId — Fetch or auto-provision assessment quiz for a course
• POST /api/quizzes/submit — Submit answers for automatic grading and progress logging

Live Classes & Payments

• GET /api/live/token/:courseId — Generate role-based LiveKit WebRTC access token
• POST /api/payments/checkout — Process simulated test-mode payment and unlock course
• GET /api/payments/instructor/revenue — Fetch wallet balance, chart data, and enrollment ledger


🚀 Getting Started


Prerequisites

Ensure the following services are installed and running on your machine:
1. Node.js (v18+ recommended)
2. MongoDB (running locally on mongodb://127.0.0.1:27017 or MongoDB Atlas)
3. Redis Server (running on port 6379 for BullMQ queues)
4. FFmpeg (installed and added to your system PATH)
5. LiveKit Server (binary for local WebRTC signaling & media routing)

1. Clone the Repository
```
bash
git clone https://github.com
cd edustream-lms
```

2. Backend Setup
```
bash
cd backend
npm install
```

Create a .env file inside the backend/ folder:
```
env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lms
JWT_SECRET=supersecretkey123
REDIS_URL=redis://127.0.0.1:6379
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_SERVER_URL=ws://localhost:7880
```

Start the backend server:
```
bash
npm run dev
```


3. Configure & Start LiveKit Server (Local WebRTC)
Create a livekit.yaml file in the same folder as your livekit-server executable:
```
yaml
port: 7880
bind_addresses:
  - 127.0.0.1
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: false
  node_ip: 127.0.0.1
keys:
  devkey: secret
```

Start LiveKit Server in a separate terminal:
```
bash
# Windows PowerShell
.\livekit-server.exe --config livekit.yaml

# macOS / Linux
./livekit-server --config livekit.yaml
```

(Note: On Windows, ensure livekit-server.exe is allowed through Windows Defender Firewall on both Private and Public networks so WebRTC media packets are not blocked.)

4. Frontend Setup
```
bash
cd frontend
npm install
npm run dev
```


🧪 Sandbox Payment Test Cards

When testing student course purchases in Test Mode, use the following simulated card rules:
• Approve Payment: Any 16-digit card number starting with 4000 (e.g., 4000 1234 5678 9010) with any future expiry (12/28) and 3-digit CVV (123).
• Decline Payment: Any 16-digit card number starting with 5000 (e.g., 5000 1234 5678 9010).


📄 License

This project is open-source and available under the MIT License.
