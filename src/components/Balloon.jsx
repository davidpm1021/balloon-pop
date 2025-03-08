import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const Balloon = ({ size = 0, onClick, isPopped = false, className }) => {
  const balloonVariants = {
    idle: {
      scale: 1 + size * 0.1,
      transition: {
        duration: 0.3,
      },
    },
    pop: {
      scale: [1 + size * 0.1, 1.4, 0],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.5,
        times: [0, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn(
        "relative w-32 h-32 mx-auto cursor-pointer select-none",
        className
      )}
      initial="idle"
      animate={isPopped ? "pop" : "idle"}
      variants={balloonVariants}
      onClick={!isPopped ? onClick : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full fill-primary stroke-primary-foreground"
      >
        {/* Balloon body */}
        <path
          d="M50 10 
             C20 10 20 50 50 90 
             C80 50 80 10 50 10 
             Z"
          strokeWidth="2"
        />
        {/* Balloon string */}
        <path
          d="M50 90 L50 95"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </motion.div>
  );
};

export default Balloon; 