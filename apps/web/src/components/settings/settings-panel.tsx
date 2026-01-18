'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Settings,
  History,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

// Mock current settings
const mockSettings = {
  preset: 'balanced',
  version: 12,
  accountSize: 50000,
  riskLimits: {
    maxRiskPerTradePct: 3,
    maxTotalRiskPct: 15,
    dailyLossLimitPct: 5,
    dailyLossLimitUsd: 2500,
    maxNewOrdersPerDay: 5,
  },
  liquidityFilters: {
    minUnderlyingVolume: 500000,
    minOptionOI: 300,
    minOptionVolume: 50,
    maxBidAskSpreadPct: 8,
  },
  earningsExclusionDays: 10,
  killSwitches: {
    tradingEnabled: false,
    brokerExecutionEnabled: false,
    paperModeEnabled: true,
  },
  strategies: {
    cashSecuredPut: { enabled: true, minDTE: 21, maxDTE: 45, targetDeltaMin: 0.20, targetDeltaMax: 0.30 },
    coveredCall: { enabled: true, minDTE: 14, maxDTE: 45, targetDeltaMin: 0.20, targetDeltaMax: 0.30 },
    putCreditSpread: { enabled: true, minDTE: 21, maxDTE: 45, targetDeltaMin: 0.20, targetDeltaMax: 0.30, spreadWidth: 5 },
    callCreditSpread: { enabled: true, minDTE: 21, maxDTE: 45, targetDeltaMin: 0.20, targetDeltaMax: 0.30, spreadWidth: 5 },
  },
};

const mockSymbols = [
  { symbol: 'SPY', enabled: true, tags: ['ETF', 'Core'] },
  { symbol: 'QQQ', enabled: true, tags: ['ETF', 'Core'] },
  { symbol: 'AAPL', enabled: true, tags: ['Tech'] },
  { symbol: 'MSFT', enabled: true, tags: ['Tech'] },
  { symbol: 'NVDA', enabled: true, tags: ['Tech', 'AI'] },
  { symbol: 'TSLA', enabled: false, tags: ['Auto', 'Volatile'] },
];

const mockVersionHistory = [
  { version: 12, preset: 'balanced', date: '2024-01-15 10:30', changes: 'Increased DTE range' },
  { version: 11, preset: 'balanced', date: '2024-01-14 14:22', changes: 'Added NVDA to universe' },
  { version: 10, preset: 'conservative', date: '2024-01-12 09:15', changes: 'Switched to conservative preset' },
];

