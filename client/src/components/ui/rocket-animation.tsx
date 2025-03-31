import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RocketAnimationProps {
  isActive: boolean;
}

// Types d'objets qui tombent
type FallingObjectType = 'pen' | 'pencil' | 'notebook' | 'paper' | 'eraser' | 'book';

interface FallingObject {
  id: number;
  type: FallingObjectType;
  x: number; // Position horizontale en pourcentage
  delay: number; // Délai avant de commencer à tomber
  rotation: number; // Rotation initiale
  scale: number; // Taille de l'objet
}

export const RocketAnimation: React.FC<RocketAnimationProps> = ({ isActive }) => {
  const [progress, setProgress] = useState(0);
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  
  // Génération d'objets qui tombent
  useEffect(() => {
    if (isActive) {
      const types: FallingObjectType[] = ['pen', 'pencil', 'notebook', 'paper', 'eraser', 'book'];
      const objectsCount = 15; // Nombre d'objets qui tombent
      
      const newObjects: FallingObject[] = [];
      for (let i = 0; i < objectsCount; i++) {
        newObjects.push({
          id: i,
          type: types[Math.floor(Math.random() * types.length)],
          x: Math.random() * 80 + 10, // Position entre 10% et 90% de la largeur
          delay: Math.random() * 3, // Délai aléatoire jusqu'à 3 secondes
          rotation: Math.random() * 360, // Rotation aléatoire
          scale: 0.7 + Math.random() * 0.6, // Taille entre 0.7 et 1.3
        });
      }
      
      setFallingObjects(newObjects);
    } else {
      setFallingObjects([]);
    }
  }, [isActive]);
  
  // Animation de progression qui simule le temps réel de chargement
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setProgress(prev => {
          // Progression plus lente au début et à la fin pour simuler une accélération et décélération
          const newProgress = prev + (prev < 20 ? 0.2 : prev > 80 ? 0.2 : 0.5);
          
          // Si on atteint 100%, on efface les objets qui tombent
          if (newProgress >= 100) {
            // Petit délai avant de supprimer les objets pour une transition plus douce
            setTimeout(() => {
              setFallingObjects([]); // Arrête la chute des objets
            }, 1000);
            return 100;
          }
          
          return newProgress;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  // Fonction pour rendre chaque type d'objet qui tombe
  const renderFallingObject = (object: FallingObject) => {
    switch (object.type) {
      case 'pen':
        return (
          <div className="relative" style={{ transform: `scale(${object.scale})` }}>
            <div className="bg-blue-600 rounded-full h-16 w-2"></div>
            <div className="absolute top-0 left-0 bg-blue-800 rounded-t-full h-3 w-2"></div>
            <div className="absolute bottom-0 left-0 border-t-4 border-l-transparent border-r-transparent border-t-gray-300 h-0 w-0" style={{ borderLeftWidth: '1px', borderRightWidth: '1px' }}></div>
          </div>
        );
      case 'pencil':
        return (
          <div className="relative" style={{ transform: `scale(${object.scale})` }}>
            <div className="bg-yellow-400 rounded-full h-14 w-2"></div>
            <div className="absolute top-0 left-0 bg-gray-700 rounded-t-full h-3 w-2"></div>
            <div className="absolute bottom-0 left-0 border-t-4 border-l-transparent border-r-transparent border-t-pink-300 h-0 w-0" style={{ borderLeftWidth: '1px', borderRightWidth: '1px' }}></div>
          </div>
        );
      case 'notebook':
        return (
          <div className="bg-blue-100 rounded-sm h-12 w-10 flex flex-col justify-start p-1" style={{ transform: `scale(${object.scale})` }}>
            <div className="border-b border-gray-400 w-full h-2 mb-1"></div>
            <div className="border-b border-gray-400 w-full h-2 mb-1"></div>
            <div className="border-b border-gray-400 w-full h-2"></div>
          </div>
        );
      case 'paper':
        return (
          <div className="bg-white rounded-sm h-12 w-10 flex flex-col justify-start p-1 shadow-md" style={{ transform: `scale(${object.scale})` }}>
            <div className="border-b border-gray-300 w-8 h-1 mb-1"></div>
            <div className="border-b border-gray-300 w-6 h-1 mb-1"></div>
            <div className="border-b border-gray-300 w-7 h-1"></div>
          </div>
        );
      case 'eraser':
        return (
          <div className="bg-pink-300 rounded-sm h-4 w-8" style={{ transform: `scale(${object.scale})` }}></div>
        );
      case 'book':
        return (
          <div className="relative" style={{ transform: `scale(${object.scale})` }}>
            <div className="bg-red-600 h-14 w-12 rounded-r-sm shadow-lg"></div>
            <div className="absolute top-2 left-2 bg-white h-10 w-9 rounded-r-sm"></div>
            <div className="absolute top-4 left-5 bg-gray-700 h-1 w-4"></div>
            <div className="absolute top-6 left-5 bg-gray-700 h-1 w-3"></div>
            <div className="absolute top-8 left-5 bg-gray-700 h-1 w-4"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-indigo-900 z-50 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Étoiles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => (
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
        
        {/* Lune (cible) avec animation de secousse */}
        <motion.div 
          className="absolute bg-gray-200 rounded-full overflow-hidden"
          style={{ 
            width: '120px', 
            height: '120px', 
            top: '15%', 
            left: '50%',
            marginLeft: '-60px',
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.7)' 
          }}
          animate={{
            x: [0, -5, 5, -7, 7, -5, 5, 0],
            y: [0, 5, -5, 7, -7, 5, -5, 0],
            rotate: [0, -1, 1, -2, 2, -1, 1, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          {/* Cratères */}
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '30px', height: '30px', top: '20%', left: '30%' }} />
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '20px', height: '20px', top: '60%', left: '20%' }} />
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '25px', height: '25px', top: '40%', left: '70%' }} />
          <div className="absolute bg-gray-300 rounded-full" style={{ width: '15px', height: '15px', top: '70%', left: '60%' }} />
        </motion.div>
        
        {/* Objets qui tombent */}
        {fallingObjects.map((object) => (
          <motion.div
            key={object.id}
            className="absolute z-10"
            style={{ 
              left: `${object.x}%`,
              top: '-50px'
            }}
            initial={{ y: -50, rotate: object.rotation }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: object.rotation + 360
            }}
            transition={{
              type: "physics",
              duration: 8 + Math.random() * 4,
              delay: object.delay,
              ease: "linear"
            }}
          >
            {renderFallingObject(object)}
          </motion.div>
        ))}
        

        
        {/* Texte informatif */}
        <div className="absolute bottom-10 text-center z-30 max-w-md px-4">
          <h2 className="text-white text-2xl font-bold mb-4">Création magique en cours</h2>
          <p className="text-gray-300">La lune secoue sa créativité et libère des idées pour composer votre histoire unique...</p>
          <div className="mt-6 w-full bg-gray-700 rounded-full h-4 relative overflow-hidden shadow-lg">
            <motion.div 
              className="absolute h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500"
              style={{ width: `${progress}%` }}
              animate={{
                background: ['linear-gradient(90deg, #8B5CF6, #6366F1)', 'linear-gradient(90deg, #6366F1, #8B5CF6)'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>
          <p className="text-white font-semibold mt-2 text-lg">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};