/* eslint-disable react/no-unescaped-entities */
'use client'

import { BookOpen, Users, Folder, CheckSquare, Settings, Zap, Search, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const DocsPage = () => {
  const [copiedCode, setCopiedCode] = useState('')

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const codeBlocks = {
    createBoard: `// Create a new board
const board = await blutto.boards.create({
  name: "Product Roadmap",
  description: "Q1 2025 product features",
  workspace_id: "ws_123"
})`,
    createTask: `// Add a task to a list
const task = await blutto.tasks.create({
  title: "Design user dashboard",
  description: "Create wireframes and mockups",
  list_id: "list_456",
  assignee_id: "user_789",
  due_date: "2025-01-15"
})`,
    webhook: `// Webhook payload example
{
  "event": "task.completed",
  "data": {
    "task_id": "task_123",
    "title": "Design user dashboard",
    "completed_by": "user_789",
    "completed_at": "2025-01-10T14:30:00Z"
  }
}`
  }

  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-6">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-6">
            Blutto Documentation
          </h1>

          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Everything you need to get started with Blutto - from basic concepts to advanced integrations. Build better workflows, manage teams, and ship faster.
          </p>

          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all inline-flex items-center gap-2">
              <Search className="w-4 h-4" />
              Quick Start Guide
            </button>
            <button className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-all">
              View API Reference
            </button>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Getting Started</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Workspaces',
                desc: 'Organize your projects and teams into dedicated workspaces',
                icon: <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                link: '#workspaces'
              },
              {
                title: 'Boards & Lists',
                desc: 'Create Kanban boards with customizable lists and workflows',
                icon: <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                link: '#boards'
              },
              {
                title: 'Team Management',
                desc: 'Invite members, assign roles, and manage permissions',
                icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                link: '#teams'
              },
              {
                title: 'Automation',
                desc: 'Set up rules, triggers, and automated workflows',
                icon: <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
                link: '#automation'
              }
            ].map((item, i) => (
              <a
                key={i}
                href={item.link}
                className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Core Concepts */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Core Concepts</h2>
          
          <div className="space-y-8">
            {/* Workspaces */}
            <div id="workspaces" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Workspaces
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Workspaces are the top-level containers in Blutto. They allow you to organize your projects, teams, and boards in a logical hierarchy. Each workspace can have multiple boards, team members with different permission levels, and custom settings.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Features:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Unlimited boards per workspace</li>
                  <li>• Role-based access control (Admin, Member, Viewer)</li>
                  <li>• Custom workspace branding and settings</li>
                  <li>• Activity logs and audit trails</li>
                </ul>
              </div>
            </div>

            {/* Boards & Lists */}
            <div id="boards" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Boards & Lists
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Boards use the Kanban methodology to visualize your workflow. Each board contains lists (columns) that represent different stages of your process. Tasks (cards) move through these lists as work progresses.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Board Templates:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <strong>Kanban</strong><br />
                    <span className="text-gray-600 dark:text-gray-400">To Do → In Progress → Done</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <strong>Scrum</strong><br />
                    <span className="text-gray-600 dark:text-gray-400">Backlog → Sprint → Review → Done</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                    <strong>Bug Tracking</strong><br />
                    <span className="text-gray-600 dark:text-gray-400">Reported → Assigned → Fixed → Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Management */}
            <div id="teams" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Team Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Collaborate effectively with your team using Blutto's comprehensive permission system. Assign tasks, track progress, and maintain clear communication across all projects.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Admin</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full workspace control, billing, and member management</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Member</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create boards, manage tasks, and collaborate on projects</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Viewer</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Read-only access to view boards and task progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Examples */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">API Examples</h2>
          
          <div className="space-y-6">
            {/* Create Board */}
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create a Board</h3>
                <button
                  onClick={() => copyToClipboard(codeBlocks.createBoard, 'createBoard')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {copiedCode === 'createBoard' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode === 'createBoard' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{codeBlocks.createBoard}</code>
                </pre>
              </div>
            </div>

            {/* Create Task */}
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create a Task</h3>
                <button
                  onClick={() => copyToClipboard(codeBlocks.createTask, 'createTask')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {copiedCode === 'createTask' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode === 'createTask' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{codeBlocks.createTask}</code>
                </pre>
              </div>
            </div>

            {/* Webhook Example */}
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook Payload</h3>
                <button
                  onClick={() => copyToClipboard(codeBlocks.webhook, 'webhook')}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {copiedCode === 'webhook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode === 'webhook' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  <code>{codeBlocks.webhook}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Resources & Support</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'API Reference',
                desc: 'Complete API documentation with interactive examples',
                icon: <BookOpen className="w-5 h-5" />,
                link: '/api'
              },
              {
                title: 'Developer Hub',
                desc: 'SDKs, integrations, and developer resources',
                icon: <ExternalLink className="w-5 h-5" />,
                link: '/developers'
              },
              {
                title: 'Community Forum',
                desc: 'Get help from the Blutto community',
                icon: <Users className="w-5 h-5" />,
                link: '#'
              },
              {
                title: 'Video Tutorials',
                desc: 'Step-by-step guides and best practices',
                icon: <Zap className="w-5 h-5" />,
                link: '#'
              },
              {
                title: 'Changelog',
                desc: 'Latest updates and feature releases',
                icon: <Settings className="w-5 h-5" />,
                link: '#'
              },
              {
                title: 'Status Page',
                desc: 'Real-time system status and uptime',
                icon: <CheckSquare className="w-5 h-5" />,
                link: '#'
              }
            ].map((item, i) => (
              <a
                key={i}
                href={item.link}
                className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        
      </div>
    </section>
  )
}

export default DocsPage