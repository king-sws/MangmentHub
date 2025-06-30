import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Github } from 'lucide-react';

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
    { name: 'Twitter', icon: <Twitter size={20} />, href: 'https://twitter.com' },
    { name: 'Facebook', icon: <Facebook size={20} />, href: 'https://facebook.com' },
    { name: 'Instagram', icon: <Instagram size={20} />, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: <Linkedin size={20} />, href: 'https://linkedin.com' },
    { name: 'Github', icon: <Github size={20} />, href: 'https://github.com' },
    { name: 'Email', icon: <Mail size={20} />, href: 'mailto:oboufi88@gmail.com' }
  ];

  return (
    <footer className="border-t bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Brand Section - Full width on mobile, spans 2 cols on larger screens */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
            <Link href="/" className="inline-block">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/blutto-no.svg" 
                  alt="Blutto Logo" 
                  width={64} 
                  height={64}
                  className="dark:hidden " 
                />
                <Image 
                  src="/blutto-white-no.svg" 
                  alt="Blutto Logo" 
                  width={64} 
                  height={64}
                  className="hidden dark:block " 
                />
              </div>
            </Link>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-xs lg:max-w-sm">
              Empowering teams to achieve more through intelligent task management and seamless collaboration.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-3 sm:space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.name}
                  href={social.href}
                  className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors duration-200 p-1"
                  aria-label={social.name}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections - Stack on mobile, 2 cols on tablet, individual cols on desktop */}
          <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:contents">
            <div className="lg:col-span-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section - Full width on mobile and tablet */}
          <div className="sm:col-span-2 lg:col-span-1 mt-6 sm:mt-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Subscribe to our newsletter for the latest updates.</p>
            <div className="flex flex-col space-y-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button size="sm" className="w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
              © {currentYear} Blutto. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 sm:gap-x-6 gap-y-2">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200 whitespace-nowrap"
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