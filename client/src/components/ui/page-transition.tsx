import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
  transitionType?: "fade" | "slide" | "scale" | "fancy";
}

// Variantes pour une transition en fondu (la plus subtile et polyvalente)
const fadeVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1], // Courbe d'accélération personnalisée pour un effet plus naturel
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

// Variantes pour une transition avec léger zoom et fondu
const scaleVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1], // Courbe d'accélération personnalisée
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.3,
    },
  },
};

// Variantes pour une transition avec glissement
const slideVariants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.3,
    },
  },
};

// Variantes pour une transition plus sophistiquée (avec un effet d'éclaircissement)
const fancyVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: "brightness(1.2) blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "brightness(1) blur(0px)",
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
    filter: "brightness(1.2) blur(2px)",
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.4,
    },
  },
};

// Variantes pour les éléments enfants (pour créer un effet cascade)
const childVariants = {
  hidden: { 
    opacity: 0,
    y: 15 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "tween",
      ease: [0.33, 1, 0.68, 1],
      duration: 0.4,
    }
  },
};

// Sélecteur de variantes en fonction du type de transition
const getVariants = (type: "fade" | "slide" | "scale" | "fancy") => {
  switch (type) {
    case "fade":
      return fadeVariants;
    case "slide":
      return slideVariants;
    case "scale":
      return scaleVariants;
    case "fancy":
      return fancyVariants;
    default:
      return scaleVariants;
  }
};

/**
 * Composant principal de transition de page - offre plusieurs styles d'animation
 */
export function PageTransition({ 
  children, 
  transitionType = "scale" 
}: PageTransitionProps) {
  const [isFirstMount, setIsFirstMount] = useState(true);
  
  // Déterminer si c'est le premier montage (évite l'animation initiale indésirable)
  useEffect(() => {
    // Marquer la première fois comme faite après le premier rendu
    const timer = setTimeout(() => setIsFirstMount(false), 10);
    return () => clearTimeout(timer);
  }, []);
  
  const variants = getVariants(transitionType);

  return (
    <motion.div
      initial={isFirstMount ? false : "hidden"}
      animate="visible"
      exit="exit"
      variants={variants}
      className="w-full h-full"
      style={{ 
        willChange: "opacity, transform",
        backfaceVisibility: "hidden"
      }}
    >
      <div className="page-content">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Composant pour les transitions d'éléments individuels à l'intérieur d'une page
 */
export function FadeInElement({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          type: "tween",
          ease: [0.33, 1, 0.68, 1],
          duration: 0.6,
          delay
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}