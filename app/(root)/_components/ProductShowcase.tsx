'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import productImg from '@/public/product-image.png'
import pyramidImg from '@/public/pyramid.png'
import tubeImg from '@/public/tube.png'
import { motion, useScroll, useTransform } from 'framer-motion'

const ProductShowcase = () => {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative isolate will-change-transform bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900 py-28 sm:py-32 overflow-hidden"
    >
      {/* Glowing top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-500 to-transparent shadow-lg" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent blur-sm" />

      {/* Background grid and blur blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-indigo-200/20 dark:from-indigo-800/20 dark:to-indigo-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-indigo-100/25 to-blue-50/15 dark:from-indigo-700/15 dark:to-gray-800/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Heading + paragraph */}
        <motion.div
  className="max-w-2xl px-2 mx-auto text-center mb-6"
>
  <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
    Enterprise Solution
  </div>
  <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
    Enterprise-Grade Interface
  </h2>
  <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
    Experience unparalleled efficiency with our intuitive platform designed for enterprise teams.
    Built for scale, optimized for performance, trusted by industry leaders.
  </p>
</motion.div>

        {/* Image block with animated decorations */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative mt-10 w-full max-w-5xl"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400/10 to-blue-400/5 blur-2xl opacity-60" />
          <Image
            src={productImg}
            alt="Product"
            priority
            className="relative z-10 mx-auto"
            sizes="(max-width: 768px) 100vw, 800px"
          />

          <motion.img
            src={pyramidImg.src}
            alt="Pyramid decoration"
            width={262}
            height={262}
            loading="eager"
            decoding="async"
            className="hidden md:block absolute -right-36 -top-32 will-change-transform select-none pointer-events-none"
            style={{ translateY }}
          />

          <motion.img
            src={tubeImg.src}
            alt="Tube decoration"
            width={262}
            height={262}
            loading="eager"
            decoding="async"
            className="hidden md:block absolute bottom-24 -left-36 will-change-transform select-none pointer-events-none"
            style={{ translateY }}
          />
        </motion.div>
      </div>
    </section>
  )
}

export default ProductShowcase
