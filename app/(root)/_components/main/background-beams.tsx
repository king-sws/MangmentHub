"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";


interface BackgroundBeamsProps {
  className?: string;
  disabled?: boolean; // Optional prop to disable animations
}

export const BackgroundBeams = React.memo(({
  className,
  disabled = false
}: BackgroundBeamsProps) => {
  // Reduce the number of paths significantly
  const paths = disabled ? [] : [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
    "M-324 -253C-324 -253 -256 152 208 279C672 406 740 811 740 811",
    "M-296 -285C-296 -285 -228 120 236 247C700 374 768 779 768 779",
    "M-268 -317C-268 -317 -200 88 264 215C728 342 796 747 796 747",
    "M-240 -349C-240 -349 -172 56 292 183C756 310 824 715 824 715",
    "M-212 -381C-212 -381 -144 24 320 151C784 278 852 683 852 683",
    "M-184 -413C-184 -413 -116 -8 348 119C812 246 880 651 880 651",
    "M-156 -445C-156 -445 -88 -40 376 87C840 214 908 619 908 619",
    "M-128 -477C-128 -477 -60 -72 404 55C868 182 936 587 936 587",
    "M-100 -509C-100 -509 -32 -104 432 23C896 150 964 555 964 555",
    "M-72 -541C-72 -541 -4 -136 460 -9C924 118 992 523 992 523",
  ];
  
  // Add a state to control if animations should run based on visibility
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Only run animations when the component is in the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    const element = document.querySelector('#home');
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  // Don't render if animations are disabled
  if (disabled) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center [mask-repeat:no-repeat] [mask-size:40px]",
        className
      )}>
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875"
          stroke="url(#paint0_radial_242_278)"
          strokeOpacity="0.05"
          strokeWidth="0.5"></path>

        {isVisible && paths.map((path, index) => (
          <motion.path
            key={`path-` + index}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
            // Use simpler animations
            animate={{
              pathLength: [0, 1],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 8 + index % 4,
              repeat: Infinity,
              ease: "linear",
            }}
          ></motion.path>
        ))}
        <defs>
          {paths.map((path, index) => (
            <linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%">
              <stop stopColor="#18CCFC" stopOpacity="0"></stop>
              <stop offset="50%" stopColor="#6344F5"></stop>
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0"></stop>
            </linearGradient>
          ))}

          <radialGradient
            id="paint0_radial_242_278"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(352 34) rotate(90) scale(555 1560.62)">
            <stop offset="0.0666667" stopColor="#d4d4d4"></stop>
            <stop offset="0.243243" stopColor="#d4d4d4"></stop>
            <stop offset="0.43594" stopColor="white" stopOpacity="0"></stop>
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";