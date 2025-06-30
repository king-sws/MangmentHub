"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";

type GradientScheme = 
  | "blue-purple" 
  | "cyan-blue" 
  | "green-blue" 
  | "amber-orange" 
  | "rose-pink" 
  | "indigo-violet" 
  | "emerald-teal"
  | "custom";

interface BackgroundGradientProps {
  children: ReactNode;
  className?: string;
  colorScheme?: GradientScheme;
  animate?: boolean;
  intensity?: "subtle" | "medium" | "high";
  borderGlow?: boolean;
  customColors?: {
    from: string;
    to: string;
  };
  interactive?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export const BackgroundGradient = ({ 
  children, 
  className = "",
  colorScheme = "blue-purple",
  animate = false,
  intensity = "medium",
  borderGlow = false,
  customColors,
  interactive = false,
  rounded = "lg"
}: BackgroundGradientProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  // Get gradient colors based on scheme and intensity
  const getGradientColors = () => {
    if (colorScheme === "custom" && customColors) {
      return {
        from: customColors.from,
        to: customColors.to
      };
    }

    const intensityValues = {
      subtle: { opacity: "10" },
      medium: { opacity: "20" },
      high: { opacity: "30" }
    };

    const opacity = intensityValues[intensity].opacity;

    const schemeColors = {
      "blue-purple": { from: `blue-500/${opacity}`, to: `violet-500/${opacity}` },
      "cyan-blue": { from: `cyan-500/${opacity}`, to: `blue-500/${opacity}` },
      "green-blue": { from: `green-500/${opacity}`, to: `blue-500/${opacity}` },
      "amber-orange": { from: `amber-400/${opacity}`, to: `orange-500/${opacity}` },
      "rose-pink": { from: `rose-400/${opacity}`, to: `pink-600/${opacity}` },
      "indigo-violet": { from: `indigo-500/${opacity}`, to: `violet-600/${opacity}` },
      "emerald-teal": { from: `emerald-400/${opacity}`, to: `teal-500/${opacity}` }
    };

    type PresetScheme = keyof typeof schemeColors;

    return schemeColors[colorScheme as PresetScheme];
  };

  // For interactive gradient that follows mouse movement
  useEffect(() => {
    if (!interactive || !elementRef) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const updateDimensions = () => {
      if (elementRef) {
        setDimensions({
          width: elementRef.offsetWidth,
          height: elementRef.offsetHeight
        });
      }
    };

    // Initialize dimensions
    updateDimensions();

    // Add event listeners
    elementRef.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", updateDimensions);

    return () => {
      elementRef.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [elementRef, interactive]);

  // Animation variants for animated gradient
  const gradientVariants = {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const { from, to } = getGradientColors();
  const roundedClass = rounded === "none" ? "" : `rounded-${rounded}`;
  
  return (
    <div 
      className={`relative ${className}`}
      ref={setElementRef}
    >
      {/* Gradient background */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-r from-${from} to-${to} ${roundedClass} ${borderGlow ? 'shadow-glow' : 'blur-md'}`}
        variants={animate ? gradientVariants : undefined}
        animate={animate ? "animate" : undefined}
        style={interactive && dimensions.width > 0 ? {
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, var(--tw-gradient-from), var(--tw-gradient-to))`,
        } : undefined}
      />
      
      {/* Additional subtle glow effect for high intensity */}
      {intensity === "high" && (
        <div className={`absolute inset-0 ${roundedClass} opacity-40 blur-xl bg-gradient-to-r from-${from} to-${to}`} />
      )}
      
      {/* Border glow effect */}
      {borderGlow && (
        <div className={`absolute inset-0 ${roundedClass} border border-white/20`} />
      )}
      
      <div className={`relative z-10 ${roundedClass}`}>{children}</div>
    </div>
  );
};