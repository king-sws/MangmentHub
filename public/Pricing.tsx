'use client'
import Check from "@/assets/check.svg"
import clsx from "clsx";
import { motion } from "framer-motion";

const pricingTiers = [
  {
    title: "Free",
    monthlyPrice: 0,
    buttonText: "Get started for free",
    popular: false,
    inverse: false,
    features: [
      "Up to 5 project members",
      "Unlimited tasks and projects",
      "2GB storage",
      "Integrations",
      "Basic support",
    ],
  },
  {
    title: "Pro",
    monthlyPrice: 9,
    buttonText: "Sign up now",
    popular: true,
    inverse: true,
    features: [
      "Up to 50 project members",
      "Unlimited tasks and projects",
      "50GB storage",
      "Integrations",
      "Priority support",
      "Advanced support",
      "Export support",
    ],
  },
  {
    title: "Business",
    monthlyPrice: 19,
    buttonText: "Sign up now",
    popular: false,
    inverse: false,
    features: [
      "Up to 5 project members",
      "Unlimited tasks and projects",
      "200GB storage",
      "Integrations",
      "Dedicated account manager",
      "Custom fields",
      "Advanced analytics",
      "Export capabilities",
      "API access",
      "Advanced security features",
    ],
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container">
        <div className="max-w-[540px] mx-auto" >
          <h1 className="text-5xl text-center md:text-7xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] text-transparent bg-clip-text" >Pricing</h1>
          <p className="text-xl text-center text-[#010D3E] tracking-tight mt-6">
            Free forever. Upgrade for Unlimited tasks, better security, and
            exclusive features.
          </p>
        </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-center gap-6 items-center mt-10">
            {pricingTiers.map((items, i) => (
              <div className={clsx("card", items.inverse === true && 'bg-neutral-950 border-neutral-950 text-white')} key={i} >
                <div className="flex justify-between">
                  <h3 className={clsx("text-lg font-bold text-black/50 ", items.inverse === true && 'text-blue-100')} > {items.title} </h3>
                  {items.popular === true && (
                    <div className="inline-flex text-sm px-4 py-1.5 border rounded-xl border-white/20">
                      <motion.span 
                        className="bg-[linear-gradient(to_right,#DD7DDF,#E1CD86,#BBCB92,#71C2EF,#3BFFFF,#DD7DDF)] [background-size:200%] text-transparent bg-clip-text font-medium "
                        animate={{
                          backgroundPositionX: '-100%',
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                          repeatType: "loop",
                        }}
                        >Popular</motion.span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-[30px]" >
                  <span className="text-4xl font-bold tracking-tighter " >${items.monthlyPrice} </span>
                  <span className="tracking-tight font-bold text-black/50" >/month </span>
                </div>
                <button className={clsx("btn btn-primary w-full mt-[30px] ", items.inverse === true && 'bg-white text-black')} > {items.buttonText} </button>
                <ul className="flex flex-col gap-5 mt-7" >
                  {items.features.map((features)=>( 
                    <li key={features} className="flex text-sm gap-4"> 
                      <Check className='h-6 w-6 '/>
                      <span>{features}</span> 
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