import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

export default function QuizView({ courseId }) {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/quizzes/course/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Only store data if it provides a valid object structure instead of error messages
        if (data && data.questions && Array.isArray(data.questions)) {
          setQuiz(data);
        } else {
          setQuiz(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Quiz loading fetch exception:', err);
        setLoading(false);
      });
  }, [courseId]);

  const handleSelectOption = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const handleQuizSubmit = async () => {
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    // Compile linear chosen sequence array parameters mapping to schema inputs
    const answersArray = Object.keys(quiz.questions).map(idx => selectedAnswers[idx] ?? -1);

    try {
      const res = await fetch(`${API_BASE_URL}/api/quizzes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quizId: quiz._id, answers: answersArray })
      });
      const evaluateData = await res.json();
      setResult(evaluateData);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading state view fallback handler
  if (loading) {
    return <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading test evaluation metrics...</p>;
  }

  // 2. Safe logic checks to handle empty/missing quiz scenarios clean and beautifully
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="quiz-box" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--bg-dark)', marginBottom: '0.5rem' }}>
          📝 Assessment Quiz Portal
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          No quiz setup assigned for this course
        </p>
      </div>
    );
  }

  // 3. Score presentation layout view handler upon evaluation submission
  if (result) {
    const handleDownloadCertificate = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/certificate`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(errData.message || 'Verification rejected.');
          return;
        }

        const fileBlob = await response.blob();
        const localDownloadUrl = window.URL.createObjectURL(fileBlob);
        const anchorNode = document.createElement('a');
        anchorNode.href = localDownloadUrl;
        anchorNode.download = `Certificate-${courseId}.pdf`;
        
        document.body.appendChild(anchorNode);
        anchorNode.click();
        
        document.body.removeChild(anchorNode);
        window.URL.revokeObjectURL(localDownloadUrl);
      } catch (error) {
        console.error('Failed to parse dynamic certificate download requests execution:', error);
      }
    };

    return (
      <div className="quiz-box" style={{ marginTop: '2rem' }}>
        <div className={`result-banner ${result.passed ? 'passed' : 'failed'}`}>
          {result.passed ? '🎉 CONGRATULATIONS! YOU PASSED THE COURSE' : '❌ ASSESSMENT FAILED - TRY AGAIN'}
        </div>
        <h3>Evaluation Summary</h3>
        <p style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Your automated grading score: <strong>{result.score}</strong> out of <strong>{result.totalPoints}</strong> points.
        </p>
        
        {result.passed && (
          <button 
            className="btn-submit" 
            onClick={handleDownloadCertificate}
            style={{ marginTop: '1.5rem', width: '100%', backgroundColor: 'var(--success)', fontSize: '1rem', padding: '0.85rem' }}
          >
            🎓 Claim My PDF Certificate (Download)
          </button>
        )}

        <button className="btn-secondary" style={{ marginTop: '0.75rem', width: '100%', padding: '0.75rem' }} onClick={() => { setResult(null); setSelectedAnswers({}); setCurrentQuestionIndex(0); }}>
          Retake Assessment Quiz
        </button>
      </div>
    );
  }

  // 4. Default structural core view layout containing question cards workflow (ADDED TO RESOLVE MISSING BLOCK)
  const activeQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="quiz-box" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyBackground: 'space-between', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <strong>QUESTION {currentQuestionIndex + 1} OF {quiz.questions.length}</strong>
        <span>Value: {activeQuestion.points || 10} Points</span>
      </div>

      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--bg-dark)' }}>
        {activeQuestion.questionText}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {activeQuestion.options && activeQuestion.options.map((option, idx) => (
          <div
            key={idx}
            className={`quiz-option-card ${selectedAnswers[currentQuestionIndex] === idx ? 'selected' : ''}`}
            onClick={() => handleSelectOption(idx)}
          >
            {option}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button
          className="btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          Previous
        </button>

        {isLastQuestion ? (
          <button 
            className="btn-submit" 
            style={{ width: 'auto' }} 
            disabled={submitting || selectedAnswers[currentQuestionIndex] === undefined} 
            onClick={handleQuizSubmit}
          >
            {submitting ? 'Calculating Grades...' : 'Submit Answers & Grade'}
          </button>
        ) : (
          <button
            className="btn-submit"
            style={{ width: 'auto' }}
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
