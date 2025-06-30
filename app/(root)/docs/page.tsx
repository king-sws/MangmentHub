/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { 
  Book, 
  Code, 
  Zap, 
  Shield, 
  Settings, 
  Users, 
  Calendar,
  Kanban,
  ChevronRight,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';

const DocumentationPage = () => {
  type CodeBlockProps = {
    children: React.ReactNode;
    language: string;
  };

  const CodeBlock = ({ children, language }: CodeBlockProps) => (
    <div className="relative bg-gray-950 rounded-lg p-4 my-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm font-medium">{language}</span>
        <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
          <Copy className="w-4 h-4" />
          <span className="text-sm">Copy</span>
        </button>
      </div>
      <pre className="text-green-400 text-sm overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Book className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-black">Blutto Docs</h1>
              </div>
              <div className="hidden md:block w-px h-6 bg-gray-300"></div>
              <div className="hidden md:block relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-black transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          

          {/* Main Content */}
          <div className="flex-1 lg:pl-8">
            <div className="py-8">
              <div className="max-w-4xl">
                {/* Introduction Content */}
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold text-black mb-4">Welcome to Blutto</h1>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Blutto is a powerful task management platform that combines the flexibility of Kanban boards 
                      with the precision of calendar planning. Build efficient workflows, collaborate seamlessly 
                      with your team, and deliver projects on time.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <Kanban className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold text-black mb-2">Kanban Boards</h3>
                      <p className="text-gray-600 text-sm">Visual project management with drag-and-drop functionality</p>
                    </div>
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <Calendar className="w-8 h-8 text-green-600 mb-3" />
                      <h3 className="font-semibold text-black mb-2">Calendar View</h3>
                      <p className="text-gray-600 text-sm">Timeline-based planning with deadline tracking</p>
                    </div>
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <Users className="w-8 h-8 text-purple-600 mb-3" />
                      <h3 className="font-semibold text-black mb-2">Team Collaboration</h3>
                      <p className="text-gray-600 text-sm">Real-time collaboration with role-based permissions</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-black mb-4">Core Concepts</h2>
                    <div className="space-y-4">
                      <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                        <h3 className="font-semibold text-black">Projects</h3>
                        <p className="text-gray-700">The top-level container for organizing related tasks and team members</p>
                      </div>
                      <div className="p-4 border-l-4 border-green-500 bg-green-50">
                        <h3 className="font-semibold text-black">Tasks</h3>
                        <p className="text-gray-700">Individual work items with assignees, due dates, and custom fields</p>
                      </div>
                      <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                        <h3 className="font-semibold text-black">Teams</h3>
                        <p className="text-gray-700">Groups of users with shared access to projects and collaborative spaces</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Start Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <div>
                      <h2 className="text-3xl font-bold text-black mb-4">Quick Start Guide</h2>
                      <p className="text-lg text-gray-700">Get up and running with Blutto in minutes</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">1. Create Your Account</h3>
                      <p className="text-gray-700 mb-4">Sign up for Blutto and verify your email address to get started.</p>
                      <CodeBlock language="bash">
{`curl -X POST https://api.blutto.com/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "secure_password",
    "name": "John Doe"
  }'`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">2. Get Your API Key</h3>
                      <p className="text-gray-700 mb-4">Generate an API key from your dashboard to authenticate requests.</p>
                      <CodeBlock language="bash">
{`curl -X POST https://api.blutto.com/auth/api-keys \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Integration",
    "permissions": ["read", "write"]
  }'`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">3. Create Your First Project</h3>
                      <p className="text-gray-700 mb-4">Set up a project to start organizing your tasks.</p>
                      <CodeBlock language="bash">
{`curl -X POST https://api.blutto.com/projects \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My First Project",
    "description": "Getting started with Blutto",
    "visibility": "private"
  }'`}
                      </CodeBlock>
                    </div>
                  </div>

                  {/* API Reference Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <div>
                      <h2 className="text-3xl font-bold text-black mb-4">Authentication</h2>
                      <p className="text-lg text-gray-700">Secure your API requests with proper authentication</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">API Key Authentication</h3>
                      <p className="text-gray-700 mb-4">Use your API key in the Authorization header for all requests.</p>
                      <CodeBlock language="bash">
{`curl -H "Authorization: Bearer blutto_api_key_1234567890abcdef" \\
  https://api.blutto.com/projects`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">JWT Token Authentication</h3>
                      <p className="text-gray-700 mb-4">For user-specific operations, use JWT tokens obtained from the login endpoint.</p>
                      <CodeBlock language="javascript">
{`// Login to get JWT token
const response = await fetch('https://api.blutto.com/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await response.json();

// Use token for subsequent requests
const projectsResponse = await fetch('https://api.blutto.com/projects', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});`}
                      </CodeBlock>
                    </div>

                    <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-black mb-2">⚠️ Security Best Practices</h4>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Never expose API keys in client-side code</li>
                        <li>• Use environment variables to store sensitive credentials</li>
                        <li>• Rotate API keys regularly</li>
                        <li>• Use HTTPS for all requests</li>
                      </ul>
                    </div>
                  </div>

                  {/* Tasks API Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <div>
                      <h2 className="text-3xl font-bold text-black mb-4">Tasks API</h2>
                      <p className="text-lg text-gray-700">Manage tasks, assignments, and status updates</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">Create Task</h3>
                      <div className="bg-gray-100 px-4 py-2 rounded-lg mb-4">
                        <code className="text-black font-mono">POST /api/v1/tasks</code>
                      </div>
                      <CodeBlock language="json">
{`{
  "title": "Implement user authentication",
  "description": "Add login and registration functionality",
  "project_id": "proj_123456",
  "assignee_id": "user_789012",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-07-20T17:00:00Z",
  "labels": ["backend", "security"],
  "custom_fields": {
    "story_points": 8,
    "sprint": "Sprint 1"
  }
}`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">Get Tasks</h3>
                      <div className="bg-gray-100 px-4 py-2 rounded-lg mb-4">
                        <code className="text-black font-mono">GET /api/v1/tasks</code>
                      </div>
                      <p className="text-gray-700 mb-4">Query parameters:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left font-semibold text-black border-b">Parameter</th>
                              <th className="px-4 py-2 text-left font-semibold text-black border-b">Type</th>
                              <th className="px-4 py-2 text-left font-semibold text-black border-b">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 text-black border-b">project_id</td>
                              <td className="px-4 py-2 text-gray-600 border-b">string</td>
                              <td className="px-4 py-2 text-gray-600 border-b">Filter tasks by project</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-black border-b">status</td>
                              <td className="px-4 py-2 text-gray-600 border-b">string</td>
                              <td className="px-4 py-2 text-gray-600 border-b">Filter by status (todo, in_progress, done)</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-black border-b">assignee_id</td>
                              <td className="px-4 py-2 text-gray-600 border-b">string</td>
                              <td className="px-4 py-2 text-gray-600 border-b">Filter by assigned user</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-black">limit</td>
                              <td className="px-4 py-2 text-gray-600">integer</td>
                              <td className="px-4 py-2 text-gray-600">Number of results (max 100)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Webhooks Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <div>
                      <h2 className="text-3xl font-bold text-black mb-4">Webhooks</h2>
                      <p className="text-lg text-gray-700">Real-time notifications for project events</p>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">Setting up Webhooks</h3>
                      <p className="text-gray-700 mb-4">Configure webhooks to receive real-time notifications when events occur in your projects.</p>
                      <CodeBlock language="bash">
{`curl -X POST https://api.blutto.com/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/blutto",
    "events": ["task.created", "task.updated", "task.completed"],
    "secret": "your_webhook_secret"
  }'`}
                      </CodeBlock>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">Webhook Events</h3>
                      <div className="space-y-3">
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <code className="text-blue-600 font-mono">task.created</code>
                          <p className="text-gray-700 text-sm mt-1">Triggered when a new task is created</p>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <code className="text-blue-600 font-mono">task.updated</code>
                          <p className="text-gray-700 text-sm mt-1">Triggered when a task is modified</p>
                        </div>
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <code className="text-blue-600 font-mono">project.created</code>
                          <p className="text-gray-700 text-sm mt-1">Triggered when a new project is created</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black mb-4">Payload Example</h3>
                      <CodeBlock language="json">
{`{
  "event": "task.updated",
  "timestamp": "2025-06-30T12:00:00Z",
  "data": {
    "task": {
      "id": "task_123456",
      "title": "Implement user authentication",
      "status": "in_progress",
      "assignee_id": "user_789012",
      "project_id": "proj_123456",
      "updated_at": "2025-06-30T12:00:00Z"
    },
    "changes": {
      "status": {
        "from": "todo",
        "to": "in_progress"
      }
    }
  }
}`}
                      </CodeBlock>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;