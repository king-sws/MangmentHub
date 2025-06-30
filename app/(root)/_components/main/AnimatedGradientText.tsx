
// AnimatedGradientText.jsx
"use client"

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientTextProps {
  text: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({ text }) => {
  return (
    <motion.span 
      className="relative inline-block"
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{
        background: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        padding: "0.25rem 0.5rem",
        margin: "0 -0.5rem",
        display: "inline-block"
      }}
    >
      {text}
    </motion.span>
  );
};