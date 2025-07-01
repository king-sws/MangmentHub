/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React from 'react';
import {
  Shield, Lock, Eye, Server, FileCheck, Users, Globe,
  AlertTriangle, Award, CheckCircle, Star
} from 'lucide-react';

const ProfessionalSecurityPage = () => {
  const securityFeatures = [
    {
      icon: <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "Enterprise Encryption",
      description: "Military-grade AES-256 encryption protects your data in transit and at rest, ensuring maximum security at all times."
    },
    {
      icon: <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "SOC 2 Type II Certified",
      description: "Independently audited and certified to meet the highest industry standards for security, availability, and confidentiality."
    },
    {
      icon: <Eye className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "Zero-Knowledge Architecture",
      description: "Your sensitive information is encrypted client-side before reaching our servers. We cannot access your private data."
    },
    {
      icon: <Server className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "Cloud Infrastructure",
      description: "Built on enterprise-grade infrastructure with 99.99% uptime, automated backups, and global redundancy."
    },
    {
      icon: <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "Advanced Access Controls",
      description: "Granular role-based permissions and multi-factor authentication ensure secure team collaboration."
    },
    {
      icon: <Globe className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      title: "Global Compliance",
      description: "Full compliance with GDPR, CCPA, HIPAA, and international privacy regulations across all regions."
    }
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
            <Shield className="w-4 h-4" />
            Trusted Security
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-6">
            Enterprise-Grade Security
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            We go beyond compliance to deliver complete confidence. Every layer of our infrastructure is built for resilience and privacy.
          </p>
        </div>

        {/* Security Features */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature, i) => (
            <div key={i} className="relative group p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40 backdrop-blur-lg shadow-sm hover:shadow-md transition duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Security Whitepaper & Documentation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            Download our technical documentation or talk to our security team about audit reports and compliance coverage.
          </p>
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
              View Whitepaper
            </button>
            <button className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-all">
              Schedule a Security Review
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfessionalSecurityPage;
