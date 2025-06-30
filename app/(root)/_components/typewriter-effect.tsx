// components/ui/typewriter-effect.jsx
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming you have a utils file for class merging

type TypewriterEffectProps = {
  words: string[];
  className?: string;
};

export const TypewriterEffect = ({ words, className }: TypewriterEffectProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const typingDelay = 150; // Delay between each character when typing
    const deletingDelay = 75; // Delay between each character when deleting
    const wordDelay = 2000; // Delay before starting to delete the word
    
    // If we have no words, don't try to animate
    if (!words || words.length === 0) return;
    
    let timer: ReturnType<typeof setTimeout>;
    
    if (!isDeleting) {
      // Typing animation
      if (currentText !== words[currentWordIndex]) {
        timer = setTimeout(() => {
          setCurrentText(words[currentWordIndex].substring(0, currentText.length + 1));
        }, typingDelay);
      } 
      // When finished typing the word
      else if (currentText === words[currentWordIndex]) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, wordDelay);
      }
    } else {
      // Deleting animation
      if (currentText !== "") {
        timer = setTimeout(() => {
          setCurrentText(words[currentWordIndex].substring(0, currentText.length - 1));
        }, deletingDelay);
      } 
      // When finished deleting the word
      else {
        setIsDeleting(false);
        setCurrentWordIndex((currentWordIndex + 1) % words.length);
      }
    }
    
    return () => clearTimeout(timer);
  }, [currentText, currentWordIndex, isDeleting, words]);

  return (
    <motion.span
      className={cn("inline-block", className)}
      key={currentWordIndex}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {currentText || " "}
    </motion.span>
  );
};