export function SettingsPanel() {
  const [preset, setPreset] = useState(mockSettings.preset);
  const [accountSize, setAccountSize] = useState(mockSettings.accountSize);
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-6">
      {/* Risk Profile Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risk Profile
          </CardTitle>
          <CardDescription>
            Select a preset or customize your risk parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Conservative */}
            <button
              onClick={() => { setPreset('conservative'); setHasChanges(true); }}
              className={cn(
                'glass-panel p-4 rounded-lg text-left transition-all',
                preset === 'conservative'
                  ? 'border-2 border-green-500 bg-green-500/10'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-green-400">Conservative</span>
                {preset === 'conservative' && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Lower risk, smaller positions, stricter filters
              </p>
              <div className="text-xs space-y-1">
                <div>Max per trade: 2%</div>
                <div>Max total: 10%</div>
                <div>Daily loss limit: 3%</div>
              </div>
            </button>

            {/* Balanced */}
            <button
              onClick={() => { setPreset('balanced'); setHasChanges(true); }}
              className={cn(
                'glass-panel p-4 rounded-lg text-left transition-all',
                preset === 'balanced'
                  ? 'border-2 border-blue-500 bg-blue-500/10'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-400">Balanced</span>
                {preset === 'balanced' && (
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Moderate risk, standard parameters
              </p>
              <div className="text-xs space-y-1">
                <div>Max per trade: 3%</div>
                <div>Max total: 15%</div>
                <div>Daily loss limit: 5%</div>
              </div>
            </button>

            {/* Aggressive */}
            <button
              onClick={() => { setPreset('aggressive'); setHasChanges(true); }}
              className={cn(
                'glass-panel p-4 rounded-lg text-left transition-all',
                preset === 'aggressive'
                  ? 'border-2 border-orange-500 bg-orange-500/10'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-orange-400">Aggressive</span>
                {preset === 'aggressive' && (
                  <CheckCircle className="h-5 w-5 text-orange-400" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Higher risk, larger positions, relaxed filters
              </p>
              <div className="text-xs space-y-1">
                <div>Max per trade: 5%</div>
                <div>Max total: 25%</div>
                <div>Daily loss limit: 8%</div>
              </div>
            </button>
          </div>

          {/* Account Size */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="accountSize">Account Size (for calculations)</Label>
              <p className="text-xs text-muted-foreground">
                Used to convert percentage limits to dollar amounts
              </p>
            </div>
            <Input
              id="accountSize"
              type="number"
              value={accountSize}
              onChange={(e) => { setAccountSize(Number(e.target.value)); setHasChanges(true); }}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed settings */}
      <Tabs defaultValue="safety" className="w-full">
        <TabsList>
          <TabsTrigger value="safety">Safety Controls</TabsTrigger>
          <TabsTrigger value="risk">Risk Limits</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="symbols">Symbol Universe</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        {/* Safety Controls */}
        <TabsContent value="safety">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Kill Switches & Safety Controls
              </CardTitle>
              <CardDescription>
                Master controls for trading functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  These controls override all other settings. Trading must be explicitly enabled,
                  and broker execution requires an additional toggle.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-base">Trading Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all trading activity (paper and live)
                    </p>
                  </div>
                  <Switch
                    checked={mockSettings.killSwitches.tradingEnabled}
                    onCheckedChange={() => setHasChanges(true)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-base">Broker Execution Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow real broker order submission (requires Trading Enabled)
                    </p>
                  </div>
                  <Switch
                    checked={mockSettings.killSwitches.brokerExecutionEnabled}
                    onCheckedChange={() => setHasChanges(true)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div>
                    <Label className="text-base text-green-400">Paper Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Simulate fills without real orders (recommended for testing)
                    </p>
                  </div>
                  <Switch
                    checked={mockSettings.killSwitches.paperModeEnabled}
                    onCheckedChange={() => setHasChanges(true)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Limits */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Limits</CardTitle>
              <CardDescription>
                Configure maximum risk exposure per trade and portfolio-wide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Max Risk Per Trade (%)</Label>
                    <Input
                      type="number"
                      value={mockSettings.riskLimits.maxRiskPerTradePct}
                      onChange={() => setHasChanges(true)}
                      max={5}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hard cap: 5% (≈ {formatCurrency(accountSize * 0.05)})
                    </p>
                  </div>

                  <div>
                    <Label>Max Total Risk (%)</Label>
                    <Input
                      type="number"
                      value={mockSettings.riskLimits.maxTotalRiskPct}
                      onChange={() => setHasChanges(true)}
                      max={25}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hard cap: 25% (≈ {formatCurrency(accountSize * 0.25)})
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Daily Loss Limit (%)</Label>
                    <Input
                      type="number"
                      value={mockSettings.riskLimits.dailyLossLimitPct}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ {formatCurrency(accountSize * mockSettings.riskLimits.dailyLossLimitPct / 100)}
                    </p>
                  </div>

                  <div>
                    <Label>Max Orders Per Day</Label>
                    <Input
                      type="number"
                      value={mockSettings.riskLimits.maxNewOrdersPerDay}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-4">Liquidity Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Min Underlying Volume</Label>
                    <Input
                      type="number"
                      value={mockSettings.liquidityFilters.minUnderlyingVolume}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Min Option OI</Label>
                    <Input
                      type="number"
                      value={mockSettings.liquidityFilters.minOptionOI}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max Bid-Ask Spread (%)</Label>
                    <Input
                      type="number"
                      value={mockSettings.liquidityFilters.maxBidAskSpreadPct}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Earnings Exclusion (days)</Label>
                    <Input
                      type="number"
                      value={mockSettings.earningsExclusionDays}
                      onChange={() => setHasChanges(true)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies */}
        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Settings</CardTitle>
              <CardDescription>
                Configure parameters for each strategy type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(mockSettings.strategies).map(([key, strategy]) => (
                <div key={key} className="glass-panel p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={() => setHasChanges(true)}
                      />
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <Badge variant={strategy.enabled ? 'default' : 'secondary'}>
                      {strategy.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Min DTE</Label>
                      <Input
                        type="number"
                        value={strategy.minDTE}
                        onChange={() => setHasChanges(true)}
                        className="mt-1"
                        disabled={!strategy.enabled}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max DTE</Label>
                      <Input
                        type="number"
                        value={strategy.maxDTE}
                        onChange={() => setHasChanges(true)}
                        className="mt-1"
                        disabled={!strategy.enabled}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Delta Min</Label>
                      <Input
                        type="number"
                        step="0.05"
                        value={strategy.targetDeltaMin}
                        onChange={() => setHasChanges(true)}
                        className="mt-1"
                        disabled={!strategy.enabled}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Delta Max</Label>
                      <Input
                        type="number"
                        step="0.05"
                        value={strategy.targetDeltaMax}
                        onChange={() => setHasChanges(true)}
                        className="mt-1"
                        disabled={!strategy.enabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symbol Universe */}
        <TabsContent value="symbols">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Symbol Universe</CardTitle>
                  <CardDescription>
                    Manage the symbols scanned for trade opportunities
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Symbol
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockSymbols.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={() => setHasChanges(true)}
                      />
                      <span className="font-medium w-16">{item.symbol}</span>
                      <div className="flex gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                Track changes and rollback to previous settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockVersionHistory.map((version) => (
                  <div
                    key={version.version}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={version.version === mockSettings.version ? 'default' : 'outline'}>
                        v{version.version}
                      </Badge>
                      <div>
                        <span className="font-medium capitalize">{version.preset}</span>
                        <span className="text-muted-foreground"> - {version.changes}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{version.date}</span>
                      {version.version !== mockSettings.version && (
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-64 right-0 p-4 bg-card border-t border-border">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span>You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHasChanges(false)}>
                Discard
              </Button>
              <Button onClick={() => setHasChanges(false)}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
