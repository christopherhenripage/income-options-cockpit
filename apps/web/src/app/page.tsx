// Landing page for Income Options Cockpit
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Target,
  Brain,
  BarChart3,
  Activity,
  CheckCircle,
  ArrowRight,
  LineChart,
  Zap,
  Eye,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const capabilities = [
  {
    icon: LineChart,
    title: 'Real-Time Market Analysis',
    description:
      'Live regime detection across trend, volatility, and breadth. Know when conditions favor premium selling.',
  },
  {
    icon: Target,
    title: 'Systematic Screening',
    description:
      'Automated scanning across your universe. Every candidate scored on liquidity, IV rank, and technical setup.',
  },
  {
    icon: Shield,
    title: 'Defined Risk Framework',
    description:
      'Position sizing, portfolio heat limits, and max drawdown controls. Know your exposure at all times.',
  },
  {
    icon: Brain,
    title: 'Regime-Aware Recommendations',
    description:
      'Strategy selection adapts to market conditions. CSPs in uptrends, spreads in elevated vol, defensive in downtrends.',
  },
  {
    icon: BarChart3,
    title: 'P&L Modeling',
    description:
      'Visualize profit curves across price scenarios. Understand Greeks impact before entry.',
  },
  {
    icon: Activity,
    title: 'Live Data Integration',
    description:
      'Polygon.io market data with intelligent caching. Real quotes, real chains, real analysis.',
  },
];

const strategies = [
  {
    name: 'Cash-Secured Puts',
    ticker: 'CSP',
    description: 'Collect premium while targeting entries below current price. Ideal in bullish regimes with normal to elevated IV.',
    color: 'text-blue-400',
  },
  {
    name: 'Covered Calls',
    ticker: 'CC',
    description: 'Generate yield on existing positions. Best deployed in neutral to mildly bullish conditions.',
    color: 'text-green-400',
  },
  {
    name: 'Credit Spreads',
    ticker: 'PCS/CCS',
    description: 'Defined risk premium collection. Put spreads for bullish bias, call spreads for bearish or neutral.',
    color: 'text-purple-400',
  },
];

const metrics = [
  { value: '11', label: 'Core Symbols' },
  { value: 'Live', label: 'Market Data' },
  { value: '4', label: 'Strategy Types' },
  { value: '100%', label: 'Defined Risk' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Options Cockpit</span>
                <span className="hidden sm:inline text-sm text-muted-foreground ml-2">by Chris</span>
              </div>
            </div>
            <Link href="/dashboard">
              <Button size="lg" className="btn-premium">
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-geo" />
        <div className="absolute top-20 left-10 w-72 h-72 glow-orb glow-orb-purple opacity-20" />
        <div className="absolute bottom-20 right-10 w-96 h-96 glow-orb glow-orb-cyan opacity-15" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-8">
              <Zap className="h-4 w-4" />
              Live Market Data via Polygon.io
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Systematic Income</span>
              <br />
              <span className="gradient-text-premium">Options Analysis</span>
            </h1>

            <p className="pro-text-large mb-10 max-w-3xl mx-auto text-lg sm:text-xl">
              A disciplined framework for identifying premium-selling opportunities.
              Real-time regime detection, quantitative scoring, and defined-risk position management.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/dashboard">
                <Button size="lg" className="btn-premium text-lg px-10 py-6 h-auto">
                  <Eye className="mr-2 h-6 w-6" />
                  View Live Analysis
                </Button>
              </Link>
              <Link href="#methodology">
                <Button size="lg" variant="outline" className="pro-button-outline text-lg px-10 py-6 h-auto border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  Methodology
                </Button>
              </Link>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-1">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-glow" />
      </section>

      {/* Paper Trading Notice - Subtle */}
      <section className="border-b border-purple-500/20 bg-purple-500/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-purple-400" />
            <span className="text-muted-foreground">
              <span className="text-purple-400 font-medium">Paper Trading Mode</span> —
              All positions simulated. Real market data, no capital at risk.
            </span>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="pro-section sacred-geo-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="pro-heading text-3xl sm:text-4xl mb-4">
              Built for Serious Analysis
            </h2>
            <p className="pro-text-large max-w-2xl mx-auto">
              Institutional-grade analytics in a focused, efficient interface.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((item) => (
              <div key={item.title} className="glow-card p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-5 border border-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategies Section */}
      <section id="methodology" className="pro-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="pro-heading text-3xl sm:text-4xl mb-6">
                Three Core Strategies
              </h2>
              <p className="pro-text-large mb-8">
                Time-tested income strategies with defined risk parameters.
                Each adapted to current market regime for optimal deployment.
              </p>
              <div className="space-y-6">
                {strategies.map((strategy) => (
                  <div key={strategy.name} className="flex items-start gap-4">
                    <div className={`px-3 py-1 rounded-lg bg-card border border-border font-mono text-sm ${strategy.color}`}>
                      {strategy.ticker}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-foreground">{strategy.name}</h3>
                      <p className="text-muted-foreground text-sm">{strategy.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="premium-card p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <Shield className="h-6 w-6 text-purple-400" />
                Risk Framework
              </h3>
              <ul className="space-y-4">
                {[
                  'Maximum risk per position: 3% of account',
                  'Portfolio heat limit: 15% total risk',
                  'Daily loss circuit breaker',
                  'Liquidity filters on all candidates',
                  'Earnings exclusion windows',
                  'IV rank threshold requirements',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Stack - For the sophisticated audience */}
      <section className="pro-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="pro-heading text-3xl sm:text-4xl mb-4">
              Under the Hood
            </h2>
            <p className="pro-text-large max-w-2xl mx-auto">
              Modern architecture built for reliability and extensibility.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Frontend', value: 'Next.js 14', sub: 'React Server Components' },
              { label: 'Data', value: 'Polygon.io', sub: 'Real-time market data' },
              { label: 'Engine', value: 'TypeScript', sub: 'Type-safe analysis core' },
              { label: 'Infra', value: 'Vercel Edge', sub: 'Global deployment' },
            ].map((tech) => (
              <div key={tech.label} className="glass-panel p-6 text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{tech.label}</div>
                <div className="text-xl font-semibold text-foreground mb-1">{tech.value}</div>
                <div className="text-xs text-muted-foreground">{tech.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pro-section-alt border-t border-border/50">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 glow-orb glow-orb-purple opacity-20" />

          <h2 className="pro-heading text-3xl sm:text-4xl mb-4 relative">
            Ready to Analyze?
          </h2>
          <p className="pro-text-large mb-8 max-w-2xl mx-auto relative">
            View current market conditions and today's scored opportunities.
          </p>
          <Link href="/dashboard" className="relative inline-block">
            <Button size="lg" className="btn-premium text-xl px-12 py-7 h-auto">
              <TrendingUp className="mr-3 h-7 w-7" />
              Open Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Options Cockpit</span>
                <span className="text-sm text-muted-foreground ml-2">v1.0</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Built with care. Paper trading only. Not financial advice.
            </p>
            <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
              Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
