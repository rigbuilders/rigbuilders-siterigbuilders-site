"use client";

import { motion, useInView, useAnimation, useReducedMotion, Variants } from "framer-motion";
import { useEffect, useRef } from "react";

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

// 1. Single Item Reveal (Manual Control)
export function Reveal({ children, delay = 0, className = "" }: WrapperProps) {
  const ref = useRef(null);
  // Detects when the element is in view (once: true means it won't hide again)
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const controls = useAnimation();
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    // If in view OR if user prefers reduced motion, show content immediately
    if (isInView || shouldReduce) {
      controls.start("visible");
    }
  }, [isInView, controls, shouldReduce]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 2. Staggered Grid Container (Orchestrator)
export function StaggerGrid({ children, className = "" }: WrapperProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const controls = useAnimation();
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (isInView || shouldReduce) {
      controls.start("show");
    }
  }, [isInView, controls, shouldReduce]);

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
      ref={ref}
      variants={container}
      initial="hidden"
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. Stagger Item (Child)
// Note: This relies on the parent StaggerGrid to trigger "show"
export function StaggerItem({ children, className = "" }: WrapperProps) {
  const shouldReduce = useReducedMotion();
  
  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={shouldReduce ? undefined : item} 
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 4. Hover Scale Effect (Interactive)
export function HoverScale({ 
  children, 
  scale = 1.05, 
  className = "" 
}: { 
  children: React.ReactNode; 
  scale?: number; 
  className?: string 
}) {
  return (
    <motion.div
      whileHover={{ scale: scale, zIndex: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      style={{ transformOrigin: "center center" }}
    >
      {children}
    </motion.div>
  );
}