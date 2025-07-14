"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Star, Users, TrendingUp, Shield, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import Link from 'next/link';
import starImg from '@/public/star.png';
import springImg from '@/public/spring.png';

// Professional background component
const CTABackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-slate-950" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(71,85,105,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(71,85,105,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-300/20 dark:from-emerald-800/30 dark:to-teal-700/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-tr from-cyan-200/25 to-emerald-200/15 dark:from-cyan-700/25 dark:to-emerald-700/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Additional accent orbs */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-100/10 via-teal-100/10 to-cyan-100/10 dark:from-emerald-800/10 dark:via-teal-800/10 dark:to-cyan-800/10 rounded-full blur-3xl" />
    </div>
  );
};

// Floating icon component
const FloatingIcon: React.FC<{ 
  icon: React.ReactNode; 
  className?: string;
  delay?: number;
}> = ({ icon, className = "", delay = 0 }) => {
  return (
    <motion.div
      className={cn(
        "absolute p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
        className
      )}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    >
      {icon}
    </motion.div>
  );
};

// Social proof component
const SocialProof: React.FC = () => {
  return (
    <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600 dark:text-gray-400"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-600" />
        <span className="font-medium">10,000+ teams trust us</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        <span className="font-medium">40% avg. productivity boost</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-600" />
        <span className="font-medium">Enterprise-grade security</span>
      </div>
    </motion.div>
  );
};

// Value proposition bullets
const ValueProps: React.FC = () => {
  const props = [
    "No credit card required",
    "Setup in under 5 minutes",
    "Cancel anytime"
  ];

  return (
    <motion.div 
      className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      viewport={{ once: true }}
    >
      {props.map((prop, index) => (
        <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{prop}</span>
        </div>
      ))}
    </motion.div>
  );
};

export const CallToAction: React.FC = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });
  
  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [15, -15]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section 
      id="help" 
      ref={sectionRef} 
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <CTABackground />
      
      {/* Floating decorative elements */}
      <FloatingIcon 
        icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
        className="top-20 left-[10%] hidden lg:block"
        delay={0}
      />
      <FloatingIcon 
        icon={<Zap className="w-4 h-4 text-amber-600" />}
        className="top-32 right-[15%] hidden lg:block"
        delay={1}
      />
      <FloatingIcon 
        icon={<Star className="w-4 h-4 text-rose-500" />}
        className="bottom-32 left-[20%] hidden lg:block"
        delay={2}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-4xl mx-auto relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Original floating images with enhanced animations */}
          <motion.div
            style={{ translateY, rotateX }}
            className="hidden md:block absolute -left-[280px] top-[20px]"
          >
            <Image 
              src={starImg} 
              alt="Star decoration" 
              width={280} 
              height={280}
              className="opacity-70 hover:opacity-90 transition-opacity duration-300"
            />
          </motion.div>
          
          <motion.div
            style={{ translateY, rotateX }}
            className="hidden md:block absolute -right-[260px] top-[40px]"
          >
            <Image 
              src={springImg} 
              alt="Spring decoration" 
              width={280} 
              height={280}
              className="opacity-70 hover:opacity-90 transition-opacity duration-300"
            />
          </motion.div>

          {/* Content container */}
          <div className="relative p-8 lg:p-12">
            {/* Urgency Badge */}
            <motion.div
              variants={itemVariants}
              className=" justify-center mb-6 hidden lg:flex"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 backdrop-blur text-emerald-800 dark:text-emerald-200 text-sm font-semibold shadow-lg border border-emerald-200/50 dark:border-emerald-700/50">
                <Sparkles className="w-3 h-3 mr-2" />
                Limited Time: 50% Off First 3 Months
              </div>
            </motion.div>

            {/* Main heading - more compelling and specific */}
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-center mb-6"
            >
              <span className="bg-gradient-to-b from-gray-900 to-slate-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Team's Productivity
              </span>
            </motion.h1>

            {/* Stronger value proposition */}
            <motion.p 
              variants={itemVariants}
              className="text-lg lg:text-xl text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8"
            >
              Join thousands of high-performing teams who've already increased their output by 40% with our proven project management platform
            </motion.p>

            {/* Value props */}
            <motion.div variants={itemVariants}>
              <ValueProps />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8"
            >
              <Link href="/sign-up" className="inline-block">
                <motion.button
                  variants={buttonVariants}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(16, 185, 129, 0.25)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-emerald-500/20"
                >
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Button content */}
                  <span className="relative flex items-center text-lg">
                    Start Free Trial
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                </motion.button>
              </Link>
              
              
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants}>
              <SocialProof />
            </motion.div>

            {/* Urgency text */}
            <motion.p 
              variants={itemVariants}
              className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
            >
              <strong className="text-emerald-600">⚡ Special offer ends in 7 days</strong> · Trusted by Fortune 500 companies
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;