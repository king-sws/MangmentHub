'use client'

import avatar1 from "@/public/avatar-1.png";
import avatar2 from "@/public/avatar-2.png";
import avatar3 from "@/public/avatar-3.png";
import avatar4 from "@/public/avatar-4.png";
import avatar5 from "@/public/avatar-5.png";
import avatar6 from "@/public/avatar-6.png";
import avatar7 from "@/public/avatar-7.png";
import avatar8 from "@/public/avatar-8.png";
import avatar9 from "@/public/avatar-9.png";
import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const testimonials = [
  {
    text: "Blutto instantly impressed me with its clean interface and seamless workflow. As a designer, I appreciate tools that are both functional and beautiful.",
    imageSrc: avatar1.src,
    name: "Jamie Rivera",
    username: "@jamietechguru00"
  },
  {
    text: "Since switching to Blutto, our team has seen a massive boost in productivity. Everything just flows better.",
    imageSrc: avatar2.src,
    name: "Josh Smith",
    username: "@jjsmith"
  },
  {
    text: "Blutto completely changed how I manage projects. Deadlines are clearer, tasks are better organized, and nothing gets lost.",
    imageSrc: avatar3.src,
    name: "Morgan Lee",
    username: "@morganleewhiz"
  },
  {
    text: "We integrated Blutto into our team in minutes — and we’ve never looked back. It's intuitive and powerful.",
    imageSrc: avatar4.src,
    name: "Casey Jordan",
    username: "@caseyj"
  },
  {
    text: "Event planning used to be chaotic. With Blutto, I track every detail and deadline effortlessly. It's a game changer.",
    imageSrc: avatar5.src,
    name: "Taylor Kim",
    username: "@taylorkimm"
  },
  {
    text: "Blutto’s custom workflows and integrations fit perfectly into how we already work — no need to change our habits.",
    imageSrc: avatar6.src,
    name: "Riley Smith",
    username: "@rileysmith1"
  },
  {
    text: "Managing multiple projects was a nightmare before Blutto. Now, everything’s in sync and our communication is on point.",
    imageSrc: avatar7.src,
    name: "Jordan Patels",
    username: "@jpatelsdesign"
  },
  {
    text: "Assigning tasks, tracking status, and storing docs in one platform saves us hours each week. Blutto just works.",
    imageSrc: avatar8.src,
    name: "Sam Dawson",
    username: "@dawsontechtips"
  },
  {
    text: "Blutto feels like it was built for us — simple enough for new team members, powerful enough for advanced workflows.",
    imageSrc: avatar9.src,
    name: "Casey Harper",
    username: "@casey09"
  },
];


const firstCol = testimonials.slice(0, 3);
const secondCol = testimonials.slice(3, 6);
const thirdCol = testimonials.slice(6, 9);

const TestimonialsColumn = ({
  testimonials,
  className,
  duration = 12,
}: {
  testimonials: typeof testimonials;
  className?: string;
  duration?: number;
}) => (
  <div className={className}>
    <motion.div
      animate={{ translateY: "-50%" }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      className="flex flex-col gap-6 pb-6"
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <React.Fragment key={i}>
          {testimonials.map(({ text, imageSrc, name, username }, index) => (
            <div
  key={index}
  className="rounded-2xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/70 dark:border-white/10 shadow-md hover:shadow-lg transition-all group max-w-[360px]"
>
  {/* Quotation icon */}
  <div className="text-indigo-500 dark:text-indigo-300 mb-4">
    <svg
      className="w-6 h-6 opacity-70"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M7.17 6A5.98 5.98 0 002 12c0 3.31 2.69 6 6 6v-2a4 4 0 01-4-4c0-2.21 1.79-4 4-4h1V6H7.17zm9 0A5.98 5.98 0 0011 12c0 3.31 2.69 6 6 6v-2a4 4 0 01-4-4c0-2.21 1.79-4 4-4h1V6h-1.83z" />
    </svg>
  </div>

  {/* Testimonial text */}
  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed tracking-tight group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
    “{text}”
  </p>

  {/* Avatar and name */}
  <div className="flex items-center gap-3 mt-6">
    <Image
      src={imageSrc}
      alt={name}
      width={42}
      height={42}
      className="rounded-full border border-white dark:border-gray-700 shadow-sm"
    />
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
        {name}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {username}
      </span>
    </div>
  </div>
</div>

          ))}
        </React.Fragment>
      ))}
    </motion.div>
  </div>
);

export const Testimonials = () => {
  return (
    <section id="customers" className="bg-white dark:bg-black py-12 sm:py-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-4">
            Version 2.0 is here
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-blue-300 text-transparent bg-clip-text">
            What our users say
          </h2>
          <p className="mt-4 text-base text-gray-700 dark:text-gray-300">
            From intuitive design to powerful features, our app has become an
            essential tool for users around the world.
          </p>
        </div>

        <div className="mt-12 flex justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[738px]">
          <TestimonialsColumn testimonials={firstCol} duration={18} />
          <TestimonialsColumn
            testimonials={secondCol}
            className="hidden md:block"
            duration={22}
          />
          <TestimonialsColumn
            testimonials={thirdCol}
            className="hidden lg:block"
            duration={20}
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
