
// GlowingButton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface GlowingButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export const GlowingButton: React.FC<GlowingButtonProps> = ({ children, href, className = "" }) => {
  return (
    <Link href={href}>
      <motion.div
        className={`relative group ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-70 blur-lg group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Button content */}
        <div className="relative flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium text-white">
          {children}
        </div>
      </motion.div>
    </Link>
  );
};