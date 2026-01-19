'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  Link2,
  Link2Off,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Send,
  FileText,
  RefreshCw,
  Zap,
  Eye,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

// Broker types
type BrokerMode = 'manual' | 'paper' | 'live';
type BrokerConnection = {
  broker: string;
  connected: boolean;
  lastSync: string | null;
  accountId: string | null;
  buyingPower: number | null;
  dayTradesRemaining: number | null;
};

// Mock state
const mockConnection: BrokerConnection = {
  broker: 'schwab',
  connected: false,
  lastSync: null,
  accountId: null,
  buyingPower: null,
  dayTradesRemaining: null,
};

const mockPendingOrders = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'Cash-Secured Put',
    strike: 235,
    expiration: '2026-02-20',
    credit: 2.15,
    status: 'pending_approval',
    createdAt: '2026-01-18T14:30:00Z',
  },
  {
    id: '2',
    symbol: 'SPY',
    type: 'Put Credit Spread',
    strike: 575,
    expiration: '2026-02-13',
    credit: 1.45,
    status: 'pending_approval',
    createdAt: '2026-01-18T14:25:00Z',
  },
];

const mockOrderHistory = [
  {
    id: '3',
    symbol: 'MSFT',
    type: 'Cash-Secured Put',
    strike: 370,
    credit: 1.85,
    status: 'filled',
    filledAt: '2026-01-10T09:35:22Z',
    fillPrice: 1.82,
  },
  {
    id: '4',
    symbol: 'NVDA',
    type: 'Put Credit Spread',
    strike: 480,
    credit: 2.30,
    status: 'cancelled',
    cancelledAt: '2026-01-08T15:00:00Z',
    reason: 'User cancelled',
  },
];

