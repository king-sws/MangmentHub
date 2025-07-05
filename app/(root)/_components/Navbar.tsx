"use client";

import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown, Star, Zap, Shield, Users, Book, MessageCircle, FileText, Headphones } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

interface DropdownItem {
  name: string
  link: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

interface NavigationItem {
  name: string
  link: string
  hasDropdown?: boolean
  items?: DropdownItem[]
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const pathname = usePathname()

  // Enhanced navigation structure with dropdowns
  const navigation: NavigationItem[] = [
    { 
      name: "Product", 
      link: "/product",
      hasDropdown: true,
      items: [
        { name: "Features", link: "#features", icon: Zap, description: "Powerful tools for productivity" },
        { name: "Integrations", link: "#integrations", icon: Users, description: "Connect with your favorite apps" },
        { name: "Security", link: "/security", icon: Shield, description: "Enterprise-grade security" },
        { name: "API", link: "/api", icon: Star, description: "Build with our API" },
      ]
    },
    { 
      name: "Solutions", 
      link: "/solutions",
      hasDropdown: true,
      items: [
        { name: "For Teams", link: "/teams", description: "Collaborate effectively" },
        { name: "For Enterprise", link: "/enterprise", description: "Scale with confidence" },
        { name: "For Developers", link: "/developers", description: "Build and integrate" },
      ]
    },
    { name: "Pricing", link: "#pricing" },
    { 
      name: "Resources", 
      link: "/resources",
      hasDropdown: true,
      items: [
        { name: "Documentation", link: "/docs", icon: Book, description: "Learn how to use our platform" },
        { name: "Blog", link: "/blog", icon: FileText, description: "Latest news and insights" },
        { name: "Help Center", link: "/help", icon: Headphones, description: "Get support when you need it" },
        { name: "Community", link: "/community", icon: MessageCircle, description: "Connect with other users" },
      ]
    },
  ]

  const toggleMenu = (): void => {
    setIsOpen(!isOpen)
  }

  const handleDropdown = (index: number): void => {
    setActiveDropdown(activeDropdown === index ? null : index)
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (): void => {
      setActiveDropdown(null)
    }
    
    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <nav className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300 ease-in-out',
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 shadow-lg py-3'
          : 'bg-white dark:bg-gray-950 border-b border-gray-200/30 dark:border-gray-800/30 py-4',
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-3 group transition-all duration-200 hover:opacity-80"
              >
                <div className="relative">
                  <Image 
                    src="/blutto-no.svg" 
                    alt="Blutto Logo" 
                    width={78} 
                    height={78}
                    className="dark:hidden" // Hide in dark mode
                  />
                  <Image 
                    src="/blutto-white-no.svg" 
                    alt="Blutto Logo" 
                    width={78} 
                    height={78}
                    className="hidden dark:block" // Show only in dark mode
                  />
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => {
                const isActive = pathname?.startsWith(item.link)
                
                if (item.hasDropdown) {
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          handleDropdown(index)
                        }}
                        className={cn(
                          'flex items-center space-x-1 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                          'hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-800/50',
                          isActive 
                            ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' 
                            : 'text-gray-600 dark:text-gray-300'
                        )}
                      >
                        <span>{item.name}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          activeDropdown === index ? "rotate-180" : ""
                        )} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === index && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 z-50">
                          {item.items?.map((dropdownItem, dropdownIndex) => (
                            <Link
                              key={dropdownIndex}
                              href={dropdownItem.link}
                              className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                            >
                              {dropdownItem.icon && (
                                <dropdownItem.icon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {dropdownItem.name}
                                </div>
                                {dropdownItem.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {dropdownItem.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                
                return (
                  <Link
                    key={index}
                    href={item.link}
                    className={cn(
                      'px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                      'hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-800/50',
                      isActive 
                        ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' 
                        : 'text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              
              {/* Desktop CTA Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm"
                  className="font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Link href="/sign-in">
                    Sign In
                  </Link>
                </Button>
                
                {/* UPDATED BUTTON WITH MATCHING GRADIENT */}
                <Button 
                  asChild
                  size="lg"
                  className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-semibold text-base transition duration-300 shadow-md hover:shadow-lg"
                >
                  <Link href="/sign-up" className="flex items-center gap-2">
                    Start Free Trial
                  </Link>
                </Button>
              </div>
              
              {/* Mobile Menu Button */}
              <div className="flex lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMenu}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isOpen}
                  className="relative text-gray-600 dark:text-gray-300"
                >
                  <div className="flex items-center justify-center w-5 h-5">
                    <Menu 
                      className={cn(
                        "absolute h-5 w-5 transition-all duration-300",
                        isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                      )} 
                    />
                    <X 
                      className={cn(
                        "absolute h-5 w-5 transition-all duration-300",
                        isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                      )} 
                    />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-full max-w-sm transform transition-transform duration-300 ease-in-out lg:hidden",
        "bg-white dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <Image 
              src="/blutto-no.svg" 
              alt="Blutto Logo" 
              width={78} 
              height={78}
              className="dark:hidden"
            />
            <Image 
              src="/blutto-white-no.svg" 
              alt="Blutto Logo" 
              width={78} 
              height={78}
              className="hidden dark:block"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Close menu"
              className="text-gray-600 dark:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Navigation */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <div key={index}>
                  {item.hasDropdown ? (
                    <div>
                      <button
                        onClick={() => handleDropdown(index)}
                        className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                      >
                        <span>{item.name}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          activeDropdown === index ? "rotate-180" : ""
                        )} />
                      </button>
                      {activeDropdown === index && (
                        <div className="ml-4 mt-2 space-y-1">
                          {item.items?.map((subItem, subIndex) => (
                            <Link
                              key={subIndex}
                              href={subItem.link}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-md transition-colors duration-200"
                              onClick={toggleMenu}
                            >
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4 mr-3 text-gray-400" />
                              )}
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.link}
                      className={cn(
                        'flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200',
                        'hover:bg-gray-100 dark:hover:bg-gray-800/50',
                        pathname?.startsWith(item.link)
                          ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800' 
                          : 'text-gray-700 dark:text-gray-200'
                      )}
                      onClick={toggleMenu}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Theme Toggle */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile CTA Buttons */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <Button 
              asChild 
              variant="outline" 
              className="w-full font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            >
              <Link href="/sign-in" onClick={toggleMenu}>
                Sign In
              </Link>
            </Button>
            
            {/* UPDATED BUTTON WITH MATCHING GRADIENT */}
            <Button 
              asChild 
              className="w-full font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/sign-up" onClick={toggleMenu}>
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar