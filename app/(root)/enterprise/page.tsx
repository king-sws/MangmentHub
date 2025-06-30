'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import secureImg from '@/public/enterprise.png'; // Replace with your own image

export default function EnterprisePage() {
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
            Enterprise
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
            Blutto for Enterprise Teams
          </h1>
          <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
            Scale your organization with powerful security, admin control, and premium support — built for enterprise demands.
          </p>
        </motion.div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-10">
          {[
            {
              title: 'Enterprise-Grade Security',
              desc: 'SSO, audit logs, SOC 2 compliance — Blutto protects your data with industry-standard practices.',
            },
            {
              title: 'Powerful Admin Controls',
              desc: 'Granular permissions, user provisioning, and centralized billing designed for org-level governance.',
            },
            {
              title: 'Scalable Performance',
              desc: 'Whether 100 or 100,000 users, Blutto scales with your organization’s growth with zero downtime.',
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

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative mt-24 max-w-4xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-400/5 blur-2xl opacity-60 rounded-3xl" />
          <Image
            src={secureImg}
            alt="Enterprise security screenshot"
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
            Enterprise support, guaranteed uptime, white-glove onboarding.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Talk to our sales team to get a custom plan tailored for your enterprise.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/contact"
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
            >
              Contact Sales
            </a>
            <a
              href="/security"
              className="px-6 py-3 rounded-lg bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
