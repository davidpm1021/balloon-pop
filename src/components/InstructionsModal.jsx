import { useState, useEffect } from 'react';

export function InstructionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
    if (!hasSeenInstructions) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (neverShowAgain) {
      localStorage.setItem('hasSeenInstructions', 'true');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        title="How to Play"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[#0b1541]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1541] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative border border-[#1f3b9b]/30">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-[#1db8e8]">Welcome to Balloon Burst Blitz!</h2>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-white/80">
              <section>
                <h3 className="text-lg font-semibold text-white mb-2">🎯 Game Objective</h3>
                <p>
                  Push your luck to earn as much as you can without popping the balloon! Each click inflates the balloon and increases your potential earnings, but also raises the risk of popping.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">🎮 How to Play</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Click the balloon to inflate it - each click is worth $100</li>
                  <li>The balloon gets riskier to inflate as it grows</li>
                  <li>Click "Bank" to secure your earnings before the balloon pops</li>
                  <li>If the balloon pops, you lose all unbanked money</li>
                  <li>Complete 5 rounds to get on the leaderboard</li>
                  <li>Watch the risk meter - it shows your pop chance!</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1db8e8] mb-2">📈 Market Conditions</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><span className="text-[#1db8e8]">Bull Market</span> - Lower risk, steady gains</li>
                  <li><span className="text-[#f4ad00]">Bear Market</span> - Higher risk, potential losses</li>
                  <li><span className="text-[#275ce4]">Recovery</span> - Moderate risk, good opportunity</li>
                  <li><span className="text-[#1f3b9b]">Recession</span> - High risk, volatile market</li>
                </ul>
                <p className="mt-2 text-sm">Markets change based on total clicks across all rounds - adapt your strategy!</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-white mb-2">💡 Pro Tips</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>The screen shakes more as risk increases</li>
                  <li>Bank early in high-risk markets</li>
                  <li>Take bigger risks during bull markets</li>
                  <li>Watch for market transitions</li>
                </ul>
              </section>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={neverShowAgain}
                    onChange={(e) => setNeverShowAgain(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Don't show again</span>
                </label>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-[#1f3b9b] hover:bg-[#275ce4] text-white rounded-lg transition-colors"
                >
                  Let's Play!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 