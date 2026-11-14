import React, { useState } from 'react';
import './CourseDetail.css';

export default function AddLesson({ courseId, onLessonAdded }) {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ text: '', isError: false });

  const handleFormAction = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      return setStatus({ text: 'Please select a valid video file.', isError: true });
    }

    setUploading(true);
    setStatus({ text: '', isError: false });

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('video', videoFile);

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Video upload failed.');

      setStatus({ text: 'Lesson uploaded! Background FFmpeg transcoding started.', isError: false });
      setTitle('');
      setVideoFile(null);
      e.target.reset();

      if (onLessonAdded) onLessonAdded();
    } catch (err) {
      setStatus({ text: err.message, isError: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-card">
      <h3 className="upload-card-title">➕ Add Lecture Video Module</h3>

      {status.text && (
        <div className={`upload-feedback ${status.isError ? 'error' : ''}`}>
          {status.text}
        </div>
      )}

      <form onSubmit={handleFormAction}>
        <div className="form-group">
          <label>Lecture Chapter Title</label>
          <input
            type="text"
            placeholder="e.g., Chapter 1: Introduction"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Select Video File (.mp4, .mov, .mkv)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={uploading}>
          {uploading ? 'Uploading & Queuing FFmpeg...' : 'Publish Lecture & Transcode'}
        </button>
      </form>
    </div>
  );
}
