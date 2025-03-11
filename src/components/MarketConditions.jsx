import { useEffect, useState, useRef } from 'react';
import { cn } from '../lib/utils';

const MARKET_CONDITIONS = {
  BULL: {
    name: 'Bull Market',
    description: 'Market is trending upward. Lower risk, steady gains.',
    basePopChance: 0.04,
    popChanceIncrement: 0.012,
    riskMultiplier: 0.8, // Risk increases more slowly
    color: 'text-[#1db8e8]',
    nextCondition: 'BEAR', // Market cycle
  },
  BEAR: {
    name: 'Bear Market',
    description: 'Market is trending downward. Higher risk, potential losses.',
    basePopChance: 0.08,
    popChanceIncrement: 0.018,
    riskMultiplier: 1.2, // Risk increases more quickly
    color: 'text-[#f4ad00]',
    nextCondition: 'RECOVERY',
  },
  RECOVERY: {
    name: 'Market Recovery',
    description: 'Market is recovering. Moderate risk, good opportunity.',
    basePopChance: 0.06,
    popChanceIncrement: 0.015,
    riskMultiplier: 0.9, // Risk increases slightly slower
    color: 'text-[#275ce4]',
    nextCondition: 'RECESSION',
  },
  RECESSION: {
    name: 'Recession',
    description: 'Economic downturn. High risk, volatile market.',
    basePopChance: 0.1,
    popChanceIncrement: 0.02,
    riskMultiplier: 1.5, // Risk increases much faster
    color: 'text-[#1f3b9b]',
    nextCondition: 'BULL',
  },
};

const CLICKS_TO_CHANGE_MARKET = 6; // Changed from 8 to 6 clicks for faster market cycles

export function MarketConditions({ currentCondition, onConditionChange, totalClicks }) {
  const condition = MARKET_CONDITIONS[currentCondition];
  const clicksUntilChange = CLICKS_TO_CHANGE_MARKET - (totalClicks % CLICKS_TO_CHANGE_MARKET);
  const transitionTimeoutRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (totalClicks > 0 && totalClicks % CLICKS_TO_CHANGE_MARKET === 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set new timeout for transition
      transitionTimeoutRef.current = setTimeout(() => {
        onConditionChange(condition.nextCondition);
        setIsTransitioning(false);
      }, 300);
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [totalClicks, condition.nextCondition, onConditionChange, isTransitioning]);

  return (
    <div className={cn(
      "bg-[#0b1541]/30 backdrop-blur-sm rounded-lg p-4 text-white transition-all duration-300",
      isTransitioning ? "opacity-50" : "opacity-100"
    )}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`text-xl font-bold ${condition.color}`}>
          {condition.name}
        </h3>
        <span className="text-sm text-white/60">
          Changes in: {clicksUntilChange} clicks
        </span>
      </div>
      <p className="text-sm text-white/80">{condition.description}</p>
      <div className="mt-2 text-xs text-white/60">
        <div>Base Risk: {(condition.basePopChance * 100).toFixed(1)}%</div>
        <div>Risk Multiplier: {condition.riskMultiplier}x</div>
      </div>
    </div>
  );
}

export { MARKET_CONDITIONS }; 