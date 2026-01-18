import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BookOpen,
  Plus,
  Award,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent, formatDate, getStrategyLabel, getStrategyClass } from '@/lib/utils';

// Mock positions data
const mockPositions = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'cash_secured_put',
    status: 'open',
    openedAt: '2024-01-10',
    strike: 235,
    expiration: '2024-02-16',
    entryCredit: 215,
    currentValue: 145,
    currentPnL: 70,
    dte: 32,
  },
  {
    id: '2',
    symbol: 'SPY',
    strategyType: 'put_credit_spread',
    status: 'open',
    openedAt: '2024-01-08',
    strike: 575,
    expiration: '2024-02-09',
    entryCredit: 145,
    currentValue: 85,
    currentPnL: 60,
    dte: 25,
  },
];

const mockClosedPositions = [
  {
    id: '3',
    symbol: 'MSFT',
    strategyType: 'cash_secured_put',
    openedAt: '2023-12-15',
    closedAt: '2024-01-05',
    entryCredit: 185,
    exitDebit: 45,
    realizedPnL: 140,
    result: 'profit',
  },
];

const mockJournalEntries = [
  {
    id: '1',
    date: '2024-01-15',
    title: 'Weekly Review: Strong start to the year',
    preview: 'Markets continue to trend higher. Closed MSFT position for 76% profit...',
    mood: 'confident',
  },
  {
    id: '2',
    date: '2024-01-08',
    title: 'New positions opened',
    preview: 'Opened AAPL CSP and SPY PCS based on regime analysis...',
    mood: 'cautious',
  },
];

const mockBadges = [
  { type: 'risk_discipline_streak', level: 5, description: '5-day streak following risk rules' },
  { type: 'journaling_streak', level: 3, description: '3 consecutive journal entries' },
];

export default function PortfolioPage() {
  const totalOpenPnL = mockPositions.reduce((sum, p) => sum + p.currentPnL, 0);
  const totalRealizedPnL = mockClosedPositions.reduce((sum, p) => sum + p.realizedPnL, 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Portfolio"
        subtitle="Paper trading positions, journal, and discipline tracking"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold">{mockPositions.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open P/L</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    totalOpenPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {totalOpenPnL >= 0 ? '+' : ''}{formatCurrency(totalOpenPnL)}
                  </p>
                </div>
                {totalOpenPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-400 opacity-50" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Realized P/L</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    totalRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                  <p className="text-2xl font-bold">{mockBadges.length}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList>
            <TabsTrigger value="positions">Open Positions</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="badges">Discipline</TabsTrigger>
          </TabsList>

          {/* Open Positions */}
          <TabsContent value="positions">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {mockPositions.map((position) => (
                    <div
                      key={position.id}
                      className="glass-panel p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{position.symbol}</span>
                          <Badge
                            variant="outline"
                            className={getStrategyClass(position.strategyType)}
                          >
                            {getStrategyLabel(position.strategyType)}
                          </Badge>
                          <Badge variant="outline" className="text-green-400 border-green-500/50">
                            Open
                          </Badge>
                        </div>
                        <div className={cn(
                          'text-xl font-bold',
                          position.currentPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {position.currentPnL >= 0 ? '+' : ''}{formatCurrency(position.currentPnL)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Strike: </span>
                          <span>${position.strike}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exp: </span>
                          <span>{position.expiration}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entry: </span>
                          <span className="text-green-400">{formatCurrency(position.entryCredit)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span>{formatCurrency(position.currentValue)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {position.dte} days to expiration
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {mockClosedPositions.map((position) => (
                    <div
                      key={position.id}
                      className="glass-panel p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{position.symbol}</span>
                          <Badge
                            variant="outline"
                            className={getStrategyClass(position.strategyType)}
                          >
                            {getStrategyLabel(position.strategyType)}
                          </Badge>
                          <Badge
                            variant={position.result === 'profit' ? 'success' : 'danger'}
                          >
                            {position.result === 'profit' ? 'Profit' : 'Loss'}
                          </Badge>
                        </div>
                        <div className={cn(
                          'text-xl font-bold',
                          position.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {position.realizedPnL >= 0 ? '+' : ''}{formatCurrency(position.realizedPnL)}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Opened: </span>
                          <span>{position.openedAt}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Closed: </span>
                          <span>{position.closedAt}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entry: </span>
                          <span className="text-green-400">{formatCurrency(position.entryCredit)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exit: </span>
                          <span className="text-red-400">{formatCurrency(position.exitDebit)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journal */}
          <TabsContent value="journal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Trading Journal
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockJournalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="glass-panel p-4 rounded-lg cursor-pointer card-hover"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{entry.title}</span>
                        <Badge variant="outline" className="capitalize">
                          {entry.mood}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {entry.preview}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {entry.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discipline Badges */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  Discipline Badges
                </CardTitle>
                <CardDescription>
                  Track your trading discipline and consistency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBadges.map((badge, i) => (
                    <div
                      key={i}
                      className="glass-panel p-4 rounded-lg border-yellow-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Award className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {badge.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Level {badge.level}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        {badge.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
