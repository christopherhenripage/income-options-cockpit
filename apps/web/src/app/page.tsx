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
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold neon-text">Income Options Cockpit</span>
            </div>
            <Link href="/dashboard">
              <Button variant="neon" size="sm">
                Enter App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 text-primary border-primary/50">
              Paper Trading & Learning Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Systematic Options Income
              <span className="block neon-text">With Defined Risk</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate consistent income through options selling strategies.
              The Cockpit analyzes market conditions, scores trade candidates,
              and helps you learn with every decision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" variant="neon" className="text-lg px-8">
                  <Zap className="mr-2 h-5 w-5" />
                  Launch Dashboard
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
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
      <section className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Income-Focused Strategies</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The Cockpit focuses on four core options selling strategies designed
              to generate consistent premium income with clearly defined risk parameters.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {strategies.map((strategy) => (
              <Card key={strategy.abbrev} className="glass-panel border-border/50">
                <CardContent className="pt-6">
                  <Badge variant="outline" className={strategy.color + ' mb-3'}>
                    {strategy.abbrev}
                  </Badge>
                  <h3 className="font-semibold mb-2">{strategy.name}</h3>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Analysis Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze, select, and learn from options trades
              in one integrated platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass-panel p-6 rounded-xl">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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
      <section id="how-it-works" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A systematic workflow for finding, analyzing, and learning from
              income-focused options trades.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="glass-panel p-6 rounded-xl h-full">
                  <span className="text-4xl font-bold text-primary/20 absolute top-4 right-4">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Learning</h2>
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
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-panel p-8 rounded-xl">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Score Breakdown</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    See exactly how each trade is scored across multiple factors:
                    premium yield, liquidity, IV rank, trend alignment, and more.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Risk Box</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Every trade displays maximum profit, maximum loss, breakeven,
                    and probability of profit upfront - no hidden risks.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Learning Notes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
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
      <section className="py-20 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Explore the dashboard, browse trade candidates, and start building
            your options income strategy with paper trading.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="neon" className="text-lg px-8">
              <TrendingUp className="mr-2 h-5 w-5" />
              Enter the Cockpit
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Income Options Cockpit</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Educational platform for learning options income strategies.
              Not financial advice. Paper trading only.
            </p>
            <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-primary">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
