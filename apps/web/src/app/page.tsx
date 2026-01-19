// Landing page for Income Options Cockpit
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Target,
  Brain,
  BarChart3,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Zap,
  LineChart,
  PieChart,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: LineChart,
    title: 'Market Regime Detection',
    description:
      'Automatically analyzes market conditions including trend direction, volatility levels, and risk-on/risk-off sentiment to guide strategy selection.',
  },
  {
    icon: Target,
    title: 'Scored Trade Candidates',
    description:
      'Generates and ranks potential trades using a multi-factor scoring system that evaluates premium yield, liquidity, IV rank, and trend alignment.',
  },
  {
    icon: Shield,
    title: 'Defined Risk Analysis',
    description:
      'Every trade shows clear risk parameters: maximum profit, maximum loss, breakeven price, and probability of profit - no surprises.',
  },
  {
    icon: Brain,
    title: 'Learning Context',
    description:
      'Each trade includes educational notes explaining why the strategy was selected and what factors drive its success or failure.',
  },
  {
    icon: BarChart3,
    title: 'What-If Simulator',
    description:
      'Interactive tool to visualize how your position P&L changes with price movement and time decay before committing.',
  },
  {
    icon: BookOpen,
    title: 'Trade Journal',
    description:
      'Document your trades, track your discipline, and build a record of your learning journey with integrated journaling.',
  },
];

const strategies = [
  {
    name: 'Cash-Secured Puts',
    abbrev: 'CSP',
    description: 'Sell puts on stocks you want to own at lower prices',
    color: 'text-blue-400 border-blue-500/50',
  },
  {
    name: 'Covered Calls',
    abbrev: 'CC',
    description: 'Generate income on stocks you already hold',
    color: 'text-green-400 border-green-500/50',
  },
  {
    name: 'Put Credit Spreads',
    abbrev: 'PCS',
    description: 'Bullish spreads with capped risk and reward',
    color: 'text-purple-400 border-purple-500/50',
  },
  {
    name: 'Call Credit Spreads',
    abbrev: 'CCS',
    description: 'Bearish spreads for range-bound or declining markets',
    color: 'text-orange-400 border-orange-500/50',
  },
];

