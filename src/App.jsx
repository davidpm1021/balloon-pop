import { useState, useCallback } from 'react';
import Balloon from './components/Balloon';
import ScoreBoard from './components/ScoreBoard';

const MAX_ROUNDS = 5;
const BASE_POP_CHANCE = 0.1;
const POP_CHANCE_INCREMENT = 0.05;

function App() {
  const [round, setRound] = useState(1);
  const [currentClicks, setCurrentClicks] = useState(0);
  const [totalBankedClicks, setTotalBankedClicks] = useState(0);
  const [isPopped, setIsPopped] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const calculatePopChance = useCallback((clicks) => {
    return BASE_POP_CHANCE + (clicks * POP_CHANCE_INCREMENT);
  }, []);

  const handleBalloonClick = useCallback(() => {
    if (isPopped || gameOver) return;

    const popChance = calculatePopChance(currentClicks);
    if (Math.random() < popChance) {
      setIsPopped(true);
      if (round < MAX_ROUNDS) {
        setTimeout(() => {
          setRound(r => r + 1);
          setCurrentClicks(0);
          setIsPopped(false);
        }, 1500);
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
      setRound(r => r + 1);
      setCurrentClicks(0);
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-md mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-blue-900">
          🎈 Balloon Pop Game
        </h1>
        
        <ScoreBoard
          round={round}
          currentClicks={currentClicks}
          totalBankedClicks={totalBankedClicks}
          maxRounds={MAX_ROUNDS}
        />

        <div className="space-y-8">
          <div className="relative">
            <Balloon
              size={currentClicks}
              onClick={handleBalloonClick}
              isPopped={isPopped}
            />
            {!isPopped && !gameOver && (
              <div className="text-center mt-4 text-sm text-gray-500">
                Pop chance: {Math.round(calculatePopChance(currentClicks) * 100)}%
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleBankClicks}
              disabled={isPopped || gameOver || currentClicks === 0}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Bank Clicks
            </button>
            {(gameOver || isPopped) && (
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-400 transition-colors"
              >
                {gameOver ? "Play Again" : "Next Round"}
              </button>
            )}
          </div>

          {gameOver && (
            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h2 className="text-2xl font-bold mb-2 text-blue-900">Game Over!</h2>
              <p className="text-lg text-blue-700">Final Score: {totalBankedClicks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 