import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Wait for exit animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Glow */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full"
          />

          <div className="relative flex flex-col items-center">
            {/* Logo Icon */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
            >
              <TrendingUp size={40} className="text-black" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
                XAUUSD <span className="text-emerald-500">PRO</span> ANALYZER
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] opacity-80">
                Institutional Trading Intelligence
              </p>
            </motion.div>

            {/* Loading Bar */}
            <div className="mt-12 w-48 h-[2px] bg-zinc-900 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-1/2"
              />
            </div>
          </div>

          {/* Bottom Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 text-[10px] text-zinc-500 font-mono uppercase tracking-widest"
          >
            v2.0 • Secure Connection Established
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
