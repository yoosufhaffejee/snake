# Snake Multiplayer (WebRTC)

A modern, responsive, and completely serverless multiplayer remake of the classic Snake game. 

Play locally, over a LAN, or globally across the internet with up to 8 players simultaneously. Hosted entirely on GitHub pages with zero backend servers required!

## Features

### 🌐 Serverless Global Multiplayer
* **Powered by PeerJS (WebRTC):** Play over the internet globally or locally on the same Wi-Fi/Hotspot without needing a dedicated backend server.
* **Jackbox-Style Room Codes:** Easy 4-character room IDs (e.g., `A7X9`) make joining on mobile devices a breeze.
* **Mixed Co-op:** The host can add multiple local players to a single keyboard while remote friends join from their phones simultaneously!
* **Drop-in / Drop-out:** Friends can connect mid-game. If enabled, they spawn instantly; if disabled, they spectate the live match from a seamless "Waiting Room" overlay until the next round.
* **Death Drops:** If a remote player disconnects, their snake explodes into a shower of apples for the survivors to eat.

### 🎮 Gameplay Mechanics
* **Universal "Ready Up" System:** At the start of a round or after unpausing, the game enters perfect stasis. Players can safely lock in their starting directions, and the game only commences the exact millisecond *everyone* is ready.
* **Dynamic Settings:** The Host can adjust Game Speed, toggle Solid Walls, change the Winning Score, and toggle Mid-Game Joins on the fly. Settings are strictly locked out for clients to ensure fairness.

### 📱 Responsive & Mobile-Ready
* **Touch-Optimized:** Mobile users can play via intuitive screen-swiping or an optional on-screen virtual D-Pad.
* **Smart UI:** Mobile browsers automatically block annoying pull-to-refresh scrolling. The "Add Local Snake" button intelligently hides itself on touch devices.
* **Professional Overlays:** Beautiful HTML/CSS modals for lobbies, settings, and Game Over screens ensuring perfect centering and readability across all device sizes.

## How to Play

1. **Host a Game:** Click "Start / Host Game". You will be given a 4-letter Room ID. You are automatically Player 1 (use Arrow Keys or WASD).
2. **Join a Game:** On a phone or another PC, enter the Room ID and click "Join Game".
3. **Add Local Players:** If playing with friends on the same computer, the Host can click "Add Local Snake" to bind new keys for Player 2, Player 3, etc.

## Technologies Used
* **HTML5 Canvas:** For raw game rendering at 60fps.
* **Vanilla JavaScript:** Zero heavy frameworks.
* **PeerJS (WebRTC):** Handles the P2P connection handshake via their free cloud signaling server, enabling true serverless online play.
