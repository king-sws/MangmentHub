"use client";
import React from 'react';
import EnhancedHeroSection from './_components/main/EnhancedHeroSection';
import Testimonials from './_components/main/TestimonialsSection';
import BluttoIntegrations from './_components/main/IntegrationSection';
import FAQSection from './_components/main/FAQSection';
import CallToAction from './_components/main/CTASection';

import ProductShowcase from './_components/ProductShowcase';
import EnhancedFeaturesSection from './_components/main/FeaturesSection';
import Pricing from '@/components/Pricing';

const HomePage = () => {


  // FAQ configuration
  const faqConfig = {
    sectionTitle: "Frequently Asked Questions",
    sectionSubtitle: "Get answers to the most common questions about TaskMaster",
    faqs: [
      {
        question: "How does the free trial work?",
        answer: "Our 14-day free trial gives you full access to all features with no credit card required. At the end of your trial, you can choose the plan that best fits your needs."
      },
      {
        question: "Can I change plans later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will be prorated and reflected in your next billing cycle."
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. We use enterprise-grade encryption and follow industry best practices for data security. Your information is stored securely and we never share your data with third parties."
      },
      {
        question: "Do you offer discounts for nonprofits or educational institutions?",
        answer: "Yes, we offer special pricing for qualifying nonprofits, educational institutions, and startups. Please contact our sales team for more information."
      },
      {
        question: "How easy is it to migrate from another tool?",
        answer: "We've made migration simple with our import tools that support popular platforms like Asana, Trello, and Jira. Our support team can also provide guidance throughout the process."
      },
      {
        question: "What kind of support do you offer?",
        answer: "All plans include email support with varying response times. Professional and Enterprise plans include priority support, while Enterprise customers also receive dedicated account management and phone support."
      }
    ]
  };



  return (
    <div className="w-full">
      {/* Enhanced Hero Section Component */}
      <EnhancedHeroSection  />


      <ProductShowcase />
            
      {/* Features Section */}
      <EnhancedFeaturesSection />

      <Pricing />

      {/* Testimonials Section */}
      <Testimonials  />
      
      {/* Integrations Section */}
      <BluttoIntegrations  />
            
      {/* FAQ Section */}
      <FAQSection {...faqConfig} />
      
      {/* Final CTA Section */}
      <CallToAction  />
    </div>
  );
};

export default HomePage;