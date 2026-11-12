import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HlsVideoPlayer from './HlsVideoPlayer.jsx'; 
import AddLesson from './AddLesson.jsx'; 
import QuizView from '../quizzes/QuizView.jsx'; 
import CheckoutModal from './CheckoutModal.jsx'; 
import './CourseDetail.css'; 

function parseJwt(token) { 
  try {
    const base64Url = token.split('.')[1]; 
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); 
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ); 
    const decoded = JSON.parse(jsonPayload); 
    if (decoded.user && !decoded.role) { decoded.role = decoded.user.role; decoded.name = decoded.user.name; } 
    return decoded; 
  } catch (e) { return null; }
}

export default function CourseDetail() { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 
  const [course, setCourse] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [activeLesson, setActiveLesson] = useState(null); 
  const [showCheckout, setShowCheckout] = useState(false); 

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: 0, isLive: false });
  const [savingCourse, setSavingCourse] = useState(false);

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEditTitle, setLessonEditTitle] = useState('');
  const [lessonEditFile, setLessonEditFile] = useState(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const token = localStorage.getItem('token'); 
  const user = token ? parseJwt(token) : null; 
  const isInstructor = user && String(user.role).toLowerCase() === 'instructor'; 

  const fetchCourseDetailsData = () => { 
    const latestToken = localStorage.getItem('token'); 
    const savedUserStr = localStorage.getItem('user');
    let fallbackUserId = '';
    if (savedUserStr) {
      try {
        const parsedUser = JSON.parse(savedUserStr);
        fallbackUserId = parsedUser.id || parsedUser._id || '';
      } catch (e) {
        console.error(e);
      }
    }

    fetch(`http://localhost:5000/api/courses/${id}?userId=${fallbackUserId}`, {
      method: 'GET',
      headers: latestToken ? { 
        'Authorization': `Bearer ${latestToken}`, 
        'Content-Type': 'application/json' 
      } : {
        'Content-Type': 'application/json' 
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setCourse(data); 
        setCourseForm({
          title: data.title || '',
          description: data.description || '',
          price: data.price || 0,
          isLive: Boolean(data.isLive)
        });

        if (data.isEnrolled) { 
          setShowCheckout(false); 
        }

        if (data.lessons && data.lessons.length > 0) { 
          setActiveLesson((prev) => {
            if (prev) { 
              const updated = data.lessons.find((l) => l._id === prev._id); 
              return updated || data.lessons[0]; 
            } 
            return data.lessons[0]; 
          });
        }
        setLoading(false); 
      })
      .catch((err) => { 
        console.error('Error synchronizing core stream options:', err); 
        setLoading(false); 
      }); 
  };

  useEffect(() => { fetchCourseDetailsData(); }, [id]); 

  const handleSaveCourseEdit = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      if (!res.ok) throw new Error('Failed to update course details');
      setIsEditingCourse(false);
      fetchCourseDetailsData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const startEditingLesson = (e, lesson) => {
    e.stopPropagation();
    setEditingLessonId(lesson._id);
    setLessonEditTitle(lesson.title);
    setLessonEditFile(null);
  };

  const handleUpdateLesson = async (e, lessonId) => {
    e.preventDefault();
    setSavingLesson(true);

    const formData = new FormData();
    formData.append('title', lessonEditTitle);
    if (lessonEditFile) {
      formData.append('video', lessonEditFile);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to update lesson');
      setEditingLessonId(null);
      setLessonEditFile(null);
      fetchCourseDetailsData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (e, lessonId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this video lesson permanently?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete lesson');
      fetchCourseDetailsData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="status-message">Loading classroom environment...</div>; 
  if (!course || course.message) return <div className="status-message error">Course not found.</div>; 

  const rawUrl = activeLesson?.videoUrl || ''; 
  const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`; 
  const fullStreamingMediaUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `http://localhost:5000${cleanPath}`) : ''; 

  return (
    <div className="course-detail-container"> 
      {/* Top Header Banner */}
      <div className="course-detail-header"> 
        <div>
          <span className={`course-badge ${course.isLive ? 'live' : ''}`}>{course.isLive ? '🔴 Live Classroom Active' : '📁 On-Demand Video Course'}</span> 
          <h1 className="course-detail-title">{course.title}</h1> 
          <p className="course-detail-desc">{course.description}</p> 
        </div>

        <div className="header-actions"> 
          {isInstructor && (
            <button className="btn-edit-course" onClick={() => setIsEditingCourse(!isEditingCourse)}>
              {isEditingCourse ? '✖ Close Editor' : '✏️ Edit Course Info'}
            </button>
          )}

          {course.isLive && (course.isEnrolled || isInstructor) && (
            <button className="btn-live-studio" onClick={() => navigate(`/live/room/${course._id}`)}>🎙️ Join Live WebRTC Class</button> 
          )}
        </div>
      </div>

      {isInstructor && isEditingCourse && (
        <div className="edit-panel-card">
          <div className="edit-panel-header">
            <h3>Edit Course Details</h3>
          </div>
          <form onSubmit={handleSaveCourseEdit}>
            <div className="edit-grid-row">
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="edit-textarea"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                required
              />
            </div>

            <div className="edit-checkbox-row">
              <input
                type="checkbox"
                id="editIsLive"
                checked={courseForm.isLive}
                onChange={(e) => setCourseForm({ ...courseForm, isLive: e.target.checked })}
              />
              <label htmlFor="editIsLive">Enable Live WebRTC Classroom</label>
            </div>

            <div className="edit-actions-row">
              <button type="button" className="btn-secondary" onClick={() => setIsEditingCourse(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" style={{ width: 'auto' }} disabled={savingCourse}>
                {savingCourse ? 'Saving...' : 'Save Course Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Two-Column Classroom Grid */}
      <div className="classroom-split-layout"> 
        {/* Left Column: Video Theater & Quiz Module Workspace */}
        <div className="video-theater-container"> 
          
          {course.isEnrolled || isInstructor ? (
            <>
              {activeLesson ? (
                <div className="theater-card"> 
                  {activeLesson.processingStatus === 'completed' && activeLesson.videoUrl ? (
                    <div className="player-aspect-wrapper" style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000' }}> 
                      <HlsVideoPlayer key={fullStreamingMediaUrl} src={fullStreamingMediaUrl} /> 
                    </div>
                  ) : (
                    <div className="transcoding-placeholder"> 
                      <div className="transcoding-spinner"></div> 
                      <h4 className="transcoding-title">{activeLesson.processingStatus === 'failed' ? 'Video Transcoding Failed' : 'Video Transcoding in Progress'}</h4> 
                      <p className="transcoding-subtitle">Pipeline Status: <strong>{String(activeLesson.processingStatus).toUpperCase()}</strong></p> 
                    </div>
                  )}
                  <div className="theater-footer"> 
                    <span className="now-playing-label">Now Playing</span> 
                    <h3 className="active-lesson-title">{activeLesson.title}</h3> 
                  </div>
                </div>
              ) : (
                <div className="empty-theater-card"><h3>No Lessons Uploaded Yet</h3></div> 
              )}

              <QuizView courseId={course._id} /> 
            </>
          ) : (
            <div className="empty-theater-card" style={{ padding: '6rem 2rem', background: '#ffffff' }}>
              <span style={{ fontSize: '3rem' }}>🔒</span>
              <h3 style={{ marginTop: '1rem', fontSize: '1.4rem' }}>Classroom Framework Locked</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>You must enroll and complete the simulation tuition verification processing parameters to access lectures.</p>
              <button
                className="btn-submit"
                style={{ width: 'auto', padding: '0.75rem 2rem' }}
                onClick={() => {
                  if (!token) {
                    navigate('/login');
                  } else {
                    setShowCheckout(true);
                  }
                }}
              >
                Unlock This Course Content Immediately
              </button>
            </div>
          )}
        </div>

        <div className="classroom-sidebar"> 
          <div className="syllabus-card"> 
            <div className="syllabus-header"> 
              <h3>📚 Course Syllabus</h3> 
              <span className="syllabus-count">{course.lessons?.length || 0} Lessons</span> 
            </div>

            {course.lessons && course.lessons.length > 0 ? (
              <div className="syllabus-list"> 
                {course.lessons.map((lesson, idx) => {
                  const isSelected = activeLesson?._id === lesson._id; 
                  const isReady = lesson.processingStatus === 'completed'; 
                  const isEditingThis = editingLessonId === lesson._id;

                  return (
                    <div key={lesson._id}>
                      <div
                        onClick={() => (course.isEnrolled || isInstructor) && setActiveLesson(lesson)} 
                        className={`syllabus-item ${isSelected ? 'selected' : ''}`}
                        style={{ opacity: (course.isEnrolled || isInstructor) ? 1 : 0.6, cursor: (course.isEnrolled || isInstructor) ? 'pointer' : 'not-allowed' }}
                      >
                        <span className="syllabus-item-title">{idx + 1}. {lesson.title}</span> 
                        
                        <div className="syllabus-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`lesson-status-pill ${isReady ? 'ready' : ''}`}>{isReady ? 'VOD Ready' : lesson.processingStatus}</span> 
                          
                          {isInstructor && (
                            <>
                              <button type="button" className="btn-icon-action" title="Edit lesson title or replace video" onClick={(e) => startEditingLesson(e, lesson)}>✏️</button>
                              <button type="button" className="btn-icon-action delete" title="Delete lesson" onClick={(e) => handleDeleteLesson(e, lesson._id)}>🗑️</button>
                            </>
                          )}
                        </div>
                      </div>

                      {isInstructor && isEditingThis && (
                        <form className="lesson-edit-box" onSubmit={(e) => handleUpdateLesson(e, lesson._id)} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid var(--primary)', borderRadius: '8px', marginTop: '0.5rem' }}>
                          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem' }}>Lesson Title</label>
                            <input type="text" value={lessonEditTitle} onChange={(e) => setLessonEditTitle(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem' }}>Replace Video File (Optional)</label>
                            <input type="file" accept="video/*" onChange={(e) => setLessonEditFile(e.target.files)} />
                          </div>
                          <div className="edit-actions-row" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setEditingLessonId(null)}>Cancel</button>
                            <button type="submit" className="btn-submit" style={{ width: 'auto', marginTop: 0, padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} disabled={savingLesson}>
                              {savingLesson ? 'Updating...' : 'Update Lesson'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="syllabus-empty-text">Syllabus list is currently empty.</p> 
            )}
          </div>

          {isInstructor && <AddLesson courseId={course._id} onLessonAdded={fetchCourseDetailsData} />} 
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal 
          course={course} 
          onClose={() => setShowCheckout(false)} 
          onPaymentSuccess={fetchCourseDetailsData} 
        />
      )}
    </div>
  );
}
