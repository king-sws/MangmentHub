/* eslint-disable react/no-unescaped-entities */
'use client'

import { Server, Zap, TerminalSquare, Clock, Lock, Code2 } from 'lucide-react'

const ApiPage = () => {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900 py-24 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-6">
          <Code2 className="w-4 h-4" />
          Developer API
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-6">
          Powerful API Access Coming Soon
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12">
          Blutto's public API is under active development. Soon, you’ll be able to programmatically manage data, automate workflows, and build custom integrations.
        </p>

        {/* Preview Feature Grid */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 text-left max-w-5xl mx-auto mb-16">
          {[
            {
              title: 'RESTful Endpoints',
              icon: <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Secure and well-documented REST endpoints for data access and manipulation.'
            },
            {
              title: 'Webhooks & Events',
              icon: <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Real-time updates with webhook subscriptions for boards, tasks, and users.'
            },
            {
              title: 'OAuth Authentication',
              icon: <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Secure authentication for user data with industry-standard OAuth 2.0.'
            },
            {
              title: 'Rate Limiting & Monitoring',
              icon: <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Transparent rate limits and detailed logs to monitor API usage.'
            },
            {
              title: 'OpenAPI Schema',
              icon: <TerminalSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Auto-generated docs via OpenAPI/Swagger for easy developer experience.'
            },
            {
              title: 'Custom Integrations',
              icon: <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
              desc: 'Build integrations with third-party apps like Slack, Zapier, and Notion.'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 flex-col sm:flex-row">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
            Request Early Access
          </button>
          <button className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-all">
            Get Notified on Launch
          </button>
        </div>
      </div>
    </section>
  )
}

export default ApiPage
