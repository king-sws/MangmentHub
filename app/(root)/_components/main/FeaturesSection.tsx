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

  const cardVariants = useMemo(() => {
    if (shouldReduceMotion) return {};
    return {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: 0.1,
          duration: 0.3,
          ease: "easeOut"
        }
      }
    };
  }, [shouldReduceMotion]);

  const getCategoryConfig = useCallback((cat: string) => {
    const configs = {
      'productivity': { 
        color: 'bg-emerald-600',
        textColor: 'text-emerald-700 dark:text-emerald-400',
      },
      'analytics': { 
        color: 'bg-orange-600',
        textColor: 'text-orange-700 dark:text-orange-400',
      },
      'security': { 
        color: 'bg-red-600',
        textColor: 'text-red-700 dark:text-red-400',
      },
      'collaboration': { 
        color: 'bg-purple-600',
        textColor: 'text-purple-700 dark:text-purple-400',
      },
      'automation': { 
        color: 'bg-blue-600',
        textColor: 'text-blue-700 dark:text-blue-400',
      },
      'infrastructure': { 
        color: 'bg-slate-600',
        textColor: 'text-slate-700 dark:text-slate-400',
      }
    };
    return configs[cat as keyof typeof configs] || configs.productivity;
  }, []);

  const categoryConfig = useMemo(() => getCategoryConfig(category), [category, getCategoryConfig]);

  // Professional card design - clean and simple
  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="
        relative h-full rounded-lg border bg-card text-card-foreground shadow-sm
        hover:shadow-md transition-shadow duration-200
        bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800
      ">
        <div className="p-6 space-y-6">
          {/* Header with icon and category */}
          <div className="flex items-center justify-between">
            <div className={`
              flex h-10 w-10 items-center justify-center rounded-lg
              ${categoryConfig.color}
            `}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            {isPopular && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900">
                Popular
              </span>
            )}
          </div>
          
          {/* Title and description */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-50">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>
          
          {/* Features list */}
          {features.length > 0 && (
            <ul className="space-y-2">
              {features.slice(0, 3).map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          {/* Metrics if available */}
          {metrics && (
            <div className="rounded-lg border bg-muted p-3 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{metrics}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with CTA */}
        <div className="border-t p-6 pt-4 border-gray-200 dark:border-gray-800">
          <button className="
            inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background 
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full
            border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900
          ">
            {ctaText}
          </button>
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
      features: ['Global CDN network', 'Auto-scaling infrastructure', 'Real-time monitoring'],
      category: 'infrastructure',
      variant: 'default' as const,
      metrics: '99.99% Uptime Guaranteed',
      ctaText: 'View Performance',
      isPopular: true
    },
    {
      icon: 'shield',
      title: 'Advanced Security',
      description: 'Bank-level security with comprehensive compliance, end-to-end encryption, and intelligent threat protection.',
      features: ['SOC 2 Type II certified', 'Zero-trust architecture', 'Advanced threat detection'],
      category: 'security',
      variant: 'default' as const,
      ctaText: 'Security Details'
    },
    {
      icon: 'users',
      title: 'Smart Collaboration',
      description: 'Seamless team workflows with intelligent permissions, comprehensive audit trails, and powerful integrations.',
      features: ['Role-based access control', 'Audit logging', 'SSO integration'],
      category: 'collaboration',
      variant: 'default' as const,
      ctaText: 'Try Collaboration'
    },
    {
      icon: 'bar-chart',
      title: 'Intelligent Analytics',
      description: 'Advanced insights with customizable dashboards, automated reporting, and predictive intelligence for better decisions.',
      features: ['Custom dashboards', 'Automated reports', 'Data export APIs'],
      category: 'analytics',
      variant: 'default' as const,
      metrics: '10x Faster Insights',
      ctaText: 'Explore Analytics'
    },
    {
      icon: 'cpu',
      title: 'Workflow Automation',
      description: 'Streamline operations with intelligent automation, custom triggers, and seamless third-party integrations.',
      features: ['Workflow automation', 'Custom integrations', 'API management'],
      category: 'automation',
      variant: 'default' as const,
      ctaText: 'Automate Now'
    },
    {
      icon: 'trending-up',
      title: 'Growth Intelligence',
      description: 'Comprehensive performance tracking with growth metrics, trend analysis, and actionable business insights.',
      features: ['Performance metrics', 'Trend analysis', 'Business insights'],
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
          duration: 0.4,
          ease: "easeOut"
        }
      }
    };
  }, [shouldReduceMotion]);

  return (
    <section className="relative py-24 sm:py-32">
      <EnterpriseBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          className="text-center mb-16"
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </div>
    </section>
  );
};

export default EnhancedFeaturesSection;