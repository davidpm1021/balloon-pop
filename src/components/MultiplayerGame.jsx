import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import Balloon from './Balloon';
import ScoreBoard from './ScoreBoard';
import { MarketConditions } from './MarketConditions';

const MultiplayerGame = ({ connection, onExit }) => {
  const [gameState, setGameState] = useState({
    status: 'lobby',
    roomId: null,
    players: [],
    currentRound: 1,
    marketCondition: 'BULL'
  });

  const [playerState, setPlayerState] = useState({
    id: null,
    name: '',
    currentClicks: 0,
    totalBankedClicks: 0,
    isPopped: false
  });

  const [error, setError] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Handle WebSocket messages
  useEffect(() => {
    if (!connection) {
      console.log('No connection provided');
      setIsConnected(false);
      return;
    }

    console.log('Setting up WebSocket handlers, connection state:', connection.readyState);
    setIsConnected(true);

    connection.onopen = () => {
      console.log('WebSocket connection opened');
      setIsConnected(true);
      setError(null);
    };

    connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'connected':
            console.log('Received player ID:', data.payload.playerId);
            setPlayerState(prev => ({ ...prev, id: data.payload.playerId }));
            break;
          case 'game_state':
            console.log('Received game state:', data.payload);
            setGameState(data.payload);
            // Update player state from game state
            const player = data.payload.players.find(p => p.id === playerState.id);
            if (player) {
              setPlayerState(prev => ({
                ...prev,
                currentClicks: player.currentClicks,
                totalBankedClicks: player.totalBankedClicks,
                isPopped: player.isPopped
              }));
            }
            break;
          case 'error':
            console.error('Server error:', data.payload.message);
            setError(data.payload.message);
            setTimeout(() => setError(null), 3000);
            break;
          case 'room_created':
          case 'room_joined':
            console.log('Room action success:', data.type, data.payload);
            setGameState(prev => ({ ...prev, roomId: data.payload.roomId }));
            setError(null);
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
        setError('Error processing server message');
      }
    };

    connection.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error occurred');
      setIsConnected(false);
    };

    connection.onclose = (event) => {
      console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
      setIsConnected(false);
      setError('Connection closed');
    };

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket handlers');
      if (connection) {
        connection.onmessage = null;
        connection.onclose = null;
        connection.onerror = null;
      }
    };
  }, [connection, playerState.id]);

  const createRoom = useCallback(() => {
    if (!connection || !playerState.name || !isConnected) {
      console.log('Cannot create room:', { 
        hasConnection: !!connection, 
        name: playerState.name, 
        isConnected 
      });
      setError('Cannot create room - check connection and name');
      return;
    }

    console.log('Creating room with name:', playerState.name);
    try {
      connection.send(JSON.stringify({
        type: 'create_room',
        payload: { playerName: playerState.name }
      }));
    } catch (err) {
      console.error('Error sending create room message:', err);
      setError('Failed to send room creation request');
    }
  }, [connection, playerState.name, isConnected]);

  const joinRoom = useCallback(() => {
    if (!connection || !playerState.name || !roomCode || !isConnected) {
      setError('Cannot join room - check connection, name, and room code');
      return;
    }

    console.log('Joining room:', roomCode); // Debug log
    connection.send(JSON.stringify({
      type: 'join_room',
      payload: { roomId: roomCode, playerName: playerState.name }
    }));
  }, [connection, playerState.name, roomCode, isConnected]);

  // Render lobby screen
  if (gameState.status === 'lobby' || !gameState.roomId) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-[#1f3b9b] rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#f4ad00] mb-6">Multiplayer Game</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-white/80 mb-2">Your Name</label>
              <input
                type="text"
                value={playerState.name}
                onChange={(e) => setPlayerState(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 rounded bg-white/10 text-white border border-white/20 focus:border-[#f4ad00]"
                placeholder="Enter your name"
              />
            </div>

            {playerState.name && (
              <>
                <div className="flex gap-4">
                  <button
                    onClick={createRoom}
                    className="flex-1 p-3 bg-[#f4ad00] hover:bg-[#1db8e8] text-white font-bold rounded transition-colors"
                  >
                    Create Room
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1f3b9b] text-white/60">or join a room</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded bg-white/10 text-white border border-white/20 focus:border-[#f4ad00]"
                    placeholder="Enter room code"
                    maxLength={6}
                  />
                  <button
                    onClick={joinRoom}
                    disabled={!roomCode}
                    className="w-full p-3 bg-[#1db8e8] hover:bg-[#275ce4] text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join Room
                  </button>
                </div>
              </>
            )}

            <button
              onClick={onExit}
              className="w-full p-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded transition-colors mt-4"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game in progress UI
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1f3b9b] rounded-xl p-8 max-w-6xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#f4ad00]">
            Room: {gameState.roomId}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-white/60">
              Players: {gameState.players.length}/30
            </div>
            <button
              onClick={onExit}
              className="p-2 hover:bg-white/10 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr,2fr,1fr] gap-8">
          <div className="space-y-6">
            <MarketConditions
              currentCondition={gameState.marketCondition}
              totalClicks={playerState.currentClicks}
            />
            <ScoreBoard
              round={gameState.currentRound}
              currentClicks={playerState.currentClicks}
              totalBankedClicks={playerState.totalBankedClicks}
              maxRounds={5}
              riskPercentage={0}
            />
          </div>

          <div className="aspect-square relative">
            <Balloon
              size={playerState.currentClicks}
              isPopped={playerState.isPopped}
              onClick={() => {
                connection?.send(JSON.stringify({
                  type: 'balloon_click'
                }));
              }}
            />
            
            {!playerState.isPopped && playerState.currentClicks > 0 && (
              <button
                onClick={() => {
                  connection?.send(JSON.stringify({
                    type: 'bank_clicks'
                  }));
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#1db8e8] hover:bg-[#275ce4] text-white font-bold rounded-full shadow-lg transform transition-all hover:scale-105"
              >
                Bank ${(playerState.currentClicks * 100).toLocaleString()}
              </button>
            )}
          </div>

          <div className="bg-[#0b1541]/30 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-xl font-bold text-[#1db8e8] mb-4">Players</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {gameState.players.map(player => (
                <div
                  key={player.id}
                  className={cn(
                    "p-3 rounded-lg",
                    player.isPopped ? "bg-red-500/20" : "bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white">{player.name}</span>
                    <span className="text-[#f4ad00]">
                      ${(player.totalBankedClicks * 100).toLocaleString()}
                    </span>
                  </div>
                  {player.currentClicks > 0 && !player.isPopped && (
                    <div className="text-sm text-white/60 mt-1">
                      Current: ${(player.currentClicks * 100).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame; 