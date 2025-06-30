"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

type TextGenerateEffectProps = {
  words?: string;
  className?: string;
};

export const TextGenerateEffect = ({ words, className }: TextGenerateEffectProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const text = words || "";
  
  useEffect(() => {
    // Reset when words prop changes
    setDisplayedText("");
    setCurrentIndex(0);
  }, [words]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, 30); // Adjust speed as needed
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
          className="inline-block"
        >
          |
        </motion.span>
      )}
    </span>
  );
};