const steps = [
  {
    number: '01',
    title: 'Check Market Regime',
    description:
      'Start with the dashboard to understand current market conditions - is it trending, volatile, risk-on or risk-off?',
  },
  {
    number: '02',
    title: 'Browse Trade Candidates',
    description:
      'Review scored trades filtered by strategy type. Higher scores indicate better alignment with current conditions.',
  },
  {
    number: '03',
    title: 'Analyze the Evidence',
    description:
      'Dive into individual trades to see pass/fail checks, score breakdown, and the reasoning behind each recommendation.',
  },
  {
    number: '04',
    title: 'Simulate Outcomes',
    description:
      'Use the what-if tool to understand how price changes and time decay affect your potential profit or loss.',
  },
  {
    number: '05',
    title: 'Paper Trade',
    description:
      'Approve trades to your paper portfolio to track performance without risking real money.',
  },
  {
    number: '06',
    title: 'Journal & Learn',
    description:
      'Document your decisions, review outcomes, and build the discipline needed for consistent income generation.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* Navigation */}
      <nav className="border-b border-primary/20 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center neon-border">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">Income Options Cockpit</span>
            </div>
            <Link href="/dashboard">
              <Button variant="neon" size="sm" className="pulse-glow">
                Enter App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        {/* Animated background orbs */}
        <div className="glow-orb glow-orb-cyan w-96 h-96 -top-48 -left-48 float" />
        <div className="glow-orb glow-orb-purple w-80 h-80 top-1/4 -right-40 float" style={{ animationDelay: '2s' }} />
        <div className="glow-orb glow-orb-green w-64 h-64 bottom-20 left-1/4 float" style={{ animationDelay: '4s' }} />

        <div className="absolute inset-0 hero-grid" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 text-primary border-primary/50 neon-border fade-in-up">
              Paper Trading & Learning Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 fade-in-up fade-in-up-delay-1">
              <span className="gradient-text-purple">Systematic Options Income</span>
              <span className="block neon-text-intense mt-2">With Defined Risk</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto fade-in-up fade-in-up-delay-2">
              Generate consistent income through options selling strategies.
              The Cockpit analyzes market conditions, scores trade candidates,
              and helps you learn with every decision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-in-up fade-in-up-delay-3">
              <Link href="/dashboard">
                <Button size="lg" variant="neon" className="text-lg px-8 neon-glow">
                  <Zap className="mr-2 h-5 w-5" />
                  Launch Dashboard
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 border-primary/50 hover:bg-primary/10">
                  Learn How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="border-y border-yellow-500/30 bg-yellow-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start sm:items-center gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1 sm:mt-0" />
            <div>
              <h3 className="font-semibold text-yellow-400">Demo Mode Active</h3>
              <p className="text-sm text-muted-foreground">
                This platform uses simulated market data for demonstration and learning purposes.
                No real trades are executed. Paper trading positions track hypothetical performance only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section className="py-20 bg-card/30 relative overflow-hidden">
        <div className="glow-orb glow-orb-purple w-72 h-72 -bottom-36 -right-36 opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Core Strategies
            </Badge>
            <h2 className="text-3xl font-bold mb-4 gradient-text">Income-Focused Strategies</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The Cockpit focuses on four core options selling strategies designed
              to generate consistent premium income with clearly defined risk parameters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {strategies.map((strategy, index) => (
              <div key={strategy.abbrev} className="glow-card p-6 fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <Badge variant="outline" className={strategy.color + ' mb-3'}>
                  {strategy.abbrev}
                </Badge>
                <h3 className="font-semibold mb-2">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 relative overflow-hidden">
        <div className="glow-orb glow-orb-cyan w-64 h-64 -top-32 -left-32 opacity-20" />
        <div className="glow-orb glow-orb-green w-48 h-48 bottom-20 right-10 opacity-15" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Platform Features
            </Badge>
            <h2 className="text-3xl font-bold mb-4 gradient-text">Powerful Analysis Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze, select, and learn from options trades
              in one integrated platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="glow-card p-6 group">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 neon-border group-hover:neon-glow transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Workflow
            </Badge>
            <h2 className="text-3xl font-bold mb-4 gradient-text-purple">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A systematic workflow for finding, analyzing, and learning from
              income-focused options trades.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Connecting line for desktop */}
                {index < steps.length - 1 && index !== 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="glow-card p-6 h-full relative overflow-hidden">
                  {/* Animated number background */}
                  <span className="absolute -top-4 -right-2 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-300 select-none">
                    {step.number}
                  </span>
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center neon-border">
                      <span className="text-sm font-bold text-primary">{step.number}</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 relative">{step.title}</h3>
                  <p className="text-muted-foreground text-sm relative">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 relative overflow-hidden">
        <div className="glow-orb glow-orb-green w-56 h-56 -bottom-28 -left-28 opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-green-400 border-green-500/30">
                Education First
              </Badge>
              <h2 className="text-3xl font-bold mb-6 gradient-text">Built for Learning</h2>
              <p className="text-muted-foreground mb-8">
                The Cockpit isn't just about finding trades - it's about understanding
                why certain trades work in certain conditions. Every recommendation
                comes with educational context.
              </p>
              <ul className="space-y-4">
                {[
                  'Understand how market regime affects strategy selection',
                  'Learn to read option greeks and what they mean for your position',
                  'See how time decay (theta) works in your favor as a seller',
                  'Build discipline through journaling and tracking',
                  'Practice with paper trading before using real capital',
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3 group">
                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glow-card p-8">
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:neon-border transition-all">
                      <PieChart className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Score Breakdown</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-13">
                    See exactly how each trade is scored across multiple factors:
                    premium yield, liquidity, IV rank, trend alignment, and more.
                  </p>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:neon-border transition-all">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Risk Box</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-13">
                    Every trade displays maximum profit, maximum loss, breakeven,
                    and probability of profit upfront - no hidden risks.
                  </p>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:neon-border transition-all">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold">Learning Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-13">
                    Contextual explanations help you understand why a strategy
                    was selected and what to watch for during the trade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient-bg" />
        <div className="glow-orb glow-orb-cyan w-96 h-96 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
        <div className="glow-orb glow-orb-purple w-64 h-64 top-0 right-1/4 opacity-20 float" />
        <div className="glow-orb glow-orb-green w-48 h-48 bottom-0 left-1/4 opacity-20 float" style={{ animationDelay: '3s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="glow-card p-12 max-w-2xl mx-auto cyber-border">
            <Zap className="h-12 w-12 text-primary mx-auto mb-6 neon-text" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Ready to Start?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Explore the dashboard, browse trade candidates, and start building
              your options income strategy with paper trading.
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="neon" className="text-lg px-10 py-6 pulse-glow">
                <TrendingUp className="mr-2 h-5 w-5" />
                Enter the Cockpit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center neon-border">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold gradient-text">Income Options Cockpit</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Educational platform for learning options income strategies.
              Not financial advice. Paper trading only.
            </p>
            <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
