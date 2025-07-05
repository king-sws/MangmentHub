
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  BookOpen, 
  MessageCircle, 
  Sun, 
  Moon, 
  ArrowLeft, 
  Clock,
  User,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Code,
  CreditCard,
  Settings,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Mail
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define interfaces for TypeScript
interface Article {
  id: number;
  title: string;
  readTime: string;
  popular: boolean;
  category?: string;
  categoryColor?: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  textColor: string;
  articles: Article[];
}

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const categories: Category[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Everything you need to know to get up and running quickly',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      articles: [
        { id: 1, title: 'Welcome to Blutto: Your Complete Setup Guide', readTime: '5 min', popular: true },
        { id: 2, title: 'Setting Up Your Team Workspace', readTime: '3 min', popular: false },
        { id: 3, title: 'Understanding Your Dashboard', readTime: '4 min', popular: true },
        { id: 4, title: 'First Project: Best Practices', readTime: '8 min', popular: false },
        { id: 5, title: 'Mobile App Setup & Sync', readTime: '3 min', popular: false }
      ]
    },
    {
      id: 'account-billing',
      title: 'Account & Billing',
      description: 'Manage your account settings, subscriptions, and billing information',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      articles: [
        { id: 6, title: 'Subscription Plans: Choose What\'s Right for You', readTime: '6 min', popular: true },
        { id: 7, title: 'Managing Payment Methods', readTime: '4 min', popular: false },
        { id: 8, title: 'Understanding Your Invoice', readTime: '3 min', popular: false },
        { id: 9, title: 'Upgrading or Downgrading Your Plan', readTime: '5 min', popular: false },
        { id: 10, title: 'Account Deletion and Data Export', readTime: '7 min', popular: false }
      ]
    },
    {
      id: 'features-workflows',
      title: 'Features & Workflows',
      description: 'Learn about our powerful features and how to optimize your workflows',
      icon: Zap,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-300',
      articles: [
        { id: 11, title: 'Advanced Search & Filtering Techniques', readTime: '7 min', popular: true },
        { id: 12, title: 'Automation Rules and Triggers', readTime: '9 min', popular: false },
        { id: 13, title: 'Custom Templates and Layouts', readTime: '6 min', popular: false },
        { id: 14, title: 'Collaboration Tools and Permissions', readTime: '8 min', popular: false },
        { id: 15, title: 'Reporting and Analytics Dashboard', readTime: '10 min', popular: false }
      ]
    },
    {
      id: 'integrations-api',
      title: 'Integrations & API',
      description: 'Connect with third-party tools and leverage our powerful API',
      icon: Code,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-300',
      articles: [
        { id: 16, title: 'Slack Integration: Complete Setup Guide', readTime: '5 min', popular: true },
        { id: 17, title: 'API Authentication and Rate Limits', readTime: '8 min', popular: false },
        { id: 18, title: 'Webhook Configuration and Testing', readTime: '6 min', popular: false },
        { id: 19, title: 'Third-party App Marketplace', readTime: '4 min', popular: false },
        { id: 20, title: 'Custom Integration Development', readTime: '12 min', popular: false }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Resolve common issues and get back to being productive',
      icon: Settings,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-300',
      articles: [
        { id: 21, title: 'Login Issues & Password Reset', readTime: '3 min', popular: true },
        { id: 22, title: 'Performance Issues and Optimization', readTime: '7 min', popular: false },
        { id: 23, title: 'Data Sync Problems', readTime: '5 min', popular: false },
        { id: 24, title: 'Browser Compatibility Issues', readTime: '4 min', popular: false },
        { id: 25, title: 'Mobile App Troubleshooting', readTime: '6 min', popular: false }
      ]
    },
    {
      id: 'security-privacy',
      title: 'Security & Privacy',
      description: 'Keep your data safe and understand our privacy practices',
      icon: Shield,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      articles: [
        { id: 26, title: 'Two-Factor Authentication Setup', readTime: '4 min', popular: true },
        { id: 27, title: 'Understanding Data Encryption', readTime: '6 min', popular: false },
        { id: 28, title: 'Privacy Settings and Controls', readTime: '5 min', popular: false },
        { id: 29, title: 'GDPR Compliance and Data Rights', readTime: '8 min', popular: false },
        { id: 30, title: 'Security Best Practices', readTime: '7 min', popular: false }
      ]
    }
  ];

  const popularArticles = [
    { id: 1, title: 'Welcome to Blutto: Your Complete Setup Guide', category: 'Getting Started', readTime: '5 min' },
    { id: 6, title: 'Subscription Plans: Choose What\'s Right for You', category: 'Account & Billing', readTime: '6 min' },
    { id: 11, title: 'Advanced Search & Filtering Techniques', category: 'Features & Workflows', readTime: '7 min' },
    { id: 21, title: 'Login Issues & Password Reset', category: 'Troubleshooting', readTime: '3 min' },
    { id: 26, title: 'Two-Factor Authentication Setup', category: 'Security & Privacy', readTime: '4 min' },
    { id: 16, title: 'Slack Integration: Complete Setup Guide', category: 'Integrations & API', readTime: '5 min' }
  ];

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedArticle(null);
    scrollToTop();
  };

  const handleArticleClick = (article: Article, category: Category) => {
    setSelectedArticle({ ...article, category: category.title, categoryColor: category.textColor });
    scrollToTop();
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
    scrollToTop();
  };

  const handleBackToCategory = () => {
    setSelectedArticle(null);
    scrollToTop();
  };

  // Article content component
  const ArticleContent = ({ article }: { article: Article }) => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Button
        onClick={handleBackToCategory}
        variant="ghost"
        className="mb-8 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {article.category}
      </Button>
      
      <Card className="overflow-hidden border-0 shadow-xl bg-white/60 dark:bg-white/5">
        <CardHeader className="p-6 sm:p-8 lg:p-12">
          <div className="mb-6">
            <Badge variant="secondary" className={`${article.categoryColor} bg-opacity-20 mb-4`}>
              {article.category}
            </Badge>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {article.title}
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Estimated read time: {article.readTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Help Team</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 lg:p-12 pt-0">
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              This comprehensive guide will walk you through everything you need to know about this topic. 
              We've designed this to be your go-to resource with practical examples and actionable insights.
            </p>
            
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</span>
              Getting Started
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Begin by understanding the core concepts and preparing your workspace. This foundational step 
              ensures you'll get the most out of the features and capabilities available to you.
            </p>
            
            <Alert className="mb-8 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <Zap className="w-4 h-4 text-blue-500" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Pro Tip:</strong> Take advantage of our guided onboarding flow to set up your account efficiently. 
                This will save you time and ensure you don't miss any important configuration steps.
              </AlertDescription>
            </Alert>
            
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md flex items-center justify-center text-white font-bold text-xs">✓</span>
              Step 1: Initial Configuration
            </h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-300 mb-8">
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Navigate to your dashboard and locate the settings panel</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Configure your profile information and preferences</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Set up your team workspace and invite collaborators</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Complete the verification process and security setup</span>
              </li>
            </ul>
            
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</span>
              Advanced Configuration
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Once you've completed the basic setup, you can explore more advanced features that will 
              help you customize your experience and maximize productivity.
            </p>
            
            <Alert className="mb-8 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important Note:</strong> Some advanced features require a Pro or Enterprise subscription. Check your plan 
                details to see which features are available to you.
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Was this article helpful?
              </p>
              <div className="flex items-center gap-3">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes
                </Button>
                <Button variant="outline">
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  No
                </Button>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-0">
              <CardContent className="p-6">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Need more help?
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Our support team is here to help you succeed. Get in touch if you have any questions.
                </p>
                <Button variant="ghost" className="text-blue-600 dark:text-blue-400 p-0 h-auto">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Category view component
  const CategoryView = ({ category }: { category: Category }) => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Button
        onClick={handleBackToCategories}
        variant="ghost"
        className="mb-8 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Help Center
      </Button>
      
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center shadow-lg`}>
            <category.icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-2">
              {category.title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">
              {category.description}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {category.articles.map((article) => (
          <Card
            key={article.id}
            onClick={() => handleArticleClick(article, category)}
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/60 dark:bg-white/5 border-0"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {article.popular && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      POPULAR
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </div>
              
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                {article.title}
              </CardTitle>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Article #{article.id}
                </span>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Read Article</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Show search results if there's a search query
  if (searchQuery && !selectedCategory && !selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
        {/* Header */}
        <header className="relative bg-white/60 dark:bg-white/5 shadow-lg backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Blutto Help Center
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    Get help and learn how to use our platform
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 sm:py-16">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help articles, features, troubleshooting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 text-base sm:text-lg bg-white/80 dark:bg-white/10 backdrop-blur-md border-white/20 dark:border-white/10 shadow-xl"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Search Results for "{searchQuery}"
            </h2>
            
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-slate-600 dark:text-slate-400">Try adjusting your search terms or browse our categories.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredCategories.map((category) => (
                  <Card key={category.id} className="bg-white/60 dark:bg-white/5 border-0 shadow-lg">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                          <category.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            {category.title}
                          </CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-400">
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        {category.articles
                          .filter(article => article.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((article) => (
                            <Button
                              key={article.id}
                              onClick={() => handleArticleClick(article, category)}
                              variant="ghost"
                              className="h-auto p-4 text-left justify-start bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
                            >
                              <div className="w-full">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-left">
                                  {article.title}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{article.readTime}</span>
                                </div>
                              </div>
                            </Button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main help center view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="container mx-auto py-8">
          <ArticleContent article={selectedArticle} />
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
        <div className="container mx-auto py-8">
          <CategoryView category={selectedCategory} />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b pt-20 from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Header */}
      

      <div className=" mx-auto px-8 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-700 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                How can we help?
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Search our comprehensive knowledge base or browse categories to find the answers you need
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/20 dark:to-purple-400/20 rounded-2xl blur-xl" />
              <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search for help articles, features, troubleshooting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl"
                />
              </div>
            </div>

            {/* Search Stats */}
            <div className="flex justify-center items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              <span>180+ articles</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>6 categories</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Updated daily</span>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Find articles organized by topic to quickly locate the information you need.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-white/5 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <category.icon className="w-8 h-8 text-white" />
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.title}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {category.articles.length} articles
                      </span>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                        <span>Browse</span>
                        <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Popular Articles
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              These articles are frequently accessed by our users and cover essential topics.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => {
                  const category = categories.find(cat => cat.title === article.category);
                  if (category) {
                    const fullArticle = category.articles.find(a => a.id === article.id);
                    if (fullArticle) {
                      handleArticleClick(fullArticle, category);
                    }
                  }
                }}
                className="group cursor-pointer"
              >
                
                <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/5 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      {article.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                        <span>Read</span>
                        <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        
      </div>
    </div>
  );
};

export default HelpCenter;