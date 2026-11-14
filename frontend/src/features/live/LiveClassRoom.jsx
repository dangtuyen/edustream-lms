import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, VideoPresets } from 'livekit-client';
import './LiveClassRoom.css';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.user ? decoded.user : decoded;
  } catch (e) {
    return null;
  }
}

export default function LiveClassRoom() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const roomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [instructorTrack, setInstructorTrack] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);

  const token = localStorage.getItem('token');
  const currentUser = token ? parseJwt(token) : null;
  const isInstructor =
    currentUser &&
    (String(currentUser.role).toLowerCase() === 'instructor' ||
      String(currentUser.role).toLowerCase() === 'admin');

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;
    let currentRoom = null;

    const initLiveRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/live/token/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (isCancelled) return;

        const livekitRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: { resolution: VideoPresets.h720.resolution }
        });

        livekitRoom.on(RoomEvent.TrackSubscribed, (track) => {
          if (!isCancelled && track.kind === 'video') {
            setInstructorTrack(track);
          }
        });

        livekitRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
          if (!isCancelled && track.kind === 'video') {
            setInstructorTrack(null);
          }
        });

        livekitRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (!isCancelled && publication.track && publication.track.kind === 'video') {
            setInstructorTrack(publication.track);
          }
        });

        livekitRoom.on(RoomEvent.DataReceived, (payload, participant) => {
          if (isCancelled) return;
          const textDecoder = new TextDecoder();
          const messageText = textDecoder.decode(payload);
          setMessages((prev) => [
            ...prev,
            {
              sender: participant?.name || 'Class member',
              text: messageText,
              isMe: false
            }
          ]);
        });

        await livekitRoom.connect(data.serverUrl, data.token, {
          autoSubscribe: true
        });

        if (isCancelled) {
          livekitRoom.disconnect();
          return;
        }

        currentRoom = livekitRoom;
        roomRef.current = livekitRoom;

        if (isInstructor) {
          try {
            await livekitRoom.localParticipant.setCameraEnabled(true);
            await livekitRoom.localParticipant.setMicrophoneEnabled(true);

            const videoPubs = Array.from(
              livekitRoom.localParticipant.videoTrackPublications.values()
            );
            if (videoPubs[0] && videoPubs[0].track) {
              setInstructorTrack(videoPubs[0].track);
            }
          } catch (camErr) {
            console.error('Failed to open camera:', camErr);
            setCameraError(camErr.message || 'Cannot access Camera/Microphone on your computer.');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('LiveKit connection error:', err);
        }
      }
    };

    initLiveRoom();

    return () => {
      isCancelled = true;
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [courseId, token, isInstructor]);

  useEffect(() => {
    if (instructorTrack && videoRef.current) {
      instructorTrack.attach(videoRef.current);
      videoRef.current.play().catch((e) => console.warn('Autoplay bypass:', e.message));
    }
  }, [instructorTrack]);

  const handleManualEnableCamera = async () => {
    const activeRoom = roomRef.current;
    if (!activeRoom) return;
    setCameraError('');
    try {
      await activeRoom.localParticipant.setCameraEnabled(true);
      await activeRoom.localParticipant.setMicrophoneEnabled(true);
      const videoPubs = Array.from(
        activeRoom.localParticipant.videoTrackPublications.values()
      );
      if (videoPubs[0] && videoPubs[0].track) {
        setInstructorTrack(videoPubs[0].track);
      }
    } catch (err) {
      setCameraError(err.message || 'Camera is blocked or your computer has no webcam.');
    }
  };

  const handleManualShareScreen = async () => {
    const activeRoom = roomRef.current;
    if (!activeRoom) return;
    setCameraError('');
    try {
      await activeRoom.localParticipant.setScreenShareEnabled(true);
      const videoPubs = Array.from(
        activeRoom.localParticipant.videoTrackPublications.values()
      );
      if (videoPubs[0] && videoPubs[0].track) {
        setInstructorTrack(videoPubs[0].track);
      }
    } catch (err) {
      setCameraError(err.message || 'Cannot share screen.');
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    const activeRoom = roomRef.current;
    if (!chatInput.trim() || !activeRoom) return;

    const textEncoder = new TextEncoder();
    const dataBuffer = textEncoder.encode(chatInput);
    activeRoom.localParticipant.publishData(dataBuffer, { reliable: true });

    const myName = activeRoom.localParticipant.name || 'You';
    setMessages((prev) => [...prev, { sender: myName, text: chatInput, isMe: true }]);
    setChatInput('');
  };

  return (
    <div className="live-room-container">
      <div
        className="course-detail-header"
        style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1 className="course-detail-title">🎙️ Active Studio Interactive Broadcast Classroom</h1>
          <p className="course-detail-desc">Powered by pure ultra-low latency WebRTC protocols infrastructure stacks.</p>
        </div>
        <button className="btn-secondary" style={{ width: 'auto', padding: '0.6rem 1.25rem' }} onClick={() => navigate(-1)}>
          ← Return to VOD Hub
        </button>
      </div>

      <div className="live-grid-split">
        <div className="video-stage-wrapper">
          {instructorTrack ? (
            <video ref={videoRef} autoPlay playsInline muted={true} className="instructor-video-frame" />
          ) : (
            <div className="offline-notice-screen">
              <div
                className="transcoding-spinner"
                style={{ borderTopColor: '#f43f5e', width: '50px', height: '50px', marginBottom: '1.5rem' }}
              ></div>
              <h2>Classroom Studio Currently Offline</h2>
              <p>The instructor has not initialized the real-time audiovisual capture stream arrays yet.</p>

              {cameraError && (
                <p style={{ color: '#f87171', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  ⚠️ {cameraError}
                </p>
              )}

              {isInstructor && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={handleManualEnableCamera}
                    className="btn-submit"
                    style={{ width: 'auto', marginTop: 0, padding: '0.7rem 1.5rem', backgroundColor: '#ef4444' }}
                  >
                    🎥 Turn on camera
                  </button>
                  <button
                    type="button"
                    onClick={handleManualShareScreen}
                    className="btn-submit"
                    style={{ width: 'auto', marginTop: 0, padding: '0.7rem 1.5rem', backgroundColor: '#3b82f6' }}
                  >
                    🖥️ Share screen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="live-chat-panel">
          <div className="chat-panel-header">💬 Live Classroom Chat Room</div>

          <div className="chat-messages-scroll-area">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble-row ${msg.isMe ? 'me' : ''}`}>
                <span className="chat-user-meta" style={{ alignSelf: msg.isMe ? 'flex-end' : 'flex-start' }}>
                  {msg.sender}
                </span>
                <p className="chat-bubble-text">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChatMessage} className="chat-input-form">
            <input
              type="text"
              placeholder="Type an interactive query to the stream room..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              required
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
