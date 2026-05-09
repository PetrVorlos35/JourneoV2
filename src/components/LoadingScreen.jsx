import { motion } from 'framer-motion';
import JourneoLogo from '../assets/Journeo_whitelogo.png';
import BlurText from "../BlurText";

const LoadingScreen = ({ onComplete }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white z-50"
    >
      <img src={JourneoLogo} alt="Journeo Logo" className="w-28 mb-8" />
      <BlurText
        text="Journeo"
        delay={150}
        animateBy="letters"
        direction="top"
        className="text-8xl font-bold mb-8"
        onAnimationComplete={() => {
          setTimeout(onComplete, 1000);
        }}
      />
    </motion.div>
  );
};

export default LoadingScreen;
