import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const Balloon = ({ size = 0, onClick, isPopped = false, className }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <AnimatePresence mode="wait">
        {!isPopped && (
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <motion.div
              className={cn("w-full h-full cursor-pointer select-none", className)}
              initial={{ scale: 0.5 }}
              animate={{ 
                scale: 0.5 + (size * 0.15),
                y: [0, -4, 0]
              }}
              transition={{
                scale: {
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                },
                y: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={onClick}
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Balloon */}
                <path
                  d="M50 15 
                     C20 15 20 50 50 85 
                     C80 50 80 15 50 15 
                     Z"
                  fill="#ff3333"
                  stroke="#cc0000"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />
                
                {/* Highlight */}
                <path
                  d="M40 25 
                     C30 30 35 45 45 50"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Pop effect */}
      {isPopped && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            scale: [1, 1.2, 0],
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 0.4,
            times: [0, 0.2, 1],
            ease: "easeOut"
          }}
        >
          <div className="text-6xl">💥</div>
        </motion.div>
      )}
    </div>
  );
};

export default Balloon; 