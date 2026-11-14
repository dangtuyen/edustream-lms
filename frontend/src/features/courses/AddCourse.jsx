import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../App.jsx';
import { API_BASE_URL } from '../../config/api';

export default function AddCourse() {
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '0', isLive: false });
  const [lessons, setLessons] = useState([]); // Temporary local stack to hold lessons before submission
  const [currentLessonTitle, setCurrentLessonTitle] = useState('');
  const [currentLessonFile, setCurrentLessonFile] = useState(null);
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Handle adding a lesson locally to the list draft matrix
  const handleAddLessonDraft = (e) => {
    e.preventDefault();
    if (!currentLessonTitle.trim()) return;
    if (!currentLessonFile) {
      setError('Please select a video file for your lecture module.');
      return;
    }

    const newLessonDraft = {
      id: Date.now().toString(), // Temporary tracking identifier key
      title: currentLessonTitle,
      file: currentLessonFile,
      filename: currentLessonFile.name
    };

    setLessons([...lessons, newLessonDraft]);
    setCurrentLessonTitle('');
    setCurrentLessonFile(null);
    setError('');
    
    // Clear the native file input element DOM layout
    const fileInput = document.getElementById('lessonFileInput');
    if (fileInput) fileInput.value = '';
  };

  // Remove a lesson draft before publishing
  const handleRemoveLessonDraft = (id) => {
    setLessons(lessons.filter(lesson => lesson.id !== id));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    const token = localStorage.getItem('token');
    try {
      // Step 1: Save the core Course Blueprint framework schema
      const courseRes = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      const courseData = await courseRes.json();
      if (!courseRes.ok) throw new Error(courseData.message || 'Failed to submit course data definitions.');

      // Step 2: Sequentially deploy any attached video lecture assets to BullMQ queue pipelines
      if (lessons.length > 0) {
        for (const lesson of lessons) {
          const lessonFormData = new FormData();
          lessonFormData.append('title', lesson.title);
          lessonFormData.append('video', lesson.file);

          const lessonRes = await fetch(`${API_BASE_URL}/api/courses/${courseData._id}/lessons`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: lessonFormData
          });
          if (!lessonRes.ok) {
            console.error(`Failed to push video segment for chapter: ${lesson.title}`);
          }
        }
      }
      
      showNotification('Course framework and video lectures successfully launched!', 'success');
      navigate('/instructor/courses');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', alignItems: 'start' }}>
      <div className="auth-card" style={{ maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
        
        {/* Left Section: Core Course Information Panel */}
        <div>
          <div className="auth-header-block" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Create Course Blueprint</h2>
            <p style={{ fontSize: '0.9rem' }}>Configure structural metadata profiles and publish streaming rooms.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form id="mainCourseForm" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>Course Program Title</label>
              <input type="text" placeholder="e.g. Masterclass Web RTC Streams" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required />
            </div>
            
            <div className="form-group">
              <label>Detailed Description / Abstract</label>
              <textarea 
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', height: '110px', fontFamily: 'inherit', fontSize: '0.95rem' }} 
                placeholder="Provide structured syllabus overview points..." 
                value={courseForm.description} 
                onChange={e => setCourseForm({...courseForm, description: e.target.value})} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Tuition Entry Price ($ USD)</label>
              <input type="number" min="0" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} required />
            </div>

            <div className="edit-checkbox-row" style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input type="checkbox" id="addPageIsLive" checked={courseForm.isLive} onChange={e => setCourseForm({...courseForm, isLive: e.target.checked})} />
              <label htmlFor="addPageIsLive" style={{ fontSize: '0.9rem', cursor: 'pointer' }}><strong>Enable Live Interactive Classroom Features</strong></label>
            </div>

            <button type="submit" className="btn-submit" disabled={submitting} style={{ marginTop: '1.5rem', padding: '0.85rem' }}>
              {submitting ? 'Deploying Course & Processing Assets...' : 'Publish Course Blueprint'}
            </button>
          </form>
        </div>

        {/* Right Section: Add Lesson Block & Real-time Draft Checklist */}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--bg-dark)' }}>📚 Curriculum Lesson Builder</h3>
          
          {/* Internal Draft Lesson Form Container */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Lecture Chapter Title</label>
              <input type="text" placeholder="e.g. Chapter 1: Network Handshakes" value={currentLessonTitle} onChange={e => setCurrentLessonTitle(e.target.value)} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Select Video File (.mp4, .mov)</label>
              <input id="lessonFileInput" type="file" accept="video/*" onChange={e => setCurrentLessonFile(e.target.files[0])} />
            </div>

            <button type="button" className="btn-secondary" onClick={handleAddLessonDraft} style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', backgroundColor: '#e0e7ff', color: '#4f46e5', borderColor: '#c7d2fe' }}>
              ➕ Append Lecture to Draft list
            </button>
          </div>

          {/* Real-time Draft Syllabus Tracker Feed */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Draft Syllabus Playlist ({lessons.length} modules enqueued)
          </h4>

          {lessons.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No chapters appended yet. Your course can still be published blank.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <strong>{idx + 1}. {lesson.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>📎 {lesson.filename}</span>
                  </div>
                  <button type="button" className="btn-icon-action delete" onClick={() => handleRemoveLessonDraft(lesson.id)} style={{ padding: '0.2rem 0.4rem' }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
