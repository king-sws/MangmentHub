/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Calendar, 
  Target, 
  Users, 
  BarChart2, 
  AlertCircle, 
  Settings,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Star,
  TrendingUp,
  Lock,
  Cpu,
  Award,
  Building2,
  ChevronRight,
  ExternalLink,
  Play,
  Check,
  Sparkles
} from 'lucide-react';

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  index: number;
  features?: string[];
  category: string;
  isPopular?: boolean;
  variant?: 'default' | 'minimal' | 'detailed' | 'showcase';
  metrics?: string;
  ctaText?: string;
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  index, 
  features = [], 
  category, 
  isPopular = false,
  variant = 'default',
  metrics,
  ctaText = 'Learn More'
}: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const IconComponent = useMemo(() => {
    const iconMap = {
      'calendar': Calendar,
      'target': Target,
      'users': Users,
      'bar-chart': BarChart2,
      'alert-circle': AlertCircle,
      'settings': Settings,
      'shield': Shield,
      'zap': Zap,
      'globe': Globe,
      'cpu': Cpu,
      'lock': Lock,
      'trending-up': TrendingUp
    };
    return iconMap[icon as keyof typeof iconMap] || Settings;
  }, [icon]);

  // More professional animation - subtle fade-in without staggering
  const cardVariants = useMemo(() => {
    if (shouldReduceMotion) return {};
    return {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: 0.1, // Minimal delay for all cards
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1] // Professional easing
        }
      }
    };
  }, [shouldReduceMotion]);

  const getCategoryConfig = useCallback((cat: string) => {
    const configs = {
      'productivity': { 
        color: 'bg-gradient-to-br from-[#7c3aed] to-[#6366f1]',
        bgColor: 'bg-gradient-to-br from-purple-50/80 to-indigo-50/70 dark:bg-gradient-to-br dark:from-purple-950/30 dark:to-indigo-950/20',
        borderColor: 'border-purple-200/50 dark:border-purple-800/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        glowColor: 'shadow-purple-500/15 dark:shadow-purple-400/8'
      },
      'analytics': { 
        color: 'bg-gradient-to-br from-[#6366f1] to-[#3b82f6]',
        bgColor: 'bg-gradient-to-br from-indigo-50/80 to-blue-50/70 dark:bg-gradient-to-br dark:from-indigo-950/30 dark:to-blue-950/20',
        borderColor: 'border-indigo-200/50 dark:border-indigo-800/30',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        glowColor: 'shadow-indigo-500/15 dark:shadow-indigo-400/8'
      },
      'security': { 
        color: 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]',
        bgColor: 'bg-gradient-to-br from-blue-50/80 to-blue-100/70 dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-blue-900/20',
        borderColor: 'border-blue-200/50 dark:border-blue-800/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        glowColor: 'shadow-blue-500/15 dark:shadow-blue-400/8'
      },
      'collaboration': { 
        color: 'bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#3b82f6]',
        bgColor: 'bg-gradient-to-br from-purple-50/80 via-indigo-50/70 to-blue-50/60 dark:bg-gradient-to-br dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-blue-950/10',
        borderColor: 'border-indigo-200/50 dark:border-indigo-800/30',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        glowColor: 'shadow-indigo-500/15 dark:shadow-indigo-400/8'
      },
      'automation': { 
        color: 'bg-gradient-to-br from-[#6366f1] to-[#7c3aed]',
        bgColor: 'bg-gradient-to-br from-indigo-50/80 to-purple-50/70 dark:bg-gradient-to-br dark:from-indigo-950/30 dark:to-purple-950/20',
        borderColor: 'border-purple-200/50 dark:border-purple-800/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        glowColor: 'shadow-purple-500/15 dark:shadow-purple-400/8'
      },
      'infrastructure': { 
        color: 'bg-gradient-to-br from-[#3b82f6] to-[#1e40af]',
        bgColor: 'bg-gradient-to-br from-blue-50/80 to-slate-50/70 dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-slate-950/20',
        borderColor: 'border-blue-200/50 dark:border-blue-800/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        glowColor: 'shadow-blue-500/15 dark:shadow-blue-400/8'
      }
    };
    return configs[cat as keyof typeof configs] || configs.productivity;
  }, []);

  const categoryConfig = useMemo(() => getCategoryConfig(category), [category, getCategoryConfig]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Enhanced showcase variant
  if (variant === 'showcase') {
    return (
      <motion.div
        ref={cardRef}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="group relative h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`
          relative h-full overflow-hidden rounded-3xl 
          bg-white/98 dark:bg-gray-900/98 
          border border-gray-200/60 dark:border-gray-700/60
          transition-all duration-300 ease-out
          ${isHovered ? `scale-[1.01] ${categoryConfig.glowColor} shadow-xl` : 'shadow-lg'}
        `}>
          {/* Subtle animated border on hover */}
          <div className={`
            absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
            bg-gradient-to-r ${categoryConfig.color.replace('bg-gradient-to-br', '')}
          `} style={{ padding: '1px' }}>
            <div className="h-full w-full rounded-3xl bg-white/98 dark:bg-gray-900/98" />
          </div>
          
          {/* Popular badge */}
          {isPopular && (
            <div className="absolute top-6 right-6 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6] text-white text-xs font-semibold rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </div>
            </div>
          )}
          
          {/* Top accent line */}
          <div className={`h-1 ${categoryConfig.color}`} />
          
          <div className="relative p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className={`
                p-4 rounded-2xl ${categoryConfig.color} shadow-lg
                transition-all duration-300
                ${isHovered ? 'scale-105' : 'scale-100'}
              `}>
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div className={`
                px-3 py-1.5 rounded-full text-xs font-medium border
                ${categoryConfig.textColor} ${categoryConfig.borderColor} ${categoryConfig.bgColor}
              `}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
            </div>
            
            {/* Content */}
            <h3 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
              {title}
            </h3>
            
            <div className="space-y-6 mb-8">
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                {description}
              </p>
              
              {metrics && (
                <div className={`
                  p-4 rounded-xl border 
                  ${categoryConfig.bgColor} ${categoryConfig.borderColor}
                `}>
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${categoryConfig.textColor}`} />
                    <span className={`font-semibold ${categoryConfig.textColor}`}>{metrics}</span>
                  </div>
                </div>
              )}
              
              {features.length > 0 && (
                <ul className="space-y-3">
                  {features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* CTA Section */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-3 w-full">
                <button className={`
                  flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                  ${categoryConfig.color} text-white font-semibold
                  transition-all duration-200 hover:opacity-90 hover:scale-[1.01]
                  shadow-lg hover:shadow-xl
                `}>
                  {ctaText}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button className="
                  p-3 rounded-xl border border-gray-200 dark:border-gray-700
                  bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-all duration-200 hover:scale-105
                ">
                  <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Enhanced default variant
  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="group h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`
        relative h-full overflow-hidden rounded-2xl
        bg-white/98 dark:bg-gray-900/98 
        border border-gray-200/60 dark:border-gray-700/60
        transition-all duration-300 ease-out
        ${isHovered ? 'scale-[1.01] shadow-lg' : 'shadow-md'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className={`
              px-3 py-1 rounded-full text-xs font-medium border
              ${categoryConfig.textColor} ${categoryConfig.borderColor} ${categoryConfig.bgColor}
            `}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </div>
            {isPopular && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-xs font-medium rounded-full shadow-md">
                <Star className="w-3 h-3 fill-current" />
                Popular
              </div>
            )}
          </div>
          
          {/* Icon and title */}
          <div className="flex items-start gap-4 mb-6">
            <div className={`
              p-3 rounded-xl ${categoryConfig.color} shadow-lg
              transition-all duration-300
              ${isHovered ? 'scale-105' : 'scale-100'}
            `}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
          </div>
          
          {/* Description and features */}
          <div className="space-y-4 mb-6">
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {description}
            </p>
            {features.length > 0 && (
              <ul className="space-y-2">
                {features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* CTA */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <button className="
              w-full flex items-center justify-between px-4 py-3 
              border border-gray-200 dark:border-gray-700 rounded-xl
              bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all duration-200 hover:scale-[1.01]
            ">
              <span className="font-medium text-gray-700 dark:text-gray-300">{ctaText}</span>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TrustIndicators = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.4 }}
    viewport={{ once: true }}
    className="flex flex-wrap items-center justify-center gap-4 mb-16"
  >
    {[
      { icon: Shield, text: "SOC 2 Certified", color: "text-blue-600 dark:text-blue-400" },
      { icon: Award, text: "99.99% Uptime", color: "text-indigo-600 dark:text-indigo-400" },
      { icon: Globe, text: "Global Scale", color: "text-purple-600 dark:text-purple-400" },
      { icon: Building2, text: "Enterprise Ready", color: "text-blue-600 dark:text-blue-400" }
    ].map((item, idx) => (
      <div key={idx} className="
        flex items-center gap-2 px-4 py-2 
        bg-white/95 dark:bg-gray-900/90 
        border border-gray-200/50 dark:border-gray-700/50 
        rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]
      ">
        <item.icon className={`h-4 w-4 ${item.color}`} />
        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
      </div>
    ))}
  </motion.div>
);

// Fixed background with stable colors
const EnterpriseBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Stable gradient background - no flickering */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900" />      
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Subtle decorative elements - more stable */}
      <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-br from-indigo-100/10 to-purple-100/5 dark:from-indigo-900/8 dark:to-purple-900/4 rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-20 w-72 h-72 bg-gradient-to-tr from-blue-100/10 to-indigo-100/5 dark:from-blue-900/8 dark:to-indigo-900/4 rounded-full blur-3xl" />
    </div>
  );
};

