/* eslint-disable react/no-unescaped-entities */
'use client'

import { Code2, TerminalSquare, GitBranch, FileCode, Zap, BookOpenCheck, ExternalLink } from 'lucide-react'

const DevelopersPage = () => {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900 py-24 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-6">
          <Code2 className="w-4 h-4" />
          Developer Hub
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-6">
          Build on Blutto
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-16">
          Whether you're building internal tools, custom integrations, or advanced automations, Blutto gives you the flexibility and power to extend the platform your way.
        </p>

        {/* Dev Capabilities */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 text-left max-w-6xl mx-auto mb-20">
          {[
            {
              title: 'Robust REST API',
              desc: 'Create, read, update, and delete everything: workspaces, boards, lists, cards, and users.',
              icon: <TerminalSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Webhooks (soon)',
              desc: 'Receive real-time notifications for changes like new tasks, updated statuses, and more.',
              icon: <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'OpenAPI Docs',
              desc: 'Interactive, auto-generated API documentation powered by Swagger/OpenAPI.',
              icon: <BookOpenCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'SDKs & Examples',
              desc: 'Official SDKs in TypeScript and Python with starter templates to get up and running fast.',
              icon: <FileCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'GitHub Integration',
              desc: 'Star, fork, and contribute to the official SDKs and tools on our GitHub repo.',
              icon: <GitBranch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Secure & Scalable',
              desc: 'OAuth 2.0 authentication, rate limiting, and enterprise-grade security baked in.',
              icon: <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
          <a
            href="/api"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            View API Preview
          </a>
          <a
            href="https://github.com/king-sws"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-all inline-flex items-center gap-2"
          >
            Visit GitHub <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default DevelopersPage
