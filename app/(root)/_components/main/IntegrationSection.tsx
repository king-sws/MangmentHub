"use client";

import React, { Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, MessageSquare, Mail, Github, Slack, Clock,
  BarChart3, Zap, Users, CheckCircle2, Star, ArrowRight 
} from 'lucide-react';
import { MdOutlineStar } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  status: 'available' | 'coming-soon' | 'beta';
}

const integrations: Integration[] = [
  {
    id: '1',
    name: 'Slack',
    description: 'Stay updated with instant team updates and channel-specific notifications.',
    icon: <Slack className="w-12 h-12 text-purple-500 dark:text-purple-400" />,
    features: ['Team updates', 'Channel alerts', 'Custom workflows'],
    isPopular: true,
    status: 'available',
  },
  {
    id: '2',
    name: 'Google Calendar',
    description: 'Sync events, tasks and receive smart scheduling reminders.',
    icon: <Calendar className="w-12 h-12 text-blue-500 dark:text-blue-400" />,
    features: ['Two-way sync', 'Smart reminders', 'Meeting tasks'],
    isPopular: true,
    status: 'available',
  },
  {
    id: '3',
    name: 'GitHub',
    description: 'Link commits, auto-create issues, and keep your dev flow aligned.',
    icon: <Github className="w-12 h-12 text-gray-800 dark:text-white" />,
    features: ['Issue sync', 'Pull tracking', 'Commit links'],
    status: 'available',
  },
  {
    id: '4',
    name: 'Gmail',
    description: 'Turn emails into actionable tasks and never miss a beat.',
    icon: <Mail className="w-12 h-12 text-red-500 dark:text-red-400" />,
    features: ['Email to task', 'Smart labels', 'Quick replies'],
    status: 'available',
  },
  {
    id: '5',
    name: 'Toggl Track',
    description: 'Capture every second spent and understand where your time goes.',
    icon: <Clock className="w-12 h-12 text-pink-500 dark:text-pink-400" />,
    features: ['Auto tracking', 'Time insights', 'Project breakdown'],
    status: 'available',
  },
  {
    id: '6',
    name: 'Analytics Suite',
    description: 'Get a bird’s-eye view of performance with real-time dashboards.',
    icon: <BarChart3 className="w-12 h-12 text-orange-500 dark:text-orange-400" />,
    features: ['Live metrics', 'Custom dashboards', 'Drill-down views'],
    isPremium: true,
    status: 'available',
  },
];

const InCard = ({
  className,
  integrations,
  reverse = false
}: {
  className?: string;
  integrations: Integration[];
  reverse?: boolean;
}) => {
  return (
    <motion.div
      initial={{ y: reverse ? "-50%" : 0 }}
      animate={{ y: reverse ? 0 : "-50%" }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className={twMerge("flex flex-col gap-4", className)}
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <Fragment key={i}>
          {integrations.map((integration) => (
            <div key={integration.id} className="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  {integration.isPopular && (
                    <div className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-xs font-medium px-2 py-1 rounded-full">
                      <Star className="w-3 h-3" />
                      Popular
                    </div>
                  )}
                  {integration.isPremium && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs font-medium px-2 py-1 rounded-full">
                      Pro
                    </div>
                  )}
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  integration.status === 'available' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300' 
                    : integration.status === 'beta' 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300' 
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300'
                }`}>
                  {integration.status === 'available' ? 'Available' : 
                   integration.status === 'beta' ? 'Beta' : 'Coming Soon'}
                </div>
              </div>

              <div className="flex justify-center">
                {integration.icon}
              </div>

              <h3 className="text-2xl font-semibold mt-4 text-center text-black dark:text-white">
                {integration.name}
              </h3>

              <p className="text-center px-4 text-gray-700 dark:text-gray-300 mt-2 text-sm">
                {integration.description}
              </p>

              <div className="mt-4 space-y-2">
                {integration.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {integration.status === 'available' && (
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-300 mt-4 group cursor-pointer">
                  <span>Configure</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </motion.div>
  );
};

const ModernIntegrations = () => {
  return (
    <section id="integrations" className="relative py-16 bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 overflow-hidden">

      {/* Glowing top separator line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-500 to-transparent shadow-lg" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent blur-sm" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 justify-center w-full gap-12 items-center">           
  <div className="text-center lg:text-start">             
    <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">               
      <MdOutlineStar className="inline mr-1" />               
      Integrations             
    </div>             
    <h2 className='text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text mt-4'>               
      Connect your                
      <span className='block'> favorite tools</span>             
    </h2>             
    <p className='mt-4 text-base text-gray-700 dark:text-gray-300'>               
      Seamlessly integrate with your workflow. Automate updates, sync tasks, and align teams effortlessly.             
    </p>             
    <div className="flex items-center justify-center lg:justify-start gap-6 mt-6 text-sm text-gray-600 dark:text-gray-400">               
      <div className="flex items-center gap-2">                 
        <Users className="w-4 h-4" />                 
        <span>50,000+ teams</span>               
      </div>               
      <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />               
      <div className="flex items-center gap-2">                 
        <CheckCircle2 className="w-4 h-4" />                 
        <span>99.9% uptime</span>               
      </div>             
    </div>           
  </div>           
  <div className="h-[400px] lg:h-[800px] overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">             
    <InCard integrations={integrations.slice(0, 3)} />             
    <InCard reverse integrations={integrations.slice(3, 6)} className='hidden md:flex' />           
  </div>         
</div>
      </div>
    </section>
  );
};

export default ModernIntegrations;