export default function BrokerPage() {
  const [brokerMode, setBrokerMode] = useState<BrokerMode>('paper');
  const [connection, setConnection] = useState<BrokerConnection>(mockConnection);
  const [brokerEnabled, setBrokerEnabled] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [dryRunMode, setDryRunMode] = useState(true);

  const handleConnect = () => {
    // In real implementation, this would initiate OAuth flow
    setConnection({
      ...connection,
      connected: true,
      lastSync: new Date().toISOString(),
      accountId: 'XXXX-1234',
      buyingPower: 25000,
      dayTradesRemaining: 3,
    });
  };

  const handleDisconnect = () => {
    setConnection({
      ...mockConnection,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'filled':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Filled
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Broker Integration"
        subtitle="Connect to your broker for order execution"
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* Safety Warning */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-400 mb-1">
                  Real Money Trading Warning
                </h3>
                <p className="text-sm text-muted-foreground">
                  Live broker integration involves real financial risk. Start with paper trading
                  to understand the system. When connecting a live account, always enable
                  approval gates and dry-run mode initially. This tool is for educational purposes
                  and does not constitute financial advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={cn(
              'cursor-pointer transition-all',
              brokerMode === 'manual' && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => setBrokerMode('manual')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manual</h3>
                  <p className="text-xs text-muted-foreground">Copy order tickets</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                View order tickets and manually enter trades in your broker platform.
                No broker connection required.
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all',
              brokerMode === 'paper' && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => setBrokerMode('paper')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Paper Trading</h3>
                  <p className="text-xs text-muted-foreground">Simulated execution</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Practice with simulated fills. Track performance without risking real money.
                Perfect for learning.
              </p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all',
              brokerMode === 'live' && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => setBrokerMode('live')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Live Trading</h3>
                  <p className="text-xs text-muted-foreground">Real execution</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Execute real trades through connected broker. Use approval gates and
                position limits for safety.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mode-specific content */}
        {brokerMode === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Manual Order Tickets
              </CardTitle>
              <CardDescription>
                Copy these order details to enter manually in your broker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPendingOrders.map((order) => (
                  <div key={order.id} className="glass-panel p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{order.symbol}</span>
                        <Badge variant="outline">{order.type}</Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        Copy Ticket
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Strike: </span>
                        <span>${order.strike}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exp: </span>
                        <span>{order.expiration}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Credit: </span>
                        <span className="text-green-400">${order.credit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Action: </span>
                        <span>Sell to Open</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {brokerMode === 'paper' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-400" />
                Paper Trading Mode
              </CardTitle>
              <CardDescription>
                Simulated order execution for practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-green-400">Paper Mode Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Orders will be simulated. No real money is at risk. Track your
                  paper portfolio in the Portfolio page.
                </p>
              </div>

              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">Pending Orders</TabsTrigger>
                  <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <div className="space-y-4 mt-4">
                    {mockPendingOrders.map((order) => (
                      <div key={order.id} className="glass-panel p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{order.symbol}</span>
                            <Badge variant="outline">{order.type}</Badge>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Cancel
                            </Button>
                            <Button size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Execute (Paper)
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strike: </span>
                            <span>${order.strike}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exp: </span>
                            <span>{order.expiration}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Credit: </span>
                            <span className="text-green-400">${order.credit.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created: </span>
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <div className="space-y-4 mt-4">
                    {mockOrderHistory.map((order) => (
                      <div key={order.id} className="glass-panel p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{order.symbol}</span>
                            <Badge variant="outline">{order.type}</Badge>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strike: </span>
                            <span>${order.strike}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Credit: </span>
                            <span className="text-green-400">${order.credit.toFixed(2)}</span>
                          </div>
                          {order.status === 'filled' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Fill: </span>
                                <span>${order.fillPrice?.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Filled: </span>
                                <span>{formatDateTime(order.filledAt!)}</span>
                              </div>
                            </>
                          )}
                          {order.status === 'cancelled' && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Reason: </span>
                              <span>{order.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {brokerMode === 'live' && (
          <>
            {/* Broker Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {connection.connected ? (
                    <Link2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <Link2Off className="h-5 w-5 text-muted-foreground" />
                  )}
                  Broker Connection
                </CardTitle>
                <CardDescription>
                  Connect your brokerage account for live trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!connection.connected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="glass-panel cursor-pointer card-hover" onClick={handleConnect}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <span className="text-xl font-bold text-blue-400">S</span>
                            </div>
                            <div>
                              <h3 className="font-semibold">Charles Schwab</h3>
                              <p className="text-xs text-muted-foreground">
                                Connect via OAuth
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-panel opacity-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-muted-foreground">
                                More Coming Soon
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                TD Ameritrade, IBKR, etc.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="font-medium text-green-400">Connected to Schwab</p>
                          <p className="text-sm text-muted-foreground">
                            Account: {connection.accountId}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="glass-panel p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Buying Power</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(connection.buyingPower || 0)}
                        </p>
                      </div>
                      <div className="glass-panel p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Day Trades Left</p>
                        <p className="text-xl font-bold">{connection.dayTradesRemaining}</p>
                      </div>
                      <div className="glass-panel p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Last Sync</p>
                        <p className="text-sm font-medium">
                          {connection.lastSync ? formatDateTime(connection.lastSync) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-400" />
                  Safety Controls
                </CardTitle>
                <CardDescription>
                  Configure approval gates and execution safeguards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="broker-enabled" className="text-base">
                      Enable Broker Execution
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all broker operations
                    </p>
                  </div>
                  <Switch
                    id="broker-enabled"
                    checked={brokerEnabled}
                    onCheckedChange={setBrokerEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-approval" className="text-base">
                      Require Manual Approval
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Review and approve each order before execution
                    </p>
                  </div>
                  <Switch
                    id="require-approval"
                    checked={requireApproval}
                    onCheckedChange={setRequireApproval}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dry-run" className="text-base">
                      Dry Run Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Validate orders without submitting to broker
                    </p>
                  </div>
                  <Switch
                    id="dry-run"
                    checked={dryRunMode}
                    onCheckedChange={setDryRunMode}
                  />
                </div>

                {brokerEnabled && !dryRunMode && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span className="font-medium text-red-400">Live Execution Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Orders will be submitted to your broker for real execution.
                      Ensure you understand the risks involved.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Orders */}
            {connection.connected && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Orders</CardTitle>
                  <CardDescription>
                    Orders awaiting approval or execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPendingOrders.map((order) => (
                      <div key={order.id} className="glass-panel p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{order.symbol}</span>
                            <Badge variant="outline">{order.type}</Badge>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={!brokerEnabled}
                              className={cn(
                                dryRunMode && 'bg-yellow-500 hover:bg-yellow-600'
                              )}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {dryRunMode ? 'Dry Run' : 'Execute'}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Strike: </span>
                            <span>${order.strike}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exp: </span>
                            <span>{order.expiration}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Credit: </span>
                            <span className="text-green-400">${order.credit.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created: </span>
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
