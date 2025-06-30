/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

const useTextSwitcher = (words: string[]) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [words.length]);
  return index;
};

const EnterpriseGradientText = ({ text }: { text: string }) => (
  <span className="bg-gradient-to-b from-black to-[#001E80]  dark:from-purple-300 dark:via-indigo-200 dark:to-blue-300 bg-clip-text text-transparent font-extrabold">
    {text}
  </span>
);

const EnterpriseBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:from-gray-950 dark:via-black dark:to-gray-900" />
    <div 
      className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }}
    />
    <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-indigo-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-indigo-100/25 to-blue-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
  </div>
);

const TrustBadges = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.6 }}
    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
  >
    {[
      {
        icon: <div className="flex gap-1">{Array(5).fill(null).map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
        ))}</div>,
        text: "4.9/5 from 10,000+ reviews"
      },
      {
        icon: <Check className="h-3 w-3 text-green-600 dark:text-green-500" />,
        text: "SOC 2 Type II Certified"
      },
      {
        icon: <Sparkles className="h-3 w-3 text-[#010D3E] dark:text-gray-400" />,
        text: "Trusted by Fortune 500 teams"
      }
    ].map((item, idx) => (
      <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/50 rounded-full shadow-sm">
        {item.icon}
        <span className="text-xs font-medium text-[#010D3E] dark:text-gray-300">{item.text}</span>
      </div>
    ))}
  </motion.div>
);

const EnterpriseCTA = () => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.6 }}
    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
  >
    <Button 
      asChild
      size="lg"
      className="group px-10 py-4 bg-gradient-to-b from-[#1e40af] to-[#3b82f6] dark:bg-white text-white dark:text-white hover:from-[#1d4ed8] hover:to-[#2563eb] dark:hover:bg-gray-100 font-semibold text-base transition duration-300 shadow-md hover:shadow-lg"
    >
      <Link href="/sign-up" className="flex items-center gap-2">
        Start Free Trial
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
    
    <Button 
      asChild
      variant="outline"
      size="lg"
      className="group px-10 py-4 border-2 border-[#001E80]/30 dark:border-gray-600 text-[#001E80] dark:text-gray-300 hover:bg-[#D2DCFF]/50 dark:hover:bg-gray-800/50 font-semibold text-base"
    >
      <Link href="/demo" className="flex items-center gap-2">
        <Play className="h-4 w-4" />
        Watch Demo
      </Link>
    </Button>
  </motion.div>
);

const EnterpriseStats = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7, duration: 0.6 }}
    className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
  >
    {[
      { number: "10K+", label: "Active Users" },
      { number: "99.99%", label: "Uptime SLA" },
      { number: "1M+", label: "Tasks Completed" }
    ].map((stat, i) => (
      <div key={i} className="text-center">
        <div className="text-3xl font-bold text-[#010D3E] dark:text-white mb-1">{stat.number}</div>
        <div className="text-sm text-[#010D3E]/70 dark:text-gray-400">{stat.label}</div>
      </div>
    ))}
  </motion.div>
);

const EnterpriseHeroSection = () => {
  const keywords = ["Productivity", "Security", "Scalability", "Speed", "Teamwork"];
  const current = useTextSwitcher(keywords);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 80,
        damping: 20,
        duration: 0.8 
      }
    }
  };

  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden pt-20">
      <EnterpriseBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
          <TrustBadges />

          <motion.div variants={itemVariants} className="max-w-5xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-[#010D3E] dark:text-white leading-[0.9] tracking-tight">
              <span className="block mb-3">The Future of</span>
              <span className="block mb-3">Enterprise</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={current}
                  initial={{ y: 30, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -30, opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="inline-block"
                >
                  <EnterpriseGradientText text={keywords[current]} />
                </motion.span>
              </AnimatePresence>
            </h1>
          </motion.div>

          <motion.p 
            variants={itemVariants} 
            className="text-lg sm:text-xl text-[#010D3E]/80 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal text-balance mb-12"
          >
            Empower your team with lightning-fast infrastructure, enterprise-grade reliability, and tools they actually want to use.
          </motion.p>

          <EnterpriseCTA />
          <EnterpriseStats />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#001E80]/20 dark:via-gray-700 to-transparent" />
    </section>
  );
};

export default EnterpriseHeroSection;