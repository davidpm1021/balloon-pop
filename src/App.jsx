import { useState, useCallback, useEffect, useRef } from 'react';
import Balloon from './components/Balloon';
import ScoreBoard from './components/ScoreBoard';
import LeaderBoard from './components/LeaderBoard';
import { cn } from './lib/utils';

const MAX_ROUNDS = 5;
const BASE_POP_CHANCE = 0.02;
const POP_CHANCE_INCREMENT = 0.001;
const MAX_LEADERBOARD_ENTRIES = 5;

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
  const audioRef = useRef(null);

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
      setShowLeaderboard(true);
    }
  }, [gameOver, totalBankedClicks, highScores]);

  const calculatePopChance = useCallback((clicks) => {
    // Use cubic growth for even slower initial increase and steeper late game
    return BASE_POP_CHANCE + (Math.pow(clicks, 1.5) * POP_CHANCE_INCREMENT);
  }, []);

  const handleBalloonClick = useCallback(() => {
    if (isPopped || gameOver) return;

    const popChance = calculatePopChance(currentClicks);
    if (Math.random() < popChance) {
      setIsPopped(true);
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
  }, [currentClicks, isPopped, round, gameOver, calculatePopChance]);

  const handleBankClicks = useCallback(() => {
    if (isPopped || gameOver || currentClicks === 0) return;

    setTotalBankedClicks(total => total + currentClicks);
    
    if (round < MAX_ROUNDS) {
      setCurrentClicks(0);
      setRound(r => r + 1);
    } else {
      setGameOver(true);
    }
  }, [currentClicks, isPopped, round, gameOver]);

  const handleRestart = useCallback(() => {
    setRound(1);
    setCurrentClicks(0);
    setTotalBankedClicks(0);
    setIsPopped(false);
    setGameOver(false);
    setShowLeaderboard(false);
  }, []);

  return (
    <div 
      className={cn(
        "min-h-screen flex items-center justify-center p-4 transition-all duration-500",
        {
          "bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900": currentClicks <= 5,
          "bg-gradient-to-br from-slate-900 via-purple-800/95 to-slate-900 animate-pulse-slow": currentClicks > 5 && currentClicks <= 10,
          "bg-gradient-to-br from-red-900/90 via-purple-800 to-red-900/90 animate-pulse-fast": currentClicks > 10
        },
        currentClicks > 5 ? "screen-shake" : ""
      )}
      style={{
        '--intensity': `${Math.min(currentClicks * 5, 100)}%`,
        '--screen-shake': currentClicks <= 5 ? 0 : Math.min((currentClicks - 5) * 0.15, 2),
        '--screen-animation-speed': `${Math.max(2.5 - (currentClicks * 0.1), 0.8)}s`
      }}
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col h-[90vh] justify-between py-8 relative">
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
            🎈 Balloon Pop
          </h1>
          <p className="text-white/60 text-lg">Pump carefully, bank wisely!</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center -mt-8 mb-24">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8 items-center">
            <div className="flex flex-col space-y-6">
              <ScoreBoard
                round={round}
                currentClicks={currentClicks}
                totalBankedClicks={totalBankedClicks}
                maxRounds={MAX_ROUNDS}
              />

              <div className="aspect-square w-full max-w-xl mx-auto relative">
                <div 
                  className={cn(
                    "absolute inset-0 backdrop-blur-sm rounded-xl p-8 pb-24 flex items-start justify-center overflow-visible transition-all duration-500",
                    {
                      "bg-white/5": currentClicks <= 5,
                      "bg-yellow-500/5 animate-danger-pulse": currentClicks > 5 && currentClicks <= 10,
                      "bg-red-500/10 animate-danger-pulse": currentClicks > 10,
                    },
                    currentClicks > 0 ? "animate-shake" : ""
                  )}
                  style={{
                    '--shake-intensity': currentClicks <= 5 ? currentClicks * 0.1 : Math.min(0.5 + ((currentClicks - 5) * 0.3), 6),
                    '--animation-speed': `${Math.max(2 - (currentClicks * 0.1), 0.5)}s`,
                    '--glow-color': currentClicks <= 5 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : currentClicks <= 10 
                        ? 'rgba(234, 179, 8, 0.2)' 
                        : 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <Balloon
                    size={currentClicks}
                    onClick={handleBalloonClick}
                    isPopped={isPopped}
                  />
                  {!isPopped && !gameOver && (
                    <div className={cn(
                      "absolute top-4 right-4 px-4 py-2 backdrop-blur-sm rounded-full text-sm font-medium transition-all duration-300",
                      {
                        "bg-white/10 text-white/80": currentClicks <= 5,
                        "bg-yellow-500/20 text-yellow-300 animate-pulse": currentClicks > 5 && currentClicks <= 10,
                        "bg-red-500/20 text-red-300 animate-bounce": currentClicks > 10
                      }
                    )}>
                      Pop risk: {Math.round(calculatePopChance(currentClicks) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-full flex items-center justify-center">
              <LeaderBoard 
                scores={highScores} 
                currentScore={gameOver ? totalBankedClicks : null}
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-50">
          <div className="flex justify-center gap-4 max-w-5xl mx-auto">
            <button
              onClick={handleBankClicks}
              disabled={isPopped || gameOver || currentClicks === 0}
              className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold shadow-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 text-base min-w-[140px]"
            >
              Bank Clicks
            </button>
          </div>
        </div>

        {gameOver && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800/90 p-8 rounded-xl border border-white/20 shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <h2 className="text-4xl font-bold mb-4 text-white text-center">Game Over!</h2>
              <p className="text-3xl font-medium text-white/90 text-center mb-6">Final Score: {totalBankedClicks}</p>
              <div className="flex justify-center">
                <button
                  onClick={handleRestart}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-400 transition-all hover:scale-105 active:scale-95 text-base min-w-[140px]"
                >
                  Play Again
                </button>
              </div>
              <p className="text-sm text-white/60 mt-4 text-center">Thanks for playing!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 