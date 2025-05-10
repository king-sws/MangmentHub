import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Security', href: '/security' },
      { name: 'Roadmap', href: '/roadmap' }
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' }
    ],
    resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Help Center', href: '/help' },
      { name: 'API', href: '/api' },
      { name: 'Community', href: '/community' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', icon: <Twitter size={18} />, href: 'https://twitter.com' },
    { name: 'Facebook', icon: <Facebook size={18} />, href: 'https://facebook.com' },
    { name: 'Instagram', icon: <Instagram size={18} />, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: <Linkedin size={18} />, href: 'https://linkedin.com' },
    { name: 'Email', icon: <Mail size={18} />, href: 'mailto:contact@taskify.com' }
  ];

  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <Image src="/taskify.png" alt="Taskify Logo" width={250} height={250} />
            </Link>
            <p className="text-gray-600 max-w-xs">
              Empowering teams to achieve more through intelligent task management and seamless collaboration.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.name}
                  href={social.href}
                  className="text-gray-500 hover:text-primary transition-colors duration-200"
                  aria-label={social.name}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 hover:text-primary text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 hover:text-primary text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-600 hover:text-primary text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-600 mb-4">Subscribe to our newsletter for the latest updates.</p>
            <div className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button size="sm" className="w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">
              © {currentYear} Taskify. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;