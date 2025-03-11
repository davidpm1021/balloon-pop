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
          <div className="bg-[#0b1541] rounded-xl p-6 max-w-md w-full relative border border-[#1f3b9b]/30">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-[#1db8e8]">How to Play</h2>
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
                <h3 className="text-lg font-semibold text-[#f4ad00] mb-2">🎯 Quick Rules</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click balloon to inflate - each click worth $100</li>
                  <li>Bank your money before the balloon pops!</li>
                  <li>Bigger balloon = higher pop risk</li>
                  <li>Complete 5 rounds to win</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-[#1db8e8] mb-2">📈 Market Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="text-[#1db8e8]">Bull</span> - Low risk</li>
                  <li><span className="text-[#f4ad00]">Bear</span> - High risk</li>
                  <li>Watch the risk meter!</li>
                </ul>
              </section>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#f4ad00] hover:bg-[#1db8e8] text-white font-bold rounded-lg transition-colors duration-200 mt-4"
              >
                Start Playing!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 