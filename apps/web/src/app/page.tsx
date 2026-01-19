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
  LineChart,
  PieChart,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: LineChart,
    title: 'Market Analysis',
    description:
      'See current market conditions at a glance - whether the market is trending up or down, and how volatile it is.',
  },
  {
    icon: Target,
    title: 'Trade Recommendations',
    description:
      'Get scored trade ideas based on current market conditions. Each trade is ranked so you can focus on the best opportunities.',
  },
  {
    icon: Shield,
    title: 'Clear Risk Information',
    description:
      'Every trade shows exactly how much you could make or lose. No hidden risks or surprises.',
  },
  {
    icon: Brain,
    title: 'Educational Explanations',
    description:
      'Learn as you go with plain-English explanations of why each trade was recommended.',
  },
  {
    icon: BarChart3,
    title: 'Profit Calculator',
    description:
      'See how your trade would perform at different stock prices before you commit.',
  },
  {
    icon: BookOpen,
    title: 'Trade Journal',
    description:
      'Keep notes on your trades to track what works and learn from experience.',
  },
];

const strategies = [
  {
    name: 'Cash-Secured Puts',
    description: 'Get paid to potentially buy stocks you want at a lower price.',
  },
  {
    name: 'Covered Calls',
    description: 'Earn extra income on stocks you already own.',
  },
  {
    name: 'Credit Spreads',
    description: 'Generate income with limited, defined risk.',
  },
];

const benefits = [
  'Real market data updated throughout the day',
  'Clear explanations in plain English',
  'Practice with paper trading before using real money',
  'Maximum loss clearly shown for every trade',
  'Works on any device - computer, tablet, or phone',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                Options Cockpit
              </span>
            </div>
            <Link href="/dashboard">
              <Button size="lg" className="text-base sm:text-lg px-6 py-3">
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pro-section border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="pro-heading text-4xl sm:text-5xl lg:text-6xl mb-6">
              Generate Income from Options
              <span className="block text-primary mt-2">With Confidence</span>
            </h1>
            <p className="pro-text-large mb-10 max-w-3xl mx-auto">
              A straightforward tool for finding options trades that generate income.
              See real market data, get clear recommendations, and understand every trade
              before you make it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-10 py-6 h-auto">
                  <TrendingUp className="mr-2 h-6 w-6" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 h-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="border-b border-yellow-500/30 bg-yellow-500/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start sm:items-center gap-4">
            <AlertTriangle className="h-7 w-7 text-yellow-500 flex-shrink-0 mt-1 sm:mt-0" />
            <div>
              <h3 className="font-semibold text-yellow-500 text-lg">Paper Trading Mode</h3>
              <p className="text-base text-muted-foreground">
                This platform is for learning and practice. Trades are simulated - no real money is used.
                Real market data is provided for realistic practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="pro-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="pro-heading text-3xl sm:text-4xl mb-4">
              What This Tool Does
            </h2>
            <p className="pro-text-large max-w-3xl mx-auto">
              Options Cockpit helps you find and analyze income-generating options trades.
              It does the research so you can focus on making decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="pro-card">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="pro-text">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section className="pro-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="pro-heading text-3xl sm:text-4xl mb-6">
                Three Proven Strategies
              </h2>
              <p className="pro-text-large mb-8">
                We focus on three income-generating strategies that professional traders
                have used for decades. Each one has clearly defined risks.
              </p>
              <div className="space-y-6">
                {strategies.map((strategy, index) => (
                  <div key={strategy.name} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{strategy.name}</h3>
                      <p className="pro-text">{strategy.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pro-card">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-8 w-8 text-green-500" />
                <h3 className="text-2xl font-semibold">Safety First</h3>
              </div>
              <p className="pro-text-large mb-6">
                Every trade shows you:
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <span className="text-lg">Maximum profit possible</span>
                </li>
                <li className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <span className="text-lg">Maximum loss possible</span>
                </li>
                <li className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-blue-500" />
                  <span className="text-lg">Break-even price</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-purple-500" />
                  <span className="text-lg">Days until expiration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="pro-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="pro-heading text-3xl sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="pro-text-large max-w-3xl mx-auto">
              A simple process to find and evaluate income-generating trades.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Check the Market',
                description: 'Start with the dashboard to see current market conditions and what strategies work best right now.',
              },
              {
                step: '2',
                title: 'Review Trade Ideas',
                description: 'Browse through recommended trades, sorted by score. Higher scores mean better alignment with current conditions.',
              },
              {
                step: '3',
                title: 'Understand the Details',
                description: 'Click any trade to see the full breakdown - profit potential, risk, and why it was recommended.',
              },
              {
                step: '4',
                title: 'Test with Calculator',
                description: 'Use the profit calculator to see how the trade performs at different stock prices.',
              },
              {
                step: '5',
                title: 'Practice First',
                description: 'Add trades to your paper portfolio to track how they would perform without risking real money.',
              },
              {
                step: '6',
                title: 'Keep Notes',
                description: 'Use the journal to record your thinking and learn from each trade over time.',
              },
            ].map((item) => (
              <div key={item.step} className="pro-card">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-4">
                  <span className="text-xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="pro-text">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="pro-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="pro-card">
              <h3 className="text-2xl font-semibold mb-6">What You Get</h3>
              <ul className="pro-feature-list space-y-2">
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="pro-heading text-3xl sm:text-4xl mb-6">
                Built for Learning
              </h2>
              <p className="pro-text-large mb-6">
                Whether you're new to options or have years of experience, this tool
                helps you make better-informed decisions.
              </p>
              <p className="pro-text-large mb-6">
                Every recommendation comes with an explanation. You'll understand not
                just what to do, but why - so you can learn and improve over time.
              </p>
              <p className="pro-text">
                Start with paper trading to build confidence before committing real capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pro-section-alt border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="pro-heading text-3xl sm:text-4xl mb-4">
            Ready to Get Started?
          </h2>
          <p className="pro-text-large mb-8 max-w-2xl mx-auto">
            Open the dashboard to see today's market conditions and
            browse current trade recommendations.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-xl px-12 py-7 h-auto">
              <TrendingUp className="mr-3 h-7 w-7" />
              Open Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold">Options Cockpit</span>
            </div>
            <p className="text-base text-muted-foreground text-center">
              Educational platform for learning options strategies.
              Not financial advice. Paper trading only.
            </p>
            <Link href="/disclaimer" className="text-base text-muted-foreground hover:text-primary transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
