import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle, XCircle, Clock, RefreshCw, FlaskConical } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

// Mock run data
const mockRuns = [
  {
    id: '1',
    startedAt: '2026-01-18T13:30:00Z',
    finishedAt: '2026-01-18T13:32:15Z',
    status: 'completed',
    provider: 'polygon',
    symbolsProcessed: 11,
    tradesGenerated: 23,
    notes: null,
  },
  {
    id: '2',
    startedAt: '2026-01-18T08:30:00Z',
    finishedAt: '2026-01-18T08:31:45Z',
    status: 'completed',
    provider: 'polygon',
    symbolsProcessed: 11,
    tradesGenerated: 19,
    notes: null,
  },
  {
    id: '3',
    startedAt: '2026-01-17T13:30:00Z',
    finishedAt: '2026-01-17T13:30:30Z',
    status: 'failed',
    provider: 'polygon',
    symbolsProcessed: 3,
    tradesGenerated: 0,
    notes: 'Provider timeout',
  },
];

export default function RunsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="info" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'Running...';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Recompute Runs"
        subtitle="History of trade generation runs"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Demo Data Banner */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
          <FlaskConical className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Demo Data</p>
            <p className="text-xs text-muted-foreground">Run history shows sample data. Dashboard uses live market data when available.</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">{mockRuns.length}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-400">
                    {mockRuns.filter((r) => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {mockRuns.filter((r) => r.status === 'failed').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Trades</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      mockRuns.filter((r) => r.status === 'completed')
                        .reduce((sum, r) => sum + r.tradesGenerated, 0) /
                      mockRuns.filter((r) => r.status === 'completed').length
                    )}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Run History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Run History</CardTitle>
              <Button size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Now
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRuns.map((run) => (
                <div
                  key={run.id}
                  className={cn(
                    'glass-panel p-4 rounded-lg',
                    run.status === 'failed' && 'border-red-500/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(run.startedAt)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {run.provider}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-medium">
                        {getDuration(run.startedAt, run.finishedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Symbols: </span>
                      <span className="font-medium">{run.symbolsProcessed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trades: </span>
                      <span className="font-medium text-green-400">
                        {run.tradesGenerated}
                      </span>
                    </div>
                  </div>

                  {run.notes && (
                    <div className="mt-3 text-sm text-red-400">
                      Error: {run.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cron Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scheduled Runs</CardTitle>
            <CardDescription>
              Automatic recompute runs configured via Vercel Cron
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>Morning Run</span>
                <span className="text-muted-foreground">8:30 AM CT (Mon-Fri)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>Midday Run</span>
                <span className="text-muted-foreground">12:30 PM CT (Mon-Fri)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
