import { useState, useEffect } from 'react';
import { MARKET_CONDITIONS } from './MarketConditions';

const GameAnalysis = ({ gameHistory, totalBankedClicks, onClose }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    analyzeGameplay(gameHistory, totalBankedClicks);
  }, [gameHistory, totalBankedClicks]);

  const analyzeGameplay = (history, totalBanked) => {
    // Calculate key metrics
    const totalRounds = history.length;
    const poppedRounds = history.filter(h => h.poppedClicks > 0).length;
    const avgClicksPerBank = history.filter(h => h.bankedClicks > 0)
      .reduce((acc, h) => acc + h.bankedClicks, 0) / (totalRounds - poppedRounds) || 0;
    const successRate = (totalRounds - poppedRounds) / totalRounds;
    const avgBankValue = totalBanked / (totalRounds - poppedRounds) || 0;
    
    // Generate analysis text
    const analysis = {
      style: determineInvestingStyle(avgClicksPerBank, successRate),
      lessons: generateLessons(history, avgClicksPerBank, successRate),
      marketTiming: analyzeMarketTiming(history),
      performance: analyzePerformance(totalBanked, totalRounds, avgBankValue, successRate)
    };
    
    setAnalysis(analysis);
  };

  const determineInvestingStyle = (avgClicks, successRate) => {
    if (avgClicks > 12) {
      return {
        type: "High-Risk Day Trader",
        description: "You're drawn to volatile, high-risk positions with potential for explosive gains. While this can lead to spectacular returns, it's also the riskiest approach and requires careful timing and strong nerves."
      };
    } else if (avgClicks > 8) {
      return {
        type: "Aggressive Growth Investor",
        description: "You seek substantial growth through calculated risks. This approach can work well in bull markets but requires discipline to avoid overexposure in bearish conditions."
      };
    } else if (avgClicks > 5) {
      return {
        type: "Growth-Oriented Investor",
        description: "You balance aggression with prudence, seeking growth while maintaining reasonable risk levels. This approach often performs well across different market conditions."
      };
    } else if (avgClicks > 3) {
      return {
        type: "Balanced Investor",
        description: "You take a measured approach to risk and reward, similar to a 60/40 portfolio split between stocks and bonds. This strategy provides steady growth with reduced volatility."
      };
    } else {
      return {
        type: successRate > 0.8 ? "Value Investor" : "Risk-Averse Investor",
        description: successRate > 0.8 
          ? "You focus on consistent, small gains while protecting capital. This approach mirrors value investing strategies that seek undervalued, stable investments."
          : "Your extremely cautious approach prioritizes capital preservation over growth. While this minimizes losses, it may lead to missed opportunities in favorable markets."
      };
    }
  };

  const generateLessons = (history, avgClicks, successRate) => {
    const lessons = [];
    
    // Analyze risk management
    const bigLosses = history.filter(h => h.poppedClicks > 8).length;
    const marketConditionLosses = history.filter(h => h.poppedClicks > 0 && h.marketCondition === 'BEAR').length;
    
    if (bigLosses > 0) {
      lessons.push({
        title: "Risk Management",
        text: bigLosses > 1 
          ? "Multiple significant losses suggest a need for stricter stop-loss discipline. Consider setting clear exit points before entering positions."
          : "Your large loss highlights the importance of position sizing and risk management. Even promising trades need safety measures."
      });
    }

    // Analyze market adaptation
    const marketConditions = history.map(h => h.marketCondition);
    const uniqueConditions = new Set(marketConditions).size;
    
    if (uniqueConditions > 1) {
      lessons.push({
        title: "Market Adaptation",
        text: marketConditionLosses > 0
          ? "Losses during bear markets suggest a need to adjust strategy based on market conditions. Consider reducing position sizes in adverse conditions."
          : "You showed ability to adapt to changing market conditions. This flexibility is crucial for long-term success."
      });
    }

    // Analyze consistency
    const clickVariance = calculateClickVariance(history);
    if (clickVariance > 5) {
      lessons.push({
        title: "Strategy Consistency",
        text: successRate < 0.6
          ? "High variance in your decisions combined with losses suggests emotional trading. Develop and stick to a clear strategy."
          : "While your approach varies significantly, your success rate shows promise. Consider documenting what works best."
      });
    }

    // Analyze timing
    const avgTimingScore = calculateTimingScore(history);
    lessons.push({
      title: "Market Timing",
      text: avgTimingScore > 0.7
        ? "Your timing was strong, showing good instincts for market entry and exit points."
        : avgTimingScore > 0.4
        ? "Your timing was decent but could be improved. Look for clear signals before making moves."
        : "Work on identifying better entry and exit points. Consider using technical analysis or other market indicators."
    });

    return lessons;
  };

  const calculateClickVariance = (history) => {
    const clicks = history.map(h => h.bankedClicks || h.poppedClicks);
    const avg = clicks.reduce((a, b) => a + b, 0) / clicks.length;
    return Math.sqrt(clicks.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / clicks.length);
  };

  const calculateTimingScore = (history) => {
    return history.reduce((score, round) => {
      const condition = MARKET_CONDITIONS[round.marketCondition];
      const isGoodTiming = (condition.riskMultiplier < 1 && round.bankedClicks < 5) ||
                          (condition.riskMultiplier === 1 && round.bankedClicks >= 4 && round.bankedClicks <= 8) ||
                          (condition.riskMultiplier > 1 && round.bankedClicks > 6);
      return score + (isGoodTiming ? 1 : 0);
    }, 0) / history.length;
  };

  const analyzeMarketTiming = (history) => {
    const marketPerformance = history.reduce((acc, round) => {
      const condition = round.marketCondition;
      if (!acc[condition]) {
        acc[condition] = { total: 0, success: 0 };
      }
      acc[condition].total++;
      if (round.bankedClicks > 0) acc[condition].success++;
      return acc;
    }, {});

    const timingAnalysis = Object.entries(marketPerformance)
      .map(([condition, stats]) => {
        const successRate = (stats.success / stats.total) * 100;
        return `${condition} Markets: ${successRate.toFixed(0)}% success rate`;
      })
      .join('. ');

    return `${timingAnalysis}. Remember that market timing is challenging - focus on value and strong fundamentals rather than perfect timing.`;
  };

  const analyzePerformance = (totalBanked, rounds, avgBankValue, successRate) => {
    const performanceScore = (avgBankValue * successRate * 10) / rounds;
    
    if (performanceScore > 12) {
      return "Exceptional performance! Your balance of risk and reward, combined with good market timing, led to outstanding results. This approach would serve well in real market trading.";
    } else if (performanceScore > 8) {
      return "Strong performance showing good risk management and market awareness. Your strategy could translate well to real market trading with proper position sizing.";
    } else if (performanceScore > 5) {
      return "Solid performance with room for improvement. Consider being more aggressive in favorable conditions while maintaining your risk management discipline.";
    } else if (performanceScore > 3) {
      return "Your cautious approach protected capital but limited gains. In real trading, consider gradually increasing risk tolerance in favorable conditions.";
    } else {
      return "Your conservative approach prioritized safety but missed opportunities. Consider studying market indicators to identify lower-risk entry points for trades.";
    }
  };

  if (!analysis) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-[#1f3b9b]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-gradient-to-br from-[#1f3b9b] to-[#275ce4] rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl border border-[#f4ad00]/20 overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#f4ad00]">Stock Market Analysis</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-[#1db8e8] mb-2">{analysis.style.type}</h3>
              <p className="text-white/90">{analysis.style.description}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#1db8e8]">Market Lessons</h3>
              {analysis.lessons.map((lesson, i) => (
                <div key={i} className="bg-[#f4ad00]/10 rounded p-4 border border-[#f4ad00]/20">
                  <h4 className="font-semibold text-[#f4ad00]">{lesson.title}</h4>
                  <p className="mt-1 text-white/90">{lesson.text}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#1db8e8] mb-2">Market Timing</h3>
              <p className="text-white/90">{analysis.marketTiming}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[#1db8e8] mb-2">Overall Performance</h3>
              <p className="text-white/90">{analysis.performance}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-[#f4ad00] hover:bg-[#1db8e8] text-white font-bold rounded-lg transition-colors duration-200"
          >
            Continue Playing
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysis; 