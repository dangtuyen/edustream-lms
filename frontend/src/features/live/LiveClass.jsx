import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { API_BASE_URL, LIVEKIT_URL } from '../../config/api';

function LiveClass() {
  const { roomName } = useParams();
  const [token, setToken] = useState(null);
  const userToken = useSelector(state => state.auth.token);

  useEffect(() => {
    if (userToken) {
      axios.get(`${API_BASE_URL}/api/live/token?roomName=${roomName}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      }).then(res => setToken(res.data.token));
    }
  }, [roomName, userToken]);

  if (!token) return <div>Authenticating LiveKit WebRTC Session... Please Sign In first.</div>;

  return (
    <div style={{ height: '80vh' }}>
      <h3>Room: {roomName}</h3>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={LIVEKIT_URL}
        data-lk-theme="default"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
export default LiveClass;
