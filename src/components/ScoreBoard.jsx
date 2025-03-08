import { cn } from '../lib/utils';

const ScoreBoard = ({
  round,
  currentClicks,
  totalBankedClicks,
  maxRounds,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Round"
          value={`${round}/${maxRounds}`}
          color="blue"
        />
        <StatCard
          title="Current Clicks"
          value={currentClicks}
          color="green"
        />
        <StatCard
          title="Total Score"
          value={totalBankedClicks}
          color="purple"
        />
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