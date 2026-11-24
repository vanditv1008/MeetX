# MeetX — Full-Stack Real-Time Video Conferencing Platform

MeetX is a modern, high-performance video conferencing application inspired by Google Meet. It combines native **WebRTC** peer-to-peer media streaming with **Socket.IO** real-time signaling, **Neon PostgreSQL** serverless storage, and **Clerk** authentication to deliver low-latency video calls, screen sharing, in-meeting chat, participant management, and in-browser call recording.

---

## Table of Contents

- [Motivation & Problem Statement](#motivation--problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
  - [WebRTC Signaling Flow](#webrtc-signaling-flow)
  - [Database Schema](#database-schema)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Environment Variables](#environment-variables)
- [Getting Started Locally](#getting-started-locally)
- [REST API Reference](#rest-api-reference)
- [Socket.IO Events](#socketio-events)
- [System Design & Interview Highlights](#system-design--interview-highlights)

---

## Motivation & Problem Statement

### Why MeetX was built
Remote communication platforms often suffer from high server resource consumption, privacy concerns associated with centralized media routing, and friction caused by required software installations. 

MeetX was developed to address these challenges:
1. **Decentralized Media Transmission**: Uses browser-native WebRTC to stream encrypted audio and video directly between participants, minimizing server bandwidth.
2. **Instant Browser Access**: Runs entirely in modern browsers with zero plugins or desktop downloads required.
3. **Friction-Free Meeting Creation**: Allows instantaneous meeting creation, shareable short-links, and unique room identifiers (`abc-def-ghi`).
4. **Complete Audit Trail**: Automatically logs meeting duration, participant join/leave times, and chat transcripts for later review.

---

## Key Features

- **Peer-to-Peer HD Audio & Video**: Full camera and microphone controls with real-time mute/unmute status indicators.
- **Dynamic Screen Sharing**: Swap video sources on the fly using `navigator.mediaDevices.getDisplayMedia` and WebRTC sender track replacement (`replaceTrack`).
- **Real-Time In-Meeting Chat**: Persistent text messaging synchronized via WebSockets and stored in PostgreSQL for post-meeting review.
- **Live Non-Verbal Interaction**:
  - **Raise Hand**: Toggle hand raises with visual badges and participant notifications.
  - **Floating Reactions**: Animated floating emoji reactions (`🎉`, `❤️`, `👍`, `😂`, `🔥`, `🚀`).
- **In-Browser Meeting Recording**: Client-side recording of video and audio streams using the native `MediaRecorder` API, generating downloadable `.webm` files with zero server processing cost.
- **Audio & Video Device Preferences**: Settings modal to select input/output hardware devices and toggle AI noise suppression.
- **Meeting Sessions & Transcripts**: Historical dashboard displaying previous meetings, duration, attendee lists, and full chat transcripts.
- **Enterprise-Grade Authentication**: Managed Clerk authentication with session tokens, protected API middleware, and automated user synchronization.
- **Plan Limits & Capacity Management**: Tiered meetings allocation (Free: 30 meetings/month and up to 10 participants; Premium: unlimited meetings and up to 100 participants).

---

## System Architecture

### WebRTC Signaling Flow

```
+---------------+              +--------------------+              +---------------+
|    Peer A     |              | Express + Socket.IO|              |    Peer B     |
+---------------+              +--------------------+              +---------------+
        |                                |                                 |
        |--- 1. join-room(roomId) ------>|                                 |
        |                                |<--- 2. join-room(roomId) -------|
        |                                |                                 |
        |<-- 3. all-users (Peer B info) -|                                 |
        |                                |-- 4. user-joined (Peer A info)->|
        |                                |                                 |
        |--- 5. offer (SDP) ------------>|--- 5. forward offer (SDP) ----->|
        |                                |                                 |
        |<-- 6. forward answer (SDP) ----|<-- 6. answer (SDP) -------------|
        |                                |                                 |
        |<=> 7. ICE Candidate Exchange <=|<=> 7. ICE Candidate Exchange <=|
        |                                |                                 |
        |==================================================================|
        |      8. Direct Encrypted P2P Media Stream (SRTP / WebRTC)        |
        |==================================================================|
```

1. **Signaling Phase**: Peers connect to the Socket.IO server to discover one another and exchange Session Description Protocol (SDP) offers, answers, and ICE network candidates using public Google STUN servers (`stun.l.google.com:19302`).
2. **Peer Connection Phase**: Once ICE candidates match, direct encrypted SRTP peer-to-peer data pipes are opened between clients. Media does not pass through the Node.js server.

### Database Schema

MeetX uses a normalized PostgreSQL schema hosted on **Neon Serverless**:

```sql
-- Users synced from Clerk
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    image VARCHAR(500),
    plan VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Rooms
CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) DEFAULT 'Instant Meeting',
    description TEXT,
    host_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    ended_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    duration INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Attendees Log
CREATE TABLE meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ
);

-- Persistent Meeting Messages
CREATE TABLE meeting_messages (
    id SERIAL PRIMARY KEY,
    meeting_id INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 |
| **Routing & Styling** | React Router v7, Tailwind CSS v4, Lucide React, React Hot Toast |
| **Real-Time Client** | Socket.IO Client v4, WebRTC (`RTCPeerConnection`, `MediaRecorder`) |
| **Backend Runtime** | Node.js, Express v5, HTTP Server |
| **WebSockets** | Socket.IO v4 Server |
| **Database** | Neon Serverless PostgreSQL (`@neondatabase/serverless`) |
| **Authentication** | Clerk (`@clerk/react`, `@clerk/express`, Clerk Webhooks) |
| **HTTP Client** | Axios (with automated Clerk JWT request interceptors) |

---

## Project Directory Structure

```
MeetX/
├── client-frontend/
│   ├── public/                      # Static assets (logo, backgrounds, favicon)
│   ├── src/
│   │   ├── assets/                  # Mock datasets and static assets
│   │   ├── components/
│   │   │   ├── meeting/
│   │   │   │   ├── ChatPanel.jsx         # In-meeting real-time chat panel
│   │   │   │   ├── ControlBar.jsx        # Audio/video/screen share action bar
│   │   │   │   ├── NewMeetingModal.jsx   # Create meeting dialog modal
│   │   │   │   ├── ParticipantList.jsx   # Participant drawer & status list
│   │   │   │   ├── ReactionsOverlay.jsx  # Floating emoji reaction animations
│   │   │   │   ├── SettingsModal.jsx     # Device switching & audio filters
│   │   │   │   ├── VideoGrid.jsx         # Dynamic responsive video layout
│   │   │   │   └── VideoTile.jsx         # Individual attendee video frame
│   │   │   ├── sessions/
│   │   │   │   ├── EmptySessions.jsx     # Zero-state placeholder
│   │   │   │   ├── SessionCard.jsx       # Historical meeting session card
│   │   │   │   ├── SessionChatTab.jsx    # Session transcript viewer
│   │   │   │   ├── SessionDetailModal.jsx# Session inspection modal
│   │   │   │   └── SessionParticipantTab.jsx # Session attendee logs
│   │   │   ├── Footer.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedLayout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── config/
│   │   │   ├── api.js               # Axios instance with Clerk JWT interceptor
│   │   │   └── socket.js            # Socket.IO client instance
│   │   ├── hooks/
│   │   │   ├── useChat.js           # Chat message state & socket listeners
│   │   │   ├── useRecording.js      # MediaRecorder screen capture hook
│   │   │   └── useWebRTC.js         # Peer connection lifecycle & signaling
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Home dashboard with meeting stats
│   │   │   ├── Login.jsx            # Clerk sign-in / sign-up routing
│   │   │   ├── MeetingRoom.jsx      # Video conference main view
│   │   │   ├── Pricing.jsx          # Plan upgrades via Clerk PricingTable
│   │   │   └── Sessions.jsx         # Meeting history & logs
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server-backend/
    ├── config/
    │   └── db.js                    # Neon connection & schema table setup
    ├── controllers/
    │   ├── meetingController.js     # Meetings CRUD, stats & session detail APIs
    │   └── webhookController.js     # Clerk user sync webhook handler
    ├── middleware/
    │   └── auth.js                  # Clerk JWT validation & auto-provisioning
    ├── routes/
    │   └── meetingRoutes.js         # Meeting route definitions
    ├── package.json
    ├── server.js                    # Express app & HTTP listener setup
    └── socket.js                    # Socket.IO rooms, signaling, & event handlers
```

---

## Environment Variables

### 1. Backend (`server-backend/.env`)
```env
PORT=3000
ORIGINS="http://localhost:5173,http://localhost:3000"

# Neon PostgreSQL Connection URL
DATABASE_URL='postgresql://<user>:<password>@<host>/<dbname>?sslmode=require'

# Clerk Authentication Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

### 2. Frontend (`client-frontend/.env`)
```env
# Backend API Base URL
VITE_BASE_URL="http://localhost:3000"

# Clerk Publishable Key (matches backend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/MeetX.git
cd MeetX
```

### Step 2: Install dependencies
In the root directory, install dependencies for both frontend and backend:
```bash
cd server-backend
npm install

cd ../client-frontend
npm install
```

### Step 3: Run the Backend Server
From `server-backend/`:
```bash
npm run server
```
The server will connect to Neon PostgreSQL, initialize database tables if they do not exist, and listen at `http://localhost:3000`.

### Step 4: Run the Frontend Application
In a separate terminal, navigate to `client-frontend/`:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <clerk_session_token>` header, automatically injected by the frontend Axios interceptor.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | API health check (`"API is live!"`) |
| `POST` | `/api/meetings` | Protected | Create a new instant or scheduled meeting room |
| `GET` | `/api/meetings/stats` | Protected | Fetch current calendar month usage & plan limits |
| `GET` | `/api/meetings/sessions` | Protected | List historical meeting sessions for current user |
| `GET` | `/api/meetings/sessions/:id` | Protected | Retrieve full details, participants, and chat logs for a session |
| `GET` | `/api/meetings/:meetingId` | Protected | Retrieve active meeting room details before joining |
| `GET` | `/api/meetings/:meetingId/messages` | Protected | Load message history for a meeting room |
| `POST` | `/api/clerk` | Public | Webhook endpoint for Clerk user lifecycle events |

---

## Socket.IO Events

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client -> Server | `{ roomId, user, audioEnabled, videoEnabled }` | Request to enter a meeting room |
| `all-users` | Server -> Client | `[ participantObjects ]` | Sends existing room attendees to a newcomer |
| `user-joined` | Server -> Room | `participantObject` | Notifies active attendees of a new peer |
| `offer` | Bidirectional | `{ targetSocketId, callerSocketId, sdp, callerUser }` | WebRTC SDP offer |
| `answer` | Bidirectional | `{ targetSocketId, responderSocketId, sdp }` | WebRTC SDP answer |
| `ice-candidate`| Bidirectional | `{ targetSocketId, senderSocketId, candidate }` | WebRTC ICE connectivity candidate |
| `toggle-audio` | Client -> Server | `{ roomId, audioEnabled }` | Broadcasts microphone status change |
| `toggle-video` | Client -> Server | `{ roomId, videoEnabled }` | Broadcasts camera status change |
| `send-message` | Client -> Server | `{ roomId, message }` | Transmits & persists a chat message |
| `receive-message`| Server -> Room | `chatMessageObject` | Emits chat message to all room members |
| `raise-hand` | Client -> Server | `{ roomId, userId, userName, isHandRaised }` | Broadcasts hand raise state |
| `send-reaction`| Client -> Server | `{ roomId, emoji, userName }` | Broadcasts floating emoji reaction |
| `toggle-screen-share` | Client -> Server | `{ roomId, isSharing }` | Notifies peers of screen share start/stop |
| `end-meeting` | Client -> Server | `{ roomId }` | Host terminates meeting for all attendees |
| `user-left` | Server -> Room | `{ socketId, user }` | Notifies peers when an attendee leaves |

---

## System Design & Interview Highlights

### 1. WebRTC Mesh Architecture vs. SFU
- **Why Mesh was chosen**: MeetX employs a Full Mesh topology where each peer establishes direct connections to every other peer ($N-1$ outbound streams). For small team calls (2–6 people), this eliminates the need for expensive dedicated media servers (like Kurento, Janus, or MediaSoup) and maintains zero server bandwidth consumption for media.
- **Scaling Trade-Off**: For enterprise broadcasts (50+ participants), client CPU and uplink bandwidth scale at $\mathcal{O}(N)$. In production enterprise settings, this can transition to a **Selective Forwarding Unit (SFU)** where clients upload once to a media server that forwards packets down to peers.

### 2. Seamless Screen Sharing via Track Replacement
Instead of tearing down peer connections and renegotiating new SDP offers/answers when starting a screen share, MeetX uses `RTCRtpSender.replaceTrack()`:
```javascript
const screenVideoTrack = screenStream.getVideoTracks()[0];
peer.getSenders().forEach((sender) => {
  if (sender.track && sender.track.kind === "video") {
    sender.replaceTrack(screenVideoTrack);
  }
});
```
This enables instantaneous switching between webcam and screen feed with zero disruption to the active audio or data connections.

### 3. Client-Side Zero-Cost Meeting Recording
Rather than recording video on the server using headless Chrome instances or FFmpeg ingest pipelines, MeetX uses the browser's native `MediaRecorder` API to capture display and audio streams directly on the client, assembling a standard `.webm` file that downloads directly to the user's filesystem upon completion.

---

## License

This project is licensed under the [ISC License](LICENSE).
