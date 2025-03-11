import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

const formatAsDollars = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount * 100); // Multiply by 100 to make the numbers more interesting
};

const ScoreBoard = ({
  round,
  currentClicks,
  totalBankedClicks,
  maxRounds,
  riskPercentage,
  className,
}) => {
  const [prevRisk, setPrevRisk] = useState(riskPercentage);
  const [riskTrend, setRiskTrend] = useState(0); // -1 down, 0 same, 1 up

  useEffect(() => {
    if (riskPercentage !== prevRisk) {
      setRiskTrend(riskPercentage > prevRisk ? 1 : riskPercentage < prevRisk ? -1 : 0);
      setPrevRisk(riskPercentage);
    }
  }, [riskPercentage, prevRisk]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-2 text-center flex flex-col justify-between min-h-[90px]">
          <div className="text-xs text-white/60 uppercase tracking-wider font-medium mb-1">Round</div>
          <div className="text-lg font-bold text-white">{round}/{maxRounds}</div>
        </div>
        <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-2 text-center flex flex-col justify-between min-h-[90px]">
          <div className="text-xs text-emerald-300/80 uppercase tracking-wider font-medium mb-1">Current</div>
          <div className="text-lg font-bold text-emerald-300">{formatAsDollars(currentClicks)}</div>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-2 text-center flex flex-col justify-between min-h-[90px]">
          <div className="text-xs text-blue-300/80 uppercase tracking-wider font-medium mb-1">Banked</div>
          <div className="text-lg font-bold text-blue-300">{formatAsDollars(totalBankedClicks)}</div>
        </div>
      </div>
      {typeof riskPercentage === 'number' && (
        <div className={cn(
          "backdrop-blur-sm rounded-xl p-2",
          riskPercentage < 25 ? "bg-green-500/20" :
          riskPercentage < 50 ? "bg-yellow-500/20" :
          riskPercentage < 75 ? "bg-orange-500/20" :
          "bg-red-500/20"
        )}>
          <div className="text-center">
            <div className="text-xs text-white/80 uppercase tracking-wider font-medium mb-1">Risk Level</div>
            <div className="flex items-center justify-center gap-2">
              <div className={cn(
                "text-lg font-bold",
                riskPercentage < 25 ? "text-green-300" :
                riskPercentage < 50 ? "text-yellow-300" :
                riskPercentage < 75 ? "text-orange-300" :
                "text-red-300"
              )}>
                {riskPercentage.toFixed(1)}%
              </div>
              {riskTrend !== 0 && (
                <div className={cn(
                  "text-sm",
                  riskTrend > 0 ? "text-red-400" : "text-green-400"
                )}>
                  {riskTrend > 0 ? "↑" : "↓"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div className={cn(
      "p-4 rounded-lg shadow-sm border-2 transition-colors",
      colorClasses[color]
    )}>
      <h3 className="text-sm font-medium opacity-75">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default ScoreBoard; 