/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Shield, Lock, Eye, Server, FileCheck, Users, Globe, AlertTriangle, Award, CheckCircle, Star } from 'lucide-react';

const ProfessionalSecurityPage = () => {
  const securityFeatures = [
    {
      icon: <Lock className="w-7 h-7 text-indigo-600" />,
      title: "Enterprise Encryption",
      description: "Military-grade AES-256 encryption protects your data in transit and at rest, ensuring maximum security at all times."
    },
    {
      icon: <Shield className="w-7 h-7 text-indigo-600" />,
      title: "SOC 2 Type II Certified", 
      description: "Independently audited and certified to meet the highest industry standards for security, availability, and confidentiality."
    },
    {
      icon: <Eye className="w-7 h-7 text-indigo-600" />,
      title: "Zero-Knowledge Architecture",
      description: "Your sensitive information is encrypted client-side before reaching our servers. We cannot access your private data."
    },
    {
      icon: <Server className="w-7 h-7 text-indigo-600" />,
      title: "Cloud Infrastructure",
      description: "Built on enterprise-grade infrastructure with 99.99% uptime, automated backups, and global redundancy."
    },
    {
      icon: <Users className="w-7 h-7 text-indigo-600" />,
      title: "Advanced Access Controls",
      description: "Granular role-based permissions and multi-factor authentication ensure secure team collaboration."
    },
    {
      icon: <Globe className="w-7 h-7 text-indigo-600" />,
      title: "Global Compliance",
      description: "Full compliance with GDPR, CCPA, HIPAA, and international privacy regulations across all regions."
    }
  ];

  const certifications = [
    { name: "SOC 2 Type II", status: "Certified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "ISO 27001", status: "Certified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "GDPR", status: "Compliant", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "CCPA", status: "Compliant", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "HIPAA", status: "Available", color: "bg-amber-50 text-amber-700 border-amber-200" }
  ];

  const testimonials = [
    {
      text: "The security features give us complete confidence in managing our sensitive client data. The compliance certifications were crucial for our enterprise adoption.",
      name: "Sarah Chen",
      role: "Chief Technology Officer",
      company: "TechFlow Solutions",
      rating: 5
    },
    {
      text: "Zero-knowledge architecture was exactly what we needed. Our legal team approved this solution immediately after reviewing the security documentation.",
      name: "Michael Rodriguez", 
      role: "Security Director",
      company: "GlobalCorp Industries",
      rating: 5
    },
    {
      text: "The granular access controls and audit trails have streamlined our compliance processes significantly. Excellent enterprise-grade solution.",
      name: "Emily Watson",
      role: "Compliance Manager", 
      company: "Financial Partners LLC",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white pt-6 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600/20 rounded-full blur-lg"></div>
                <div className="relative p-4 bg-white rounded-full shadow-lg border border-indigo-100">
                  <Shield className="w-12 h-12 text-indigo-600" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                Enterprise-Grade
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Security & Trust
              </span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Your data security is our unwavering commitment. We employ bank-level security measures, 
              comprehensive compliance certifications, and transparent practices to protect your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                View Security Documentation
              </button>
              <button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-4 px-8 rounded-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
                Schedule Security Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 font-medium mb-4">
            <Award className="w-4 h-4" />
            Certified & Compliant
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Comprehensive Security Framework</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every layer of our platform is designed with security-first principles to protect your most valuable assets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance & Data Protection */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                Audited & Verified
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8">Data Protection Excellence</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <FileCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-2">Advanced Encryption Standards</h3>
                    <p className="text-slate-600">AES-256 encryption at rest, TLS 1.3 in transit, with hardware security modules for key management</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Server className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-2">Global Infrastructure</h3>
                    <p className="text-slate-600">Multi-region deployment with automated failover, 24/7 SOC monitoring, and incident response</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-2">Privacy by Design</h3>
                    <p className="text-slate-600">Data minimization, purpose limitation, and transparent processing with full user control</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <h3 className="text-2xl font-semibold text-slate-900 mb-8">Compliance Certifications</h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex justify-between items-center p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200">
                    <span className="font-semibold text-slate-900">{cert.name}</span>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium border ${cert.color}`}>
                      {cert.status}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <h4 className="font-semibold text-slate-900 mb-2">Security Audit Schedule</h4>
                <p className="text-sm text-slate-600 mb-4">Continuous monitoring with scheduled comprehensive reviews</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">Quarterly</div>
                    <div className="text-xs text-slate-600">Penetration Testing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">Monthly</div>
                    <div className="text-xs text-slate-600">Vulnerability Scans</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">Annual</div>
                    <div className="text-xs text-slate-600">SOC 2 Audit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-600 font-medium mb-4">
            <Star className="w-4 h-4" />
            Trusted by Enterprises
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-6">What Security Leaders Say</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See how our security-first approach has earned the trust of industry leaders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-slate-600 mb-6 leading-relaxed">
                "{testimonial.text}"
              </blockquote>
              
              <div className="border-t border-slate-100 pt-6">
                <div className="font-semibold text-slate-900">{testimonial.name}</div>
                <div className="text-sm text-slate-500">{testimonial.role}</div>
                <div className="text-sm text-indigo-600 font-medium">{testimonial.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Response */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-2xl p-8 border border-orange-200 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-slate-900 mb-4">24/7 Incident Response</h3>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  Our dedicated security operations center monitors threats around the clock with comprehensive 
                  incident response procedures to protect your data and maintain business continuity.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 mb-2">&lt; 15 min</div>
                    <div className="text-sm text-slate-600 font-medium">Threat Detection</div>
                    <div className="text-xs text-slate-500 mt-1">Automated monitoring</div>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 mb-2">&lt; 1 hour</div>
                    <div className="text-sm text-slate-600 font-medium">Response Activation</div>
                    <div className="text-xs text-slate-500 mt-1">Team mobilization</div>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 mb-2">&lt; 4 hours</div>
                    <div className="text-sm text-slate-600 font-medium">Customer Communication</div>
                    <div className="text-xs text-slate-500 mt-1">Transparent updates</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Secure Your Business?</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Connect with our security experts to discuss your compliance requirements and get detailed 
              documentation for your security review process.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                Schedule Security Consultation
              </button>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                Download Security Whitepaper
              </button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Questions about our security practices? Email us at <span className="text-indigo-400">security@company.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalSecurityPage;