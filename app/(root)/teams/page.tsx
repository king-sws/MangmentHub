'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import teamCollab from '@/public/signup.jpg'; // Replace with your actual asset

export default function TeamsPage() {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 dark:from-black dark:to-gray-950 py-28 sm:py-36">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
            Teams
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
            Built for high-performing teams
          </h1>
          <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
            Blutto helps your team plan, collaborate, and deliver faster – from startups to enterprises.
          </p>
        </motion.div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-10">
          {[
            {
              title: 'Collaborate in Real-Time',
              desc: 'Live editing, mentions, and task comments keep everyone on the same page.',
            },
            {
              title: 'Full Visibility',
              desc: 'See who’s working on what, track progress, and remove blockers before they grow.',
            },
            {
              title: 'Optimize Productivity',
              desc: 'Custom workflows and automations let you move faster, with less busywork.',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Image / Screenshot section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative mt-24 max-w-4xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-400/5 blur-2xl opacity-60 rounded-3xl" />
          <Image
            src={teamCollab}
            alt="Team collaboration screenshot"
            className="relative z-10 rounded-xl shadow-lg"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Ready to empower your team?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started with Blutto today or book a demo with our team.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/sign-up"
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
            >
              Get Started Free
            </a>
            <a
              href="/contact"
              className="px-6 py-3 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Book a Demo
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
