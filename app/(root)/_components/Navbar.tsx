"use client"
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

const Navbar = () => {
  const Links = [
    { name: "Home", link: "/" },
    { name: "Features", link: "/features" },
    { name: "Pricing", link: "/pricing" },
    { name: "Contact", link: "/contact" },
  ]
  const [isOpen, setIsOpen] = useState(false)
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <nav className='fixed  bg-white w-full justify-center items-center px-10 py-5' >
      <div className="flex justify-between items-center">
        <div className="flex justify-center items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo-no-background.png" alt="Logo" width={300} height={300} className="h-10 w-10" />
          </Link>
        </div>
        {/* Lg screen */}
        <div className="hidden md:flex">
          {Links.map((link, index) => (
            <Link key={index} href={link.link} className="mx-4 text-gray-700 hover:text-gray-900">
              {link.name}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex">
          <div className="flex justify-center items-center gap-4">
              <Button asChild variant={"outline"} size={"lg"} >
                <Link href="/sign-in" >
                  Sign In
                </Link>
              </Button>
            
              <Button asChild variant={"default"} size={"lg"} >
                <Link href="/sign-up" >
                  Get started for free
                </Link>
              </Button>
          </div>
        </div>
        {/* Sm screen */}
        <div className="flex md:hidden" onClick={toggleMenu}> 
          {!isOpen ? <Menu color='black' /> : <X color='black' />}
          {isOpen && (
            <div className="absolute top-20 left-0 w-full bg-white flex flex-col shadow-lg transition-all items-center justify-center z-50">
              <div className="flex items-start justify-center flex-col w-full px-6">
                {Links.map((link, index) => (
                  <Link key={index} href={link.link} className=" my-4 text-gray-700 hover:text-gray-900" onClick={toggleMenu}>
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex justify-between items-center gap-4">
                <Button asChild variant={"outline"} size={"lg"} className="my-4" onClick={toggleMenu}>
                  <Link href="/sign-in" >
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant={"default"} size={"lg"} className="my-4" onClick={toggleMenu}>
                  <Link href="/sign-up" >
                    Get started for free
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar