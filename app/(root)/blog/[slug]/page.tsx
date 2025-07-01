import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Share2, 
  BookOpen,
  TrendingUp,
  Zap,
  Users,
  Code,
  Globe,
  Tag,
  ArrowRight
} from 'lucide-react';

interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  author: string;
  authorTitle: string;
  category: string;
  tags: string[];
  description: string;
  content: string;
}

interface BlogPosts {
  [key: string]: BlogPost;
}

const blogPosts: BlogPosts = {
  'boost-productivity': {
    title: 'Boost Productivity with Blutto: A Complete Guide',
    date: '2025-06-20',
    readTime: '8 min read',
    author: 'Sarah Chen',
    authorTitle: 'Head of Product',
    category: 'Productivity',
    tags: ['Productivity', 'Workflows', 'Team Management'],
    description: 'Discover how Blutto helps teams streamline workflows and increase efficiency by up to 40%. Learn the proven strategies that leading companies use.',
    content: `
# Introduction

In today's fast-paced business environment, productivity isn't just a buzzword—it's a competitive advantage. After analyzing data from over 10,000 teams using Blutto, we've identified the key strategies that separate high-performing teams from the rest.

## The Productivity Challenge

Most teams struggle with three fundamental issues:

- **Fragmented workflows** across multiple tools and platforms
- **Lack of visibility** into project progress and team capacity  
- **Communication overhead** that consumes valuable time

Our research shows that the average knowledge worker spends 2.5 hours daily just switching between applications and searching for information. That's 32% of their workday lost to productivity friction.

## The Blutto Approach

Blutto addresses these challenges through three core principles:

### 1. Unified Workflow Management

Instead of juggling multiple tools, Blutto provides a single source of truth for all your team's work. Our integrated approach connects:

- Project planning and task management
- Communication and collaboration
- File sharing and version control
- Time tracking and reporting

**Case Study:** TechFlow Inc. reduced their tool stack from 12 applications to 3 after implementing Blutto, resulting in a 40% increase in project delivery speed.

### 2. Intelligent Automation

Blutto's automation engine learns from your team's patterns and proactively suggests optimizations:

- **Smart task routing** based on team member skills and availability
- **Automated status updates** that keep stakeholders informed
- **Predictive resource allocation** to prevent bottlenecks

### 3. Data-Driven Insights

Make decisions based on real data, not gut feelings:

- **Team performance analytics** with actionable recommendations
- **Workflow bottleneck identification** and suggested improvements
- **Capacity planning** tools for better resource management

## Implementation Strategy

Rolling out Blutto successfully requires a structured approach:

### Phase 1: Foundation (Week 1-2)
- Set up core workflows and project templates
- Import existing data from legacy tools
- Train team leads on advanced features

### Phase 2: Integration (Week 3-4)
- Connect external tools and services
- Configure automation rules
- Establish reporting dashboards

### Phase 3: Optimization (Week 5-8)
- Analyze usage patterns and performance metrics
- Fine-tune workflows based on team feedback
- Scale successful patterns across the organization

## Measuring Success

Track these key metrics to ensure your productivity improvements are sustainable:

- **Cycle time reduction:** How quickly work moves from start to finish
- **Context switching frequency:** Time spent switching between tools
- **Team satisfaction scores:** Regular pulse surveys on tool effectiveness
- **Delivery predictability:** Variance between estimated and actual completion times

## Advanced Tips for Power Users

### Custom Automation Recipes

Create sophisticated automation workflows using Blutto's visual automation builder.

### Integration Patterns

Connect Blutto to your existing tech stack with these proven patterns:

- **Bi-directional sync** with GitHub for code-related tasks
- **Smart notifications** to Slack based on project urgency
- **Automated reporting** to executive dashboards

## Common Pitfalls to Avoid

Learn from the mistakes of others:

1. **Over-automation:** Start simple and gradually add complexity
2. **Ignoring change management:** Invest in proper training and adoption
3. **Neglecting customization:** Adapt Blutto to your unique workflows

## The Results

Teams that follow this guide typically see:

- **35-45% reduction** in administrative overhead
- **25-30% faster** project completion times
- **60% improvement** in cross-team collaboration
- **90% reduction** in "where is this?" questions

## Next Steps

Ready to transform your team's productivity? Here's how to get started:

1. **Audit your current workflow** to identify the biggest pain points
2. **Start with a pilot project** to test Blutto with a small team
3. **Measure baseline metrics** before implementation
4. **Follow the phased rollout** approach outlined above

Remember, productivity improvements compound over time. The teams that start today will have a significant advantage in the months and years ahead.

---

*Have questions about implementing Blutto in your organization? Reach out to our success team at success@blutto.com for personalized guidance.*
    `
  },
  'design-blutto-ui': {
    title: 'How We Designed Blutto\'s Interface: A Design System Deep Dive',
    date: '2025-06-15',
    readTime: '12 min read',
    author: 'Alex Rodriguez',
    authorTitle: 'Senior Design Lead',
    category: 'Design',
    tags: ['Design System', 'UI/UX', 'Accessibility'],
    description: 'A comprehensive behind-the-scenes look at our design system, accessibility principles, and the decisions that shaped Blutto\'s user experience.',
    content: `
# The Story Behind Blutto's Design

When we set out to design Blutto, we had one overarching goal: create an interface so intuitive that teams could focus on their work, not on learning our tool. This is the story of how we built a design system that scales across teams, cultures, and use cases.

## Our Design Philosophy

### Clarity Over Cleverness

Every design decision starts with one question: "Does this make the user's job easier?" We chose clarity over visual flair, functionality over form. This doesn't mean our interface is boring—quite the opposite. By removing unnecessary complexity, we created space for the work that matters.

### Progressive Disclosure

Information architecture follows the principle of progressive disclosure. Users see what they need, when they need it. Advanced features are available but don't clutter the primary interface.

### Accessibility-First Design

From the very beginning, we designed for accessibility. This wasn't an afterthought—it shaped every component, color choice, and interaction pattern.

## Building the Design System

### Color Psychology and Accessibility

Our color palette serves multiple purposes:

**Primary Colors:**
- **Blue (#2563EB):** Trust, reliability, productivity
- **Green (#059669):** Success, completion, growth
- **Orange (#EA580C):** Attention, urgency, energy

**Neutral Colors:**
- **Slate variants:** Provide hierarchy without distraction
- **High contrast ratios:** Ensure readability for all users

Every color combination meets WCAG 2.1 AA standards, with many exceeding AAA requirements.

### Typography That Works

We chose Inter as our primary typeface for several reasons:

- **Optimized for screens:** Excellent readability at all sizes
- **International support:** Works across languages and scripts
- **Variable font technology:** Reduces load times while providing flexibility

Our typographic scale follows a 1.25 ratio, creating harmonious proportions:

- **Heading 1:** 36px (2.25rem)
- **Heading 2:** 30px (1.875rem)
- **Heading 3:** 24px (1.5rem)
- **Body:** 16px (1rem)
- **Small:** 14px (0.875rem)

### Component Philosophy

Each component in our system follows strict principles:

#### Composability
Components work together seamlessly. A button component can be used in cards, modals, or standalone contexts without breaking.

#### Consistency
Visual and behavioral patterns are consistent across the entire application. Once you learn one interaction pattern, it applies everywhere.

#### Flexibility
Components adapt to different content types and contexts while maintaining their core identity.

## Key Design Challenges

### The Dashboard Dilemma

Dashboards are notoriously difficult to design well. Too much information overwhelms users; too little leaves them feeling uninformed.

Our solution: **Contextual Dashboards**

Instead of one massive dashboard, we created role-specific views:

- **Project Managers** see timeline and resource information
- **Individual Contributors** see their tasks and deadlines  
- **Executives** see high-level metrics and trends

### Mobile-First Complexity

Designing productivity software for mobile presents unique challenges. How do you fit complex workflows into a small screen?

Our approach:
- **Task-focused screens:** Each screen accomplishes one primary task
- **Smart defaults:** Reduce cognitive load with intelligent pre-selections
- **Gesture-based navigation:** Swipe to complete, long-press for options

### Information Architecture

With dozens of features and thousands of data points, organizing information was crucial.

We developed a **three-tier architecture:**

1. **Primary navigation:** Core features (Projects, Tasks, Team)
2. **Secondary navigation:** Context-specific options
3. **Tertiary navigation:** Advanced settings and configurations

## Testing and Iteration

### User Research Methods

Our design process includes multiple research methods:

**Quantitative Research:**
- A/B testing on key interactions
- Analytics on feature usage and drop-off points
- Performance metrics (load times, error rates)

**Qualitative Research:**
- User interviews with teams of all sizes
- Usability testing sessions
- Accessibility audits with disabled users

### Key Learnings

Some insights that shaped our final design:

1. **Icons need labels:** Even universal icons benefit from accompanying text
2. **White space is a feature:** Generous spacing reduces cognitive load
3. **Animations guide attention:** Subtle motion helps users understand state changes
4. **Customization vs. Configuration:** Users want control but not complexity

## Accessibility Deep Dive

### Screen Reader Optimization

Every interactive element includes proper ARIA labels and descriptions. We test regularly with NVDA, JAWS, VoiceOver, and TalkBack.

### Keyboard Navigation

Complete keyboard accessibility including:
- Logical tab order throughout the application
- Skip links for efficient navigation
- Keyboard shortcuts for power users
- Focus indicators that are clearly visible

### Color and Contrast

Beyond meeting WCAG standards, we:
- Never rely on color alone to convey information
- Provide multiple ways to distinguish important elements
- Test with various forms of color blindness

## Performance Considerations

### Design Impact on Performance

Every design decision affects performance:

- **Simplified icons:** Custom SVG icons load faster than icon fonts
- **Optimized images:** Proper sizing and compression for all contexts
- **CSS architecture:** Minimal, organized stylesheets reduce render time
- **Component lazy loading:** Advanced features load only when needed

### Perceived Performance

Users perceive performance differently than actual metrics show:

- **Skeleton screens:** Show structure while content loads
- **Progressive enhancement:** Core functionality works immediately
- **Micro-interactions:** Provide immediate feedback for user actions

## Design System Governance

### Documentation Standards

Our design system documentation includes:
- **Usage guidelines:** When and how to use each component
- **Code examples:** Both React and vanilla HTML implementations
- **Accessibility notes:** ARIA patterns and keyboard behavior
- **Design tokens:** Exportable variables for colors, spacing, and typography

### Version Control

We maintain design system versions with:
- **Semantic versioning:** Clear communication about breaking changes
- **Migration guides:** Step-by-step instructions for updates
- **Deprecation notices:** Early warning about upcoming changes

## Tools and Workflow

### Design Tools
- **Figma:** Primary design tool with shared component library
- **Principle:** Prototyping complex interactions
- **Stark:** Accessibility testing and color contrast validation

### Development Handoff
- **Design tokens:** Automated export from Figma to code
- **Component documentation:** Generated from actual code
- **Visual regression testing:** Automated comparison of design and implementation

## Future Evolution

### Planned Improvements

- **Dark mode:** Full dark theme support (launching Q3 2025)
- **Personalization:** User-customizable interface elements
- **Advanced accessibility:** Voice control and eye-tracking support
- **Internationalization:** Right-to-left language support

### Emerging Trends

We're keeping an eye on:
- **Voice interfaces:** Integration with smart assistants
- **Augmented reality:** Task visualization in physical spaces
- **AI-assisted design:** Automatically optimized layouts

## Lessons for Other Design Teams

### Start with Constraints

Constraints breed creativity. By establishing clear guidelines early, we freed ourselves to focus on solving user problems rather than debating visual details.

### Involve Engineers Early

The best designs come from close collaboration between design and engineering. Include developers in design reviews and designers in technical discussions.

### Test Early and Often

Don't wait for perfection. Test rough prototypes with real users to identify problems before they become expensive to fix.

### Document Everything

A design system without documentation is just a collection of pretty pictures. Invest in clear, comprehensive documentation from day one.

---

*Interested in our design process? Follow us on Twitter for behind-the-scenes content, or reach out to our design team at design@blutto.com.*
    `
  }
};

