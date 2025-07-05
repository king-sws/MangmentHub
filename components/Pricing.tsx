'use client';

import Check from "@/public/check.svg";
import clsx from "clsx";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const pricingTiers = [
  {
    title: "Free",
    monthlyPrice: 0,
    buttonText: "Start for free",
    popular: false,
    inverse: false,
    features: [
      "1 Workspace",
      "3 Boards per workspace",
      "3 Members per workspace",
      "Basic task management",
      "Kanban view",
      "Real-time collaboration",
      "Limited file attachments",
      "Email support",
    ],
  },
  {
    title: "Pro",
    monthlyPrice: 9,
    buttonText: "Upgrade to Pro",
    popular: true,
    inverse: true,
    features: [
      "5 Workspaces",
      "10 Boards per workspace",
      "10 Members per workspace",
      "Advanced task management",
      "Calendar & List views",
      "Due date reminders",
      "Task priority & labels",
      "Recurring tasks",
      "Commenting & mentions",
      "Integrations (Google Calendar, Slack)",
      "File attachments (up to 100MB)",
      "Standard support",
    ],
  },
  {
    title: "Business",
    monthlyPrice: 19,
    buttonText: "Get Business Plan",
    popular: false,
    inverse: false,
    features: [
      "Unlimited workspaces & boards",
      "Up to 50 members per workspace",
      "All Pro features included",
      "Advanced permissions & roles",
      "Admin controls & audit logs",
      "Analytics dashboard",
      "Custom fields & automation",
      "SSO & 2FA security",
      "Integrations (Google Calendar, Slack)",
      "Priority support",
      "File attachments (up to 500MB)",
      "Unlimited file attachments",
      "Priority support",
      "Dedicated onboarding",
    ],
  },
];


export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-white dark:bg-neutral-950">
      <div className=" px-4">
        <div className="max-w-[540px] mx-auto text-center">

            <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
            Version 2.0 is here
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
            Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Free forever. Upgrade for more power, better security, and exclusive features.
          </p>
          
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-center gap-6 items-center mt-16">
          {pricingTiers.map((items, i) => (
            <div
              key={i}
              className={clsx(
  "w-full max-w-sm rounded-2xl p-6 border backdrop-blur-md shadow-md transition-all duration-300",
  items.inverse
    ? "bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] border-white/10 text-white shadow-xl"
    : "bg-white/80 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700/50 text-gray-900 dark:text-white shadow-sm dark:shadow-lg"
)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold tracking-tight">
                  {items.title}
                </h3>
                {items.popular && (
                  <motion.div
                    className="text-xs px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
                    animate={{ backgroundPositionX: ["0%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <span className="bg-[linear-gradient(to_right,#DD7DDF,#E1CD86,#BBCB92,#71C2EF,#3BFFFF,#DD7DDF)] bg-clip-text text-transparent font-medium [background-size:200%]">
                      Popular
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  ${items.monthlyPrice}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>

              <Link href="/sign-up">
                <button
                  className={clsx(
                    "w-full mt-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
                    items.inverse
                      ? "text-white bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/20 backdrop-blur-sm shadow-lg"
                      : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-lg"
                  )}
                >
                  {items.buttonText}
                </button>
              </Link>

              <ul className="mt-6 space-y-4">
                {items.features.map((feature) => (
                  <li key={feature} className="flex items-start text-sm">
                    <Image src={Check} alt="" width={24} height={24} className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="ml-3 leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;