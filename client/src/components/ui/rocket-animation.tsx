import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RocketAnimationProps {
  isActive: boolean;
}

export const RocketAnimation: React.FC<RocketAnimationProps> = ({ isActive }) => {
  const [progress, setProgress] = useState(0);
  
  // Animation de progression qui simule le temps réel de chargement
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setProgress(prev => {
          // Progression plus lente au début et à la fin pour simuler une accélération et décélération
          const newProgress = prev + (prev < 20 ? 0.2 : prev > 80 ? 0.2 : 0.5);
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Étoiles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
        
        {/* Lune (cible) */}
        <motion.div 
          className="absolute bg-gray-200 rounded-full overflow-hidden"
          style={{ 
            width: '80px', 
            height: '80px', 
            top: '10%', 
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)' 
          }}
        >
          {/* Cratères */}
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '20px', height: '20px', top: '20%', left: '30%' }} />
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '15px', height: '15px', top: '60%', left: '20%' }} />
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '10px', height: '10px', top: '40%', left: '60%' }} />
        </motion.div>
        
        {/* Fusée */}
        <motion.div
          className="absolute"
          animate={{
            y: [300, -100],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
            times: [0, 1],
          }}
          style={{
            bottom: '0%',
          }}
        >
          {/* Corps de la fusée */}
          <div className="relative">
            {/* Pointe */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 -translate-y-full" 
              style={{
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: '30px solid #e53e3e',
                height: 0,
                width: 0,
              }}
            />
            
            {/* Corps principal */}
            <div 
              className="bg-gradient-to-b from-gray-200 to-gray-300 relative rounded-lg" 
              style={{ width: '60px', height: '120px' }}
            >
              {/* Hublot */}
              <div className="absolute bg-blue-200 rounded-full" style={{ width: '20px', height: '20px', top: '20px', left: '50%', transform: 'translateX(-50%)' }} />
              
              {/* Logo */}
              <div className="absolute text-xs font-bold" style={{ top: '50px', left: '50%', transform: 'translateX(-50%)' }}>
                <span className="text-indigo-600">AI</span>
              </div>
              
              {/* Ailes */}
              <div 
                className="absolute bg-gray-400" 
                style={{ 
                  width: '15px', 
                  height: '40px', 
                  bottom: '10px', 
                  left: '-15px',
                  borderTopLeftRadius: '5px',
                  borderBottomLeftRadius: '5px',
                }}
              />
              <div 
                className="absolute bg-gray-400" 
                style={{ 
                  width: '15px', 
                  height: '40px', 
                  bottom: '10px', 
                  right: '-15px',
                  borderTopRightRadius: '5px',
                  borderBottomRightRadius: '5px',
                }}
              />
            </div>
            
            {/* Feu de la fusée */}
            <motion.div 
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ bottom: '-60px' }}
              animate={{
                height: [40, 60, 40],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
            >
              <div 
                className="relative"
                style={{
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderBottom: '60px solid #f6ad55',
                  height: 0,
                  width: 0,
                }}
              >
                <motion.div 
                  className="absolute"
                  style={{
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: '40px solid #ed8936',
                    height: 0,
                    width: 0,
                    top: '10px',
                    left: '-10px',
                  }}
                />
                <motion.div 
                  className="absolute"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '30px solid #e53e3e',
                    height: 0,
                    width: 0,
                    top: '20px',
                    left: '-5px',
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Texte informatif */}
        <div className="absolute bottom-1/4 text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Génération en cours</h2>
          <p className="text-gray-300">Notre fusée IA voyage vers la lune pour récupérer votre histoire...</p>
          <div className="mt-6 w-64 bg-gray-700 rounded-full h-3 relative overflow-hidden">
            <motion.div 
              className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-300 mt-2">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};