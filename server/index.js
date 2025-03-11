const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Enable port for Render.com
const PORT = process.env.PORT || 8080;

// Add keep-alive ping to prevent disconnections
const PING_INTERVAL = 30000; // 30 seconds

const wss = new WebSocket.Server({ 
  port: PORT,
  // Add heartbeat
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Game rooms storage
const rooms = new Map();

// Player connections
const connections = new Map();

class GameRoom {
  constructor() {
    this.id = uuidv4().substring(0, 6).toUpperCase(); // Shorter, friendlier room codes
    this.players = new Map();
    this.status = 'waiting';
    this.currentRound = 1;
    this.marketCondition = 'BULL';
    this.maxPlayers = 30;
  }

  addPlayer(playerId, playerName) {
    if (this.players.size >= this.maxPlayers) return false;
    
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      currentClicks: 0,
      totalBankedClicks: 0,
      isPopped: false
    });
    
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.players.size === 0) {
      rooms.delete(this.id);
    }
  }

  handlePlayerAction(playerId, action) {
    const player = this.players.get(playerId);
    if (!player) return;

    switch (action.type) {
      case 'balloon_click':
        player.currentClicks++;
        // Calculate pop chance based on clicks
        const popChance = 0.05 + (Math.pow(player.currentClicks, 2) * 0.001);
        if (Math.random() < popChance) {
          player.isPopped = true;
          player.currentClicks = 0;
        }
        break;
      
      case 'bank_clicks':
        if (!player.isPopped && player.currentClicks > 0) {
          player.totalBankedClicks += player.currentClicks;
          player.currentClicks = 0;
          player.isPopped = false;
        }
        break;
    }

    this.broadcastGameState();
  }

  broadcastGameState() {
    const gameState = {
      id: this.id,
      status: this.status,
      currentRound: this.currentRound,
      marketCondition: this.marketCondition,
      players: Array.from(this.players.values())
    };

    this.players.forEach((_, playerId) => {
      const conn = connections.get(playerId);
      if (conn && conn.readyState === WebSocket.OPEN) {
        try {
          conn.send(JSON.stringify({
            type: 'game_state',
            payload: gameState
          }));
        } catch (err) {
          console.error('Failed to send game state:', err);
        }
      }
    });
  }

  endGame() {
    this.status = 'complete';
    this.broadcastGameState();
  }
}

// Add heartbeat system
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  const playerId = uuidv4();
  connections.set(playerId, ws);

  // Send initial connection success
  try {
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { playerId }
    }));
  } catch (err) {
    console.error('Failed to send connection message:', err);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      let room;

      switch (data.type) {
        case 'create_room':
          if (!data.payload?.playerName) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Player name is required' }
            }));
            return;
          }

          room = new GameRoom();
          room.addPlayer(playerId, data.payload.playerName);
          rooms.set(room.id, room);
          
          try {
            ws.send(JSON.stringify({
              type: 'room_created',
              payload: { roomId: room.id }
            }));
            room.broadcastGameState();
          } catch (err) {
            console.error('Failed to send room creation message:', err);
          }
          break;

        case 'join_room':
          if (!data.payload?.roomId || !data.payload?.playerName) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Room ID and player name are required' }
            }));
            return;
          }

          room = rooms.get(data.payload.roomId.toUpperCase());
          if (room) {
            if (room.addPlayer(playerId, data.payload.playerName)) {
              ws.send(JSON.stringify({
                type: 'room_joined',
                payload: { roomId: room.id }
              }));
              room.broadcastGameState();
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room is full' }
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Room not found' }
            }));
          }
          break;

        case 'balloon_click':
        case 'bank_clicks':
          room = findPlayerRoom(playerId);
          if (room) {
            room.handlePlayerAction(playerId, data);
          }
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid message format' }
      }));
    }
  });

  ws.on('close', () => {
    const room = findPlayerRoom(playerId);
    if (room) {
      room.removePlayer(playerId);
      room.broadcastGameState();
    }
    connections.delete(playerId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    const room = findPlayerRoom(playerId);
    if (room) {
      room.removePlayer(playerId);
      room.broadcastGameState();
    }
    connections.delete(playerId);
  });
});

// Heartbeat check interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      connections.forEach((conn, id) => {
        if (conn === ws) {
          const room = findPlayerRoom(id);
          if (room) {
            room.removePlayer(id);
            room.broadcastGameState();
          }
          connections.delete(id);
        }
      });
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, PING_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

function findPlayerRoom(playerId) {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) {
      return room;
    }
  }
  return null;
}

// Log startup
console.log(`WebSocket server running on port ${PORT}`); 