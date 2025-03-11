import { useState, useCallback, useEffect, useRef } from 'react';
import Balloon from './components/Balloon';
import ScoreBoard from './components/ScoreBoard';
import LeaderBoard from './components/LeaderBoard';
import { MarketConditions, MARKET_CONDITIONS } from './components/MarketConditions';
import { InstructionsModal } from './components/InstructionsModal';
import { StatsChart } from './components/StatsChart';
import { cn } from './lib/utils';
import MultiplayerGame from './components/MultiplayerGame';

const MAX_ROUNDS = 5;
const BASE_POP_CHANCE = 0.05;
const POP_CHANCE_INCREMENT = 0.015;
const MAX_LEADERBOARD_ENTRIES = 5;

// Update WebSocket URL configuration
const WS_URL = process.env.NODE_ENV === 'production'
  ? 'wss://your-render-app.onrender.com'
  : 'ws://localhost:8080';

function App() {
  const [round, setRound] = useState(1);
  const [currentClicks, setCurrentClicks] = useState(0);
  const [totalBankedClicks, setTotalBankedClicks] = useState(0);
  const [isPopped, setIsPopped] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [currentMarketCondition, setCurrentMarketCondition] = useState('BULL');
  const [totalClicks, setTotalClicks] = useState(0);
  const [gameMode, setGameMode] = useState('single');
  const [wsConnection, setWsConnection] = useState(null);
  const audioRef = useRef(null);
  const [gameHistory, setGameHistory] = useState([]);

  useEffect(() => {
    // Create audio element with multiple sources for better compatibility
    audioRef.current = new Audio();
    
    // Try multiple sources in case one fails
    const sources = [
      '/99-red-balloons.mp3', // Local file (once you add it)
      'https://audio.jukehost.co.uk/9jyXRhY0TqPZKxPo9mxUwNcBmhfZJbQx', // Backup CDN source
      'https://cdn.trendybeatz.com/audio/Goldfinger-99-Red-Balloons-(TrendyBeatz.com).mp3', // Another backup
    ];

    let currentSourceIndex = 0;

    const tryNextSource = () => {
      if (currentSourceIndex < sources.length) {
        audioRef.current.src = sources[currentSourceIndex];
        currentSourceIndex++;
      } else {
        setAudioError(true);
        setIsAudioLoading(false);
      }
    };

    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    audioRef.current.preload = 'auto';

    const handleLoadStart = () => {
      setIsAudioLoading(true);
      setAudioError(false);
    };

    const handleCanPlay = () => {
      setIsAudioLoading(false);
      if (!isMuted) {
        audioRef.current.play().catch(e => {
          console.error('Auto-play failed:', e);
          setIsMuted(true);
          setAudioError(true);
        });
      }
    };

    const handleError = (e) => {
      console.error('Audio loading error:', e);
      tryNextSource(); // Try the next source if current one fails
    };

    // Add event listeners for audio loading
    audioRef.current.addEventListener('loadstart', handleLoadStart);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('error', handleError);

    // Start with first source
    tryNextSource();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadstart', handleLoadStart);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current = null;
      }
    };
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        setIsAudioLoading(true);
        setAudioError(false);
        // Try reloading the audio if there was an error
        if (audioError) {
          audioRef.current.load();
        }
        audioRef.current.play()
          .then(() => {
            setIsAudioLoading(false);
          })
          .catch(e => {
            console.error('Audio play failed:', e);
            setIsAudioLoading(false);
            setAudioError(true);
          });
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted, audioError]);

  // Load high scores from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem('balloonPopHighScores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  }, []);

  // Update high scores when game ends
  useEffect(() => {
    if (gameOver && totalBankedClicks > 0) {
      const newScores = Array.from(new Set([...highScores, totalBankedClicks]))
        .sort((a, b) => b - a)
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      
      setHighScores(newScores);
      localStorage.setItem('balloonPopHighScores', JSON.stringify(newScores));
      
      // Show end game UI
      requestAnimationFrame(() => {
        setShowLeaderboard(true);
      });
    }
  }, [gameOver, totalBankedClicks]);

  // Add effect to ensure game over is triggered after round 5
  useEffect(() => {
    if (round > MAX_ROUNDS) {
      setGameOver(true);
    }
  }, [round]);

  const calculatePopChance = useCallback((clicks) => {
    const condition = MARKET_CONDITIONS[currentMarketCondition];
    // Exponential growth for faster risk increase
    return condition.basePopChance + 
      (Math.pow(clicks, 2) * condition.popChanceIncrement * condition.riskMultiplier);
  }, [currentMarketCondition]);

  const handleBalloonClick = useCallback(() => {
    if (isPopped || gameOver) return;

    const newTotalClicks = totalClicks + 1;
    setTotalClicks(newTotalClicks);

    const popChance = calculatePopChance(currentClicks);
    if (Math.random() < popChance) {
      setIsPopped(true);
      
      // Record popped clicks in history
      setGameHistory(prev => [
        ...prev,
        { round, bankedClicks: 0, poppedClicks: currentClicks }
      ]);
      
      if (round < MAX_ROUNDS) {
        setTimeout(() => {
          setIsPopped(false);
          setCurrentClicks(0);
          setRound(r => r + 1);
        }, 800);
      } else {
        setGameOver(true);
      }
    } else {
      setCurrentClicks(c => c + 1);
    }
  }, [currentClicks, isPopped, round, gameOver, calculatePopChance, totalClicks]);

  const handleBankClicks = useCallback(() => {
    if (isPopped || gameOver || currentClicks === 0) return;

    setTotalBankedClicks(total => total + currentClicks);
    
    // Record banked clicks in history
    setGameHistory(prev => [
      ...prev,
      { round, bankedClicks: currentClicks, poppedClicks: 0 }
    ]);

    if (round < MAX_ROUNDS) {
      setCurrentClicks(0);
      setRound(r => r + 1);
    } else {
      setGameOver(true);
    }
  }, [currentClicks, isPopped, round, gameOver]);

  const handleRestart = useCallback(() => {
    // Reset all game states immediately
    setRound(1);
    setCurrentClicks(0);
    setTotalBankedClicks(0);
    setIsPopped(false);
    setGameOver(false);
    setShowLeaderboard(false);
    setGameHistory([]);
    setTotalClicks(0);
    setCurrentMarketCondition('BULL');
  }, []);

  // Update connection management
  useEffect(() => {
    if (gameMode === 'multi') {
      console.log('Initializing WebSocket connection');
      const ws = new WebSocket(WS_URL);
      
      // Add reconnection logic
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      let reconnectTimeout = null;
      
      const connect = () => {
        ws.onopen = () => {
          console.log('Connected to game server');
          setWsConnection(ws);
          reconnectAttempts = 0;
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
          setWsConnection(null);
          
          if (gameMode === 'multi' && reconnectAttempts < maxReconnectAttempts) {
            console.log(`Reconnecting... Attempt ${reconnectAttempts + 1}`);
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connect, 1000 * Math.min(reconnectAttempts, 5));
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      };

      connect();
      
      return () => {
        console.log('Cleaning up WebSocket connection');
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        if (ws) {
          ws.close();
          setWsConnection(null);
        }
      };
    } else if (wsConnection) {
      console.log('Closing WebSocket connection due to mode change');
      wsConnection.close();
      setWsConnection(null);
    }
  }, [gameMode]);

  return (
    <div 
      className={cn(
        "min-h-screen flex items-center justify-center p-4 transition-all duration-500",
        {
          "bg-gradient-to-br from-[#1db8e8] via-[#275ce4] to-[#1f3b9b]": currentClicks <= 5,
          "bg-gradient-to-br from-[#f4ad00] via-[#1db8e8] to-[#275ce4] animate-pulse-slow": currentClicks > 5 && currentClicks <= 10,
          "bg-gradient-to-br from-[#f4ad00] via-[#1f3b9b] to-[#1db8e8] animate-pulse-fast": currentClicks > 10
        },
        currentClicks > 5 ? "screen-shake" : ""
      )}
      style={{
        '--intensity': `${Math.min(currentClicks * 5, 100)}%`,
        '--screen-shake': currentClicks <= 5 ? 0 : Math.min((currentClicks - 5) * 0.15, 2),
        '--screen-animation-speed': `${Math.max(2.5 - (currentClicks * 0.1), 0.8)}s`
      }}
    >
      <InstructionsModal />
      
      <div className="w-full max-w-6xl mx-auto flex flex-col h-[90vh] justify-between py-8 relative">
        <div className="flex flex-col items-center space-y-2 mb-8">
          <button
            onClick={toggleMute}
            className="absolute right-0 top-0 p-3 text-white/80 hover:text-white transition-colors"
            aria-label={isMuted ? "Unmute music" : "Mute music"}
            disabled={isAudioLoading}
            title={audioError ? "Audio failed to load. Click to try again." : (isMuted ? "Unmute music" : "Mute music")}
          >
            {isAudioLoading ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : audioError ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white drop-shadow-glow font-display tracking-tight">
            🎈 Balloon Burst Blitz
          </h1>
          <p className="text-white/60 text-lg">Risk it all, bank or fall!</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center -mt-8 mb-8">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr,2fr,1fr] gap-8 items-start">
            <div className="space-y-6">
              <MarketConditions
                currentCondition={currentMarketCondition}
                onConditionChange={setCurrentMarketCondition}
                totalClicks={totalClicks}
              />
              <ScoreBoard
                round={round}
                currentClicks={currentClicks}
                totalBankedClicks={totalBankedClicks}
                maxRounds={MAX_ROUNDS}
                riskPercentage={calculatePopChance(currentClicks) * 100}
              />
            </div>

            <div className="aspect-square w-full max-w-xl mx-auto relative">
              <Balloon
                size={currentClicks}
                isPopped={isPopped}
                onClick={handleBalloonClick}
                onPop={() => setIsPopped(true)}
              />
              
              {!isPopped && !gameOver && currentClicks > 0 && (
                <button
                  onClick={handleBankClicks}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#1db8e8] hover:bg-[#275ce4] text-white font-bold rounded-full shadow-lg transform transition-all hover:scale-105"
                >
                  Bank ${(currentClicks * 100).toLocaleString()} 
                </button>
              )}

              {(gameOver || isPopped) && (
                <button
                  onClick={handleRestart}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#1f3b9b] hover:bg-[#275ce4] text-white font-bold rounded-full shadow-lg transform transition-all hover:scale-105"
                >
                  {gameOver ? 'Play Again' : 'Next Round'}
                </button>
              )}
            </div>

            <div className="space-y-6">
              {gameHistory.length > 0 && (
                <StatsChart gameHistory={gameHistory} />
              )}
              {showLeaderboard && (
                <LeaderBoard scores={highScores} />
              )}
            </div>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-[#1f3b9b]/80 backdrop-blur-sm"
            onClick={handleRestart}
          />
          
          <div className="relative bg-gradient-to-br from-[#1f3b9b] to-[#275ce4] rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-[#f4ad00]/20 text-center">
            <h2 className="text-3xl font-bold text-[#f4ad00] mb-4">Game Over!</h2>
            <p className="text-2xl text-white mb-6">
              Final Score: ${(totalBankedClicks * 100).toLocaleString()}
            </p>
            {highScores.indexOf(totalBankedClicks) === 0 && (
              <p className="text-lg text-[#1db8e8] mb-6">New High Score! 🎉</p>
            )}
            <button
              onClick={handleRestart}
              className="w-full py-3 bg-[#f4ad00] hover:bg-[#1db8e8] text-white font-bold rounded-lg transition-colors duration-200"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Add mode selection buttons */}
      <div className="absolute top-4 right-4 space-x-4">
        <button 
          onClick={() => setGameMode('single')}
          className={cn(
            "px-4 py-2 rounded-lg font-bold",
            gameMode === 'single' 
              ? "bg-[#f4ad00] text-white" 
              : "bg-[#1f3b9b] text-white/60 hover:text-white"
          )}
        >
          Single Player
        </button>
        <button 
          onClick={() => setGameMode('multi')}
          className={cn(
            "px-4 py-2 rounded-lg font-bold",
            gameMode === 'multi' 
              ? "bg-[#f4ad00] text-white" 
              : "bg-[#1f3b9b] text-white/60 hover:text-white"
          )}
        >
          Multiplayer
        </button>
      </div>

      {gameMode === 'multi' && (
        <MultiplayerGame connection={wsConnection} onExit={() => setGameMode('single')} />
      )}
    </div>
  );
}

export default App; 