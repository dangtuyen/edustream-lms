const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Automatically add https:// if Render passes only the domain host (e.g. ://onrender.com)
export const API_BASE_URL = rawApiUrl.startsWith('http')
  ? rawApiUrl.replace(/\/$/, '')
  : `https://${rawApiUrl.replace(/\/$/, '')}`;

const rawLiveKitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

export const LIVEKIT_URL =
  rawLiveKitUrl.startsWith('ws://') || rawLiveKitUrl.startsWith('wss://')
    ? rawLiveKitUrl.replace(/\/$/, '')
    : `wss://${rawLiveKitUrl.replace(/\/$/, '')}`;
