"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";

// 1. Single Item Reveal
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  
  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 30 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 2. Staggered Grid Container
export function StaggerGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. Stagger Item
export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div variants={reduce ? undefined : item} className={className}>
      {children}
    </motion.div>
  );
}
// 4. Hover Scale Effect (Wraps any card/image to expand on hover)
export function HoverScale({ 
  children, 
  scale = 1.05, // Default expansion amount (1.05 is subtle/premium)
  className = "" 
}: { 
  children: React.ReactNode; 
  scale?: number; 
  className?: string 
}) {
  return (
    <motion.div
      whileHover={{ scale: scale, zIndex: 10 }} // zIndex ensures it pops ON TOP of neighbors
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      style={{ transformOrigin: "center center" }} // Expands from center
    >
      {children}
    </motion.div>
  );
}