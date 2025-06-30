"use client"
import React from 'react';
import acmeLogo from '@/public/logo-acme.png';
import quantumLogo from '@/public/logo-quantum.png';
import echoLogo from '@/public/logo-echo.png';
import Image from 'next/image';
import pulseLogo from '@/public/logo-pulse.png';
import apexLogo from '@/public/logo-apex.png';
import { motion } from 'framer-motion';

const LogoTicker = () => {
  return (
    <div className="py-8 md:py-12 bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:from-gray-950 dark:to-gray-900 border-t border-gray-200/60 dark:border-gray-700/50">
      <div className="container mx-auto px-6">
        {/* Header text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-medium text-[#010D3E]/60 dark:text-gray-400 uppercase tracking-wider">
            Trusted by leading companies worldwide
          </p>
        </motion.div>

        {/* Logo ticker */}
        <div className="flex overflow-hidden" style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' 
        }}>
          <motion.div
            className="flex gap-16 md:gap-24 pr-16 md:pr-24 flex-none items-center"
            animate={{
              translateX: '-50%'
            }}
            transition={{
              repeat: Infinity,
              duration: 25,
              ease: 'linear',    
              repeatType: 'loop'        
            }}
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="logo-wrapper">
                  <Image 
                    src={acmeLogo} 
                    alt="Acme Logo" 
                    className="logo-ticker-img" 
                  />
                </div>
                <div className="logo-wrapper">
                  <Image 
                    src={quantumLogo} 
                    alt="Quantum Logo" 
                    className="logo-ticker-img" 
                  />
                </div>
                <div className="logo-wrapper">
                  <Image 
                    src={echoLogo} 
                    alt="Echo Logo" 
                    className="logo-ticker-img" 
                  />
                </div>
                <div className="logo-wrapper">
                  <Image 
                    src={pulseLogo} 
                    alt="Pulse Logo" 
                    className="logo-ticker-img" 
                  />
                </div>
                <div className="logo-wrapper">
                  <Image 
                    src={apexLogo} 
                    alt="Apex Logo" 
                    className="logo-ticker-img" 
                  />
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          transition: all 0.3s ease;
        }
        
        .logo-wrapper:hover {
          transform: scale(1.05);
        }
        
        .logo-ticker-img {
          height: 40px;
          width: auto;
          max-width: 120px;
          object-fit: contain;
          opacity: 0.6;
          transition: all 0.3s ease;
          filter: grayscale(100%) brightness(0) invert(0.2);
        }
        
        .dark .logo-ticker-img {
          filter: grayscale(100%) brightness(0) invert(0.8);
          opacity: 0.7;
        }
        
        .logo-wrapper:hover .logo-ticker-img {
          opacity: 0.9;
          filter: grayscale(0%) brightness(1) invert(0);
        }
        
        .dark .logo-wrapper:hover .logo-ticker-img {
          filter: grayscale(0%) brightness(1) invert(0);
        }
        
        @media (max-width: 768px) {
          .logo-ticker-img {
            height: 32px;
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default LogoTicker;