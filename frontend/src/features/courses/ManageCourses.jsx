import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CourseDetail.css';

export default function ManageCourses() {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/courses/instructor/my-listings?page=${currentPage}&limit=4`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMyCourses(Array.isArray(data.courses) ? data.courses : []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load instructor listings:', err);
        setLoading(false);
      });
  }, [currentPage]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Instructor Dashboard: Management Portal</h1>
        <Link to="/instructor/add-course" className="nav-btn-register" style={{ textDecoration: 'none' }}>
          Create Another Course
        </Link>
      </div>

      {loading ? (
        <p>Loading your catalog parameters...</p>
      ) : myCourses.length === 0 ? (
        <div className="empty-theater-card" style={{ width: '100%' }}>
          <h3>No courses created yet</h3>
        </div>
      ) : (
        <>
          <div className="course-grid">
            {myCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-content">
                  <span className={`course-badge ${course.isLive ? 'live' : ''}`}>
                    {course.isLive ? 'Active Live Studio' : 'VOD Course'}
                  </span>
                  <h3 className="course-title" style={{ marginTop: '0.5rem' }}>{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-footer">
                    <span className="course-price">${course.price}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {course.lessons?.length || 0} Lessons
                      </span>
                      <button 
                        className="btn-submit" 
                        style={{ width: 'auto', padding: '0.45rem 1rem', marginTop: 0, fontSize: '0.85rem' }}
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        View Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructor Catalog Pagination Dashboard Navigation Bar Layout */}
          {pagination.pages > 1 && (
            <div className="pagination-wrapper">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                ← Previous
              </button>
              
              <span className="pagination-text">Page {currentPage} of {pagination.pages}</span>

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
