import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './features/auth/Login'; 
import Register from './features/auth/Register';
import CourseList from './features/courses/CourseList';
import ManageCourses from './features/courses/ManageCourses';
import AddCourse from './features/courses/AddCourse';
import CourseDetail from './features/courses/CourseDetails';
import LiveClassRoom from './features/live/LiveClassRoom.jsx';
import RevenueDashboard from './features/courses/RevenueDashboard.jsx';

// Establish an application-wide message distribution channel
const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (decoded.user && !decoded.role) {
      decoded.role = decoded.user.role;
      decoded.name = decoded.user.name;
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = token ? parseJwt(token) : null;
  const { showNotification } = useNotification();

  const handleLogout = () => {
    localStorage.removeItem('token');
    showNotification('Logged out successfully.', 'success');
    navigate('/login');
  };

  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        <Link to="/courses" className="navbar-brand">
          <span className="brand-icon">🎓</span> EduStream LMS
        </Link>
        <div className="navbar-links">
          <Link to="/courses" className="nav-item">Explore Catalog</Link>
          {user ? (
            <>
              {String(user.role).toLowerCase() === 'instructor' && (
                <>
                  <Link to="/instructor/courses" className="nav-item" style={{ color: '#60a5fa', fontWeight: 'bold' }}>💻 Manage My Courses</Link>
                  <Link to="/instructor/add-course" className="nav-item" style={{ color: '#34d399', fontWeight: 'bold' }}>➕ Create Course</Link>
                  <Link to="/instructor/revenue" className="nav-item" style={{ color: '#fbbf24', fontWeight: 'bold' }}>💰 Revenue Ledger</Link>
                </>
              )}
              <span className="nav-item-profile" style={{ color: '#f8fafc', borderLeft: '1px solid #475569', paddingLeft: '12px' }}>
                👤 {user.name || 'Active User'} ({user.role})
              </span>
              <button onClick={handleLogout} className="nav-btn-login" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 'bold' }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn-login">Sign In</Link>
              <Link to="/register" className="nav-btn-register">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const [notification, setNotification] = useState({ message: '', type: 'success', active: false });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, active: true });
  };

  useEffect(() => {
    if (!notification.active) return;
    const autoCloseTimer = setTimeout(() => {
      setNotification((prev) => ({ ...prev, active: false }));
    }, 4000); // Automatically unmount banner state parameters after 4 seconds
    return () => clearTimeout(autoCloseTimer);
  }, [notification.active]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <BrowserRouter>
        <Navbar />
        
        {/* Render the refined modular alert layout placeholder seamlessly */}
        <div className={`global-notification-banner ${notification.type} ${notification.active ? 'active' : ''}`}>
          <span>{notification.type === 'success' ? '✅' : '❌'} {notification.message}</span>
          <button className="banner-close-btn" onClick={() => setNotification((prev) => ({ ...prev, active: false }))}>×</button>
        </div>

        <main className="main-content-layout">
          <Routes>
            <Route path="/" element={<Navigate to="/courses" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/instructor/courses" element={<ManageCourses />} />
            <Route path="/instructor/add-course" element={<AddCourse />} />
            <Route path="/live/room/:courseId" element={<LiveClassRoom />} />
            <Route path="/instructor/revenue" element={<RevenueDashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </NotificationContext.Provider>
  );
}
