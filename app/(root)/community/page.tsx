/* eslint-disable react/no-unescaped-entities */
import { Users, MessageSquare, Heart, Trophy, BookOpen, Calendar, ExternalLink, Github, MessageCircle, HelpCircle } from 'lucide-react'

const CommunityPage = () => {
  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-black dark:to-gray-900 py-24 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 mb-6">
          <Users className="w-4 h-4" />
          Community Hub
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-black to-blue-800 dark:from-white dark:to-indigo-300 text-transparent bg-clip-text mb-6">
          Join the Blutto Community
        </h1>

        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-16">
          Connect with thousands of project managers, developers, and teams who are transforming their workflow with Blutto. Share knowledge, get support, and help shape the future of project management.
        </p>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
          {[
            { number: '15K+', label: 'Active Members' },
            { number: '2.5K+', label: 'Daily Messages' },
            { number: '500+', label: 'Templates Shared' },
            { number: '99%', label: 'Satisfaction Rate' }
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Community Features */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 text-left max-w-6xl mx-auto mb-20">
          {[
            {
              title: 'Discussion Forums',
              desc: 'Ask questions, share tips, and discuss best practices with fellow Blutto users.',
              icon: <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Template Library',
              desc: 'Browse and share project templates, workflows, and automation setups.',
              icon: <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Live Events',
              desc: 'Join webinars, workshops, and Q&A sessions with the Blutto team and experts.',
              icon: <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Expert Support',
              desc: 'Get help from community moderators and Blutto power users.',
              icon: <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Feature Requests',
              desc: 'Vote on upcoming features and suggest improvements to shape Blutto\'s roadmap.',
              icon: <Heart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            },
            {
              title: 'Recognition Program',
              desc: 'Earn badges, get featured, and be recognized for your contributions to the community.',
              icon: <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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

        {/* Community Channels */}
        <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Connect With Us
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                platform: 'Discord Server',
                desc: 'Real-time chat with the community',
                members: '8.5K members',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'bg-purple-500'
              },
              {
                platform: 'GitHub Discussions',
                desc: 'Technical discussions and feedback',
                members: '2.1K contributors',
                icon: <Github className="w-5 h-5" />,
                color: 'bg-gray-800'
              },
              {
                platform: 'Community Forum',
                desc: 'In-depth conversations and guides',
                members: '12K active users',
                icon: <Users className="w-5 h-5" />,
                color: 'bg-indigo-500'
              }
            ].map((channel, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${channel.color} text-white`}>
                    {channel.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {channel.platform}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {channel.members}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {channel.desc}
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                  Join Now <ExternalLink className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 flex-col sm:flex-row">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all">
            Join Discord Community
          </button>
          <button className="bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition-all">
            Browse Forum Topics
          </button>
        </div>

        {/* Community Guidelines */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Community Guidelines
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <p>Be respectful and constructive in all interactions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <p>Share knowledge and help others learn</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <p>Search before posting duplicate questions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <p>Keep discussions relevant to Blutto and project management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommunityPage