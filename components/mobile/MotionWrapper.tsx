"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function MotionWrapper({ children, delay = 0, className = "" }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }} // Triggers slightly before it fully enters the screen
      transition={{ 
        duration: 0.6, 
        delay: delay, 
        ease: [0.25, 0.46, 0.45, 0.94] // Premium "ease-out" cubic bezier curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}