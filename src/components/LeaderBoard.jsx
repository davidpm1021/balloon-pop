import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const LeaderBoard = ({ scores, currentScore = null }) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-xl">
      <h2 className="text-white font-bold text-lg mb-3 text-center">Top Scores 🏆</h2>
      <div className="space-y-2">
        {scores.map((score, index) => (
          <motion.div
            key={`${score}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              score === currentScore
                ? "bg-blue-500/30 border border-blue-400/50"
                : "bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-white/60 font-mono w-6">
                {index === 0 && "🥇"}
                {index === 1 && "🥈"}
                {index === 2 && "🥉"}
                {index > 2 && `#${index + 1}`}
              </span>
              <span className="text-white font-semibold">{score}</span>
            </div>
            {score === currentScore && (
              <span className="text-xs text-blue-300 font-medium">NEW!</span>
            )}
          </motion.div>
        ))}
        {scores.length === 0 && (
          <div className="text-center text-white/60 py-2">
            No scores yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderBoard; 