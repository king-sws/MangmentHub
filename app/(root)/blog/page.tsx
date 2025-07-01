'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ArrowRight, 
  Clock, 
  User, 
  Tag,
  TrendingUp,
  Zap,
  Users,
  Code,
  Globe
} from 'lucide-react';

// Type definitions
interface BlogPost {
  title: string;
  slug: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  featured: boolean;
  description: string;
  image: string;
  tags: string[];
}

interface CategoryIcons {
  [key: string]: React.ComponentType<{ className?: string }>;
}

interface CategoryColors {
  [key: string]: string;
}

const posts: BlogPost[] = [
  {
    title: 'Boost Productivity with Blutto: A Complete Guide',
    slug: 'boost-productivity',
    date: '2025-06-20',
    readTime: '8 min read',
    author: 'Sarah Chen',
    category: 'Productivity',
    featured: true,
    description: 'Discover how Blutto helps teams streamline workflows and increase efficiency by up to 40%. Learn the proven strategies that leading companies use.',
    image: '/api/placeholder/600/300',
    tags: ['Productivity', 'Workflows', 'Team Management']
  },
  {
    title: 'How We Designed Blutto\'s Interface: A Design System Deep Dive',
    slug: 'design-blutto-ui',
    date: '2025-06-15',
    readTime: '12 min read',
    author: 'Alex Rodriguez',
    category: 'Design',
    featured: false,
    description: 'A comprehensive behind-the-scenes look at our design system, accessibility principles, and the decisions that shaped Blutto\'s user experience.',
    image: '/api/placeholder/600/300',
    tags: ['Design System', 'UI/UX', 'Accessibility']
  },
  {
    title: 'Advanced Integrations: Blutto + Slack + GitHub + 50+ Tools',
    slug: 'integrate-slack-github',
    date: '2025-06-10',
    readTime: '10 min read',
    author: 'Marcus Kim',
    category: 'Integrations',
    featured: false,
    description: 'Master advanced integration patterns and learn how to connect Blutto to your entire tech stack. Includes code examples and best practices.',
    image: '/api/placeholder/600/300',
    tags: ['Integrations', 'API', 'Automation']
  },
  {
    title: '2025 Remote Work Trends: What Our Data Reveals',
    slug: 'remote-work-trends-2025',
    date: '2025-06-05',
    readTime: '6 min read',
    author: 'Dr. Emily Watson',
    category: 'Research',
    featured: false,
    description: 'Analyzing data from 50,000+ remote teams to uncover the key trends shaping the future of distributed work and team collaboration.',
    image: '/api/placeholder/600/300',
    tags: ['Remote Work', 'Data Analysis', 'Trends']
  },
  {
    title: 'Building at Scale: Blutto\'s Architecture Lessons',
    slug: 'architecture-lessons',
    date: '2025-05-28',
    readTime: '15 min read',
    author: 'Tech Team',
    category: 'Engineering',
    featured: false,
    description: 'Technical deep-dive into how we built Blutto to handle millions of users. Lessons learned about scalability, performance, and reliability.',
    image: '/api/placeholder/600/300',
    tags: ['Architecture', 'Scalability', 'Engineering']
  },
  {
    title: 'Security First: How Blutto Protects Your Data',
    slug: 'security-first',
    date: '2025-05-20',
    readTime: '7 min read',
    author: 'Security Team',
    category: 'Security',
    featured: false,
    description: 'Comprehensive overview of Blutto\'s security measures, compliance standards, and privacy protections. SOC 2, GDPR, and more.',
    image: '/api/placeholder/600/300',
    tags: ['Security', 'Compliance', 'Privacy']
  }
];

const categoryIcons: CategoryIcons = {
  'Productivity': TrendingUp,
  'Design': Zap,
  'Integrations': Globe,
  'Research': Users,
  'Engineering': Code,
  'Security': User
};

const categoryColors: CategoryColors = {
  'Productivity': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Design': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Integrations': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Research': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Engineering': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

export default function BlogPage() {
  const featuredPost = posts.find(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);

  return (
    <div className="min-h-screen pt-7 sm:pt-6 lg:pt-10 bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 xl:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                  Blutto Blog
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
                Insights, tutorials, and stories from the team building the future of team productivity
              </p>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span>50K+ readers</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
              <span>Weekly updates</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
              <span>Expert insights</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Featured Article</h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Our latest deep-dive into productivity and team collaboration</p>
            </motion.div>
            
            <motion.div
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href={`/blog/${featuredPost.slug}`} className="block">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1 sm:group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/10 dark:to-purple-400/10" />
                  
                  <div className="relative p-4 sm:p-6 lg:p-8 xl:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit ${categoryColors[featuredPost.category]}`}>
                        {React.createElement(categoryIcons[featuredPost.category] || Tag, { className: "w-3 h-3" })}
                        {featuredPost.category}
                      </span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full w-fit">
                        FEATURED
                      </span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {featuredPost.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 leading-relaxed">
                      {featuredPost.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{featuredPost.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">
                            {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="sm:hidden">
                            {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{featuredPost.readTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all text-sm sm:text-base">
                        <span>Read Article</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Regular Posts Grid */}
      <section className="py-8 sm:py-12 lg:py-16 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Latest Articles</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Stay updated with our latest insights and tutorials</p>
          </motion.div>
          
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post, i) => (
              <motion.div
                key={post.slug}
                className="group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <article className="h-full bg-white/60 dark:bg-white/5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                    <div className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${categoryColors[post.category]}`}>
                          {React.createElement(categoryIcons[post.category] || Tag, { className: "w-3 h-3" })}
                          <span className="hidden sm:inline">{post.category}</span>
                          <span className="sm:hidden">{post.category.slice(0, 4)}</span>
                        </span>
                      </div>
                      
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight flex-grow">
                        {post.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 sm:mb-4 line-clamp-3 leading-relaxed flex-grow">
                        {post.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span className="hidden sm:inline">
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                          <span className="sm:hidden">
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold group-hover:gap-3 transition-all">
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}