const categoryIcons: Record<string, typeof Tag> = {
  'Productivity': TrendingUp,
  'Design': Zap,
  'Integrations': Globe,
  'Research': Users,
  'Engineering': Code,
  'Security': User
};

const categoryColors: Record<string, string> = {
  'Productivity': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Design': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Integrations': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Research': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Engineering': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

interface BlogPostPageProps {
  params: { slug: string };
}

function parseMarkdown(content: string): string {
  return content
    .split('\n')
    .map(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ')) {
        return `<h1 class="text-3xl font-bold mt-12 mb-6 text-slate-900 dark:text-white">${trimmedLine.slice(2)}</h1>`;
      }
      if (trimmedLine.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold mt-10 mb-4 text-slate-900 dark:text-white">${trimmedLine.slice(3)}</h2>`;
      }
      if (trimmedLine.startsWith('### ')) {
        return `<h3 class="text-xl font-bold mt-8 mb-3 text-slate-900 dark:text-white">${trimmedLine.slice(4)}</h3>`;
      }
      if (trimmedLine.startsWith('#### ')) {
        return `<h4 class="text-lg font-semibold mt-6 mb-2 text-slate-900 dark:text-white">${trimmedLine.slice(5)}</h4>`;
      }
      if (trimmedLine.startsWith('- ')) {
        return `<li class="mb-2 text-slate-600 dark:text-slate-300">${trimmedLine.slice(2)}</li>`;
      }
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        return `<p class="font-semibold text-slate-900 dark:text-white mb-4">${trimmedLine.slice(2, -2)}</p>`;
      }
      if (trimmedLine === '') {
        return '<br>';
      }
      if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && !trimmedLine.includes('**') && trimmedLine.length > 2) {
        return `<p class="italic text-slate-500 dark:text-slate-400 text-center py-4 border-t border-slate-200 dark:border-slate-700 mt-12">${trimmedLine.slice(1, -1)}</p>`;
      }
      if (trimmedLine.startsWith('---')) {
        return '<hr class="my-8 border-slate-200 dark:border-slate-700">';
      }
      
      return `<p class="mb-4 text-slate-600 dark:text-slate-300 leading-relaxed">${trimmedLine}</p>`;
    })
    .join('');
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts[params.slug];
  
  if (!post) {
    return notFound();
  }

  const CategoryIcon = categoryIcons[post.category] || Tag;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#D2DCFF] dark:bg-gradient-to-br dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Blog</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Article Header */}
          <header className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${categoryColors[post.category] || categoryColors['Engineering']}`}>
                <CategoryIcon className="w-4 h-4" />
                {post.category}
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              {post.description}
            </p>
            
            {/* Article Meta */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-8">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs">{post.authorTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </header>
          
          {/* Article Content */}
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 lg:p-12 shadow-xl border border-slate-200 dark:border-slate-700">
              <div 
                className="prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/30 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-li:text-slate-600 dark:prose-li:text-slate-300"
                dangerouslySetInnerHTML={{ 
                  __html: parseMarkdown(post.content)
                }}
              />
            </div>
          </div>
          
          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{post.author}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{post.authorTitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share Article</span>
                </button>
              </div>
            </div>
          </footer>
        </div>
      </article>

      {/* Related Articles CTA */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Explore More Articles
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Discover more insights and tutorials from the Blutto team.
            </p>
            <Link 
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}