// MarketingPage.tsx
import { Button } from '@/components/ui/button';
import { Medal } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const MarketingPage = () => {

  return (
    <div className="flex flex-col items-center justify-center bg-slate-100">
      <div className="flex items-center justify-center flex-col">
        <div className="flex items-center justify-center gap-2 bg-indigo-100 rounded-full px-4 py-2 animate-fade-in">
            <Medal  className="h-5 w-5 text-indigo-600" />
            <p className="font-semibold text-sm text-indigo-800 tracking-wide">
              #1 Task Management Platform
            </p>
        </div>
        <div className="max-w-4xl px-4 flex flex-col items-center justify-center mt-8 text-center">
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight' >
          Transform Your Team&#39;s Productivity with
          <span className="block text-3xl md:text-6xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-4 p-2 rounded-md pb-4 w-fit text-center mx-auto mt-5">
            Taskify Pro
          </span>
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 flex-col">
          <p className="text-lg text-gray-600 mt-6 max-w-3xl text-center leading-relaxed">
            Streamline projects, enhance collaboration, and achieve unprecedented efficiency. 
            Whether your team is across the globe or working remotely, Taskify adapts to 
            your workflow to deliver exceptional results.
          </p>
            <Button
              asChild
              className="mt-10 text-white font-semibold px-8 py-6 rounded-lg transition-all transform shadow-lg hover:shadow-xl"
            >
              <Link href="/sign-up" className="flex items-center space-x-2">
                <span>Start Free Trial</span>
                <span className="text-lg">→</span>
              </Link>
            </Button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8 text-center text-gray-600">
          <div className="p-4 border-r border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">10k+</h3>
            <p>Active Teams</p>
          </div>
          <div className="p-4 border-r border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">98%</h3>
            <p>Customer Satisfaction</p>
          </div>
          <div className="p-4">
            <h3 className="text-2xl font-bold text-gray-900">24/7</h3>
            <p>Support</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketingPage;


















{/* <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
      <div className="flex items-center justify-center gap-2 bg-indigo-100 rounded-full px-4 py-2 animate-fade-in">
        <Medal className="h-5 w-5 text-indigo-600" />
        <p className="font-semibold text-sm text-indigo-800 tracking-wide">
          #1 Task Management Platform
        </p>
      </div>
     
      <div className="flex flex-col items-center justify-center mt-8 text-center max-w-4xl px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          Transform Your Team&#39;s Productivity with
          <span className="block text-3xl md:text-6xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-4 p-2 rounded-md pb-4 w-fit text-center mx-auto mt-5">
            Taskify Pro
          </span>
        </h1>
       
        <p className="text-lg text-gray-600 mt-6 max-w-3xl leading-relaxed">
          Streamline projects, enhance collaboration, and achieve unprecedented efficiency. 
          Whether your team is across the globe or working remotely, Taskify adapts to 
          your workflow to deliver exceptional results.
        </p>
      </div>
     
      <Button
        asChild
        className="mt-10 text-white font-semibold px-8 py-6 rounded-lg transition-all transform shadow-lg hover:shadow-xl"
      >
        <Link href="/sign-up" className="flex items-center space-x-2">
          <span>Start Free Trial</span>
          <span className="text-lg">→</span>
        </Link>
      </Button>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center text-gray-600">
        <div className="p-4 border-r border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">10k+</h3>
          <p>Active Teams</p>
        </div>
        <div className="p-4 border-r border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">98%</h3>
          <p>User Satisfaction</p>
        </div>
        <div className="p-4">
          <h3 className="text-2xl font-bold text-gray-900">2.5x</h3>
          <p>Productivity Boost</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage; */}