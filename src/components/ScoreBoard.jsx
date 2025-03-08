import { cn } from '../lib/utils';

const ScoreBoard = ({
  round,
  currentClicks,
  totalBankedClicks,
  maxRounds,
  className,
}) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
        <div className="text-sm text-white/60 uppercase tracking-wider font-medium">Round</div>
        <div className="text-3xl md:text-4xl font-bold text-white mt-2">{round}/{maxRounds}</div>
      </div>
      <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-4 text-center">
        <div className="text-sm text-emerald-300/80 uppercase tracking-wider font-medium">Current</div>
        <div className="text-3xl md:text-4xl font-bold text-emerald-300 mt-2">{currentClicks}</div>
      </div>
      <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 text-center">
        <div className="text-sm text-blue-300/80 uppercase tracking-wider font-medium">Banked</div>
        <div className="text-3xl md:text-4xl font-bold text-blue-300 mt-2">{totalBankedClicks}</div>
      </div>
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