const EnhancedFeaturesSection = () => {
  const shouldReduceMotion = useReducedMotion();
  
  const features = useMemo(() => [
    {
      icon: 'zap',
      title: 'Lightning Performance',
      description: 'Enterprise-grade infrastructure with blazing-fast response times and global edge locations for optimal user experience.',
      features: ['Global CDN network', 'Auto-scaling infrastructure', 'Real-time monitoring', 'Performance analytics'],
      category: 'infrastructure',
      variant: 'showcase' as const,
      metrics: '99.99% Uptime Guaranteed',
      ctaText: 'View Performance',
    },
    {
      icon: 'shield',
      title: 'Advanced Security',
      description: 'Bank-level security with comprehensive compliance, end-to-end encryption, and intelligent threat protection.',
      features: ['SOC 2 Type II certified', 'Zero-trust architecture', 'Advanced threat detection', 'Compliance reporting'],
      category: 'security',
      variant: 'default' as const,
      ctaText: 'Security Details'
    },
    {
      icon: 'users',
      title: 'Smart Collaboration',
      description: 'Seamless team workflows with intelligent permissions, comprehensive audit trails, and powerful integrations.',
      features: ['Role-based access control', 'Audit logging', 'SSO integration', 'Real-time collaboration'],
      category: 'collaboration',
      variant: 'default' as const,
      ctaText: 'Try Collaboration'
    },
    {
      icon: 'bar-chart',
      title: 'Intelligent Analytics',
      description: 'Advanced insights with customizable dashboards, automated reporting, and predictive intelligence for better decisions.',
      features: ['Custom dashboards', 'Automated reports', 'Data export APIs', 'Real-time insights'],
      category: 'analytics',
      variant: 'showcase' as const,
      metrics: '10x Faster Insights',
      ctaText: 'Explore Analytics'
    },
    {
      icon: 'cpu',
      title: 'Workflow Automation',
      description: 'Streamline operations with intelligent automation, custom triggers, and seamless third-party integrations.',
      features: ['Workflow automation', 'Custom integrations', 'API management', 'Smart triggers'],
      category: 'automation',
      variant: 'default' as const,
      ctaText: 'Automate Now'
    },
    {
      icon: 'trending-up',
      title: 'Growth Intelligence',
      description: 'Comprehensive performance tracking with growth metrics, trend analysis, and actionable business insights.',
      features: ['Performance metrics', 'Trend analysis', 'Business insights', 'Predictive analytics'],
      category: 'productivity',
      variant: 'default' as const,
      ctaText: 'Track Growth'
    }
  ], []);

  const headerVariants = useMemo(() => {
    if (shouldReduceMotion) return {};
    return {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }
    };
  }, [shouldReduceMotion]);

  // Remove staggered animations for more professional look
  const containerVariants = useMemo(() => {
    if (shouldReduceMotion) return {};
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.3
        }
      }
    };
  }, [shouldReduceMotion]);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <EnterpriseBackground />
      
      {/* More subtle top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200/60 dark:via-gray-700/60 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
  className="text-center mb-16 lg:mb-20"
  variants={headerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
>
  <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-full">
    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    <span className="font-medium text-indigo-700 dark:text-indigo-300">Enterprise Interface</span>
  </div>
 
    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text mb-6 leading-tight">
    Enterprise-Grade Features
  </h2>
 
  <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
    Experience unparalleled efficiency with our intuitive platform designed for enterprise teams.
    Built for scale, optimized for performance, trusted by industry leaders.
  </p>
 

          <TrustIndicators />
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              features={feature.features}
              category={feature.category}
              isPopular={feature.isPopular}
              index={index}
              variant={feature.variant}
              metrics={feature.metrics}
              ctaText={feature.ctaText}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default EnhancedFeaturesSection;