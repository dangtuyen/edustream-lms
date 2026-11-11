import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseDetail.css';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Dispatches request appending active target page query parameters
    fetch(`http://localhost:5000/api/courses?page=${currentPage}&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading courses catalog profiles:', err);
        setLoading(false);
      });
  }, [currentPage]);

  if (loading) return <div className="status-message">Loading catalog blueprint options...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Explore Catalog</h1>
          <p className="dashboard-subtitle">Discover professional multi-choice curricula and live WebRTC interactive classrooms.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-theater-card" style={{ width: '100%' }}>
          <h3>No courses available within this section view</h3>
        </div>
      ) : (
        <>
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-content">
                  <div className="badge-row">
                    <span className={`course-badge ${course.isLive ? 'live' : ''}`}>
                      {course.isLive ? '🔴 Live Class' : '📁 VOD Course'}
                    </span>
                  </div>
                  
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-instructor">
                    <span>👤 By: </span>
                    <strong>{course.instructor?.name || 'Senior Instructor'}</strong>
                  </div>

                  <div className="course-footer">
                    <span className="course-price">${course.price || '0'}</span>
                    <button className="btn-submit" onClick={() => navigate(`/courses/${course._id}`)}>
                      View Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Centralized Pagination Control Navigation System Matrix */}
          {pagination.pages > 1 && (
            <div className="pagination-wrapper">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                ← Previous
              </button>
              
              {Array.from({ length: pagination.pages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                className="pagination-btn" 
                disabled={currentPage === pagination.pages} 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
