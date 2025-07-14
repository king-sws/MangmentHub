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
  sectionSubtitle: "Everything you need to know about using Blutto effectively.",
  faqs: [
    {
      question: "How does the free trial work?",
      answer: "Blutto offers a 14-day free trial with full access to all features—no credit card required. At the end of your trial, you can choose a plan that fits your team."
    },
    {
      question: "Can I switch plans later?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time. We’ll automatically prorate the changes in your next billing cycle."
    },
    {
      question: "Is my data secure with Blutto?",
      answer: "Yes. Blutto uses enterprise-grade encryption, secure infrastructure, and industry best practices to keep your data safe. Your privacy is our priority."
    },
    {
      question: "Do you offer discounts for nonprofits or education?",
      answer: "We do. Blutto provides discounted pricing for nonprofits, education institutions, and early-stage startups. Reach out to our team to learn more."
    },
    {
      question: "How easy is it to migrate from another platform?",
      answer: "Very easy. Blutto supports imports from tools like Trello, Asana, and Jira. Our team is here to guide you every step of the way."
    },
    {
      question: "What kind of support does Blutto offer?",
      answer: "Every plan includes email support. Pro and Enterprise plans come with priority support, and Enterprise users receive a dedicated account manager."
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