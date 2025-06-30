/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

// Professional background matching the hero section
const FAQBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900" />
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
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-100/20 to-indigo-300/10 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-indigo-200/15 to-gray-100/5 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
    </div>
  );
};

type FAQItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
};

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle, index }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const contentVariants = {
    hidden: { 
      height: 0, 
      opacity: 0
    },
    visible: { 
      height: "auto", 
      opacity: 1,
      transition: { 
        height: {
          duration: 0.3,
          ease: "easeInOut"
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        }
      }
    }
  };

  return (
    <motion.div 
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "border-b border-gray-100 dark:border-gray-800 transition-colors duration-200"
      )}
    >
      <button
        className="flex justify-between items-center w-full py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${index}`}
      >
        <h3 className={cn(
          "text-base font-medium transition-colors duration-200 pr-8",
          isOpen 
            ? "text-gray-900 dark:text-gray-100" 
            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        )}>
          {question}
        </h3>
        
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200",
          isOpen 
            ? "text-gray-600 dark:text-gray-400" 
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        )}>
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </motion.div>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`faq-content-${index}`}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="pb-4 pr-10">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

type FAQSectionProps = {
  sectionTitle: string;
  sectionSubtitle: string;
  faqs: { question: string; answer: string }[];
  badgeText?: string;
};

const FAQSection: React.FC<FAQSectionProps> = ({ 
  sectionTitle, 
  sectionSubtitle, 
  faqs, 
  badgeText = "Support"
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      }
    }
  };

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden">
      <FAQBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean Section Header */}
        <motion.div
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Simple badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium mb-4">
            <HelpCircle className="w-3 h-3 mr-1.5" />
            {badgeText}
          </div>
         
          <h2 className="text-3xl mb-6 sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
            Frequently Asked Questions
          </h2>
         
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>
        
        {/* FAQ Container */}
        <motion.div 
          className="max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {faqs.map((faq, index) => (
                <div key={index} className="px-6 first:rounded-t-xl last:rounded-b-xl">
                  <FAQItem
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onToggle={() => handleToggle(index)}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Simple CTA */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="inline-flex items-center justify-center p-4 rounded-lg bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400 mr-4">
              Need more help?
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
            >
              Contact support
              <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;