'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatPercent,
  getStrategyClass,
  getStrategyLabel,
  getStrategyFullName,
  getScoreColor,
} from '@/lib/utils';

// Mock trades data
const mockTrades = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'cash_secured_put',
    status: 'candidate',
    score: 78,
    netCredit: 215,
    maxLoss: 2285,
    dte: 32,
    strike: 235,
    returnOnRisk: 28.5,
    conviction: { confidence: 72, uncertainty: 18 },
    expiration: '2024-02-16',
  },
  {
    id: '2',
    symbol: 'MSFT',
    strategyType: 'put_credit_spread',
    status: 'candidate',
    score: 72,
    netCredit: 145,
    maxLoss: 355,
    dte: 28,
    strike: 420,
    returnOnRisk: 45.2,
    conviction: { confidence: 68, uncertainty: 22 },
    expiration: '2024-02-09',
  },
  {
    id: '3',
    symbol: 'SPY',
    strategyType: 'cash_secured_put',
    status: 'approved',
    score: 68,
    netCredit: 185,
    maxLoss: 5815,
    dte: 35,
    strike: 575,
    returnOnRisk: 21.8,
    conviction: { confidence: 65, uncertainty: 25 },
    expiration: '2024-02-23',
  },
  {
    id: '4',
    symbol: 'NVDA',
    strategyType: 'call_credit_spread',
    status: 'candidate',
    score: 65,
    netCredit: 120,
    maxLoss: 380,
    dte: 21,
    strike: 150,
    returnOnRisk: 52.3,
    conviction: { confidence: 58, uncertainty: 32 },
    expiration: '2024-02-02',
  },
  {
    id: '5',
    symbol: 'QQQ',
    strategyType: 'cash_secured_put',
    status: 'candidate',
    score: 64,
    netCredit: 175,
    maxLoss: 4925,
    dte: 28,
    strike: 500,
    returnOnRisk: 23.1,
    conviction: { confidence: 60, uncertainty: 28 },
    expiration: '2024-02-09',
  },
  {
    id: '6',
    symbol: 'META',
    strategyType: 'put_credit_spread',
    status: 'candidate',
    score: 62,
    netCredit: 135,
    maxLoss: 365,
    dte: 35,
    strike: 590,
    returnOnRisk: 38.7,
    conviction: { confidence: 55, uncertainty: 30 },
    expiration: '2024-02-23',
  },
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export function TradesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredTrades = mockTrades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStrategy =
      strategyFilter === 'all' || trade.strategyType === strategyFilter;
    const matchesStatus =
      statusFilter === 'all' || trade.status === statusFilter;
    return matchesSearch && matchesStrategy && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'candidate':
        return (
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            Candidate
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Trade Candidates
            <Badge variant="secondary" className="ml-2">
              {filteredTrades.length}
            </Badge>
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbol..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-40"
              />
            </div>

            <Select value={strategyFilter} onValueChange={(v) => handleFilterChange(setStrategyFilter, v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="cash_secured_put">Cash-Secured Put</SelectItem>
                <SelectItem value="covered_call">Covered Call</SelectItem>
                <SelectItem value="put_credit_spread">Put Credit Spread</SelectItem>
                <SelectItem value="call_credit_spread">Call Credit Spread</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Strategy</th>
                <th>Score</th>
                <th>Credit</th>
                <th>Max Loss</th>
                <th>Ann. Return</th>
                <th>DTE</th>
                <th>Confidence</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade) => (
                <tr key={trade.id} className="group">
                  <td>
                    <span className="font-semibold">{trade.symbol}</span>
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getStrategyClass(trade.strategyType))}
                    >
                      {getStrategyLabel(trade.strategyType)}
                    </Badge>
                  </td>
                  <td>
                    <span
                      className={cn(
                        'text-lg font-bold',
                        getScoreColor(trade.score)
                      )}
                    >
                      {trade.score}
                    </span>
                  </td>
                  <td className="text-green-400 font-medium">
                    {formatCurrency(trade.netCredit)}
                  </td>
                  <td className="text-red-400 font-medium">
                    {formatCurrency(trade.maxLoss)}
                  </td>
                  <td className="text-primary font-medium">
                    {formatPercent(trade.returnOnRisk)}
                  </td>
                  <td>{trade.dte}d</td>
                  <td>
                    <div className="w-24">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {trade.conviction.confidence}%
                        </span>
                      </div>
                      <Progress
                        value={trade.conviction.confidence}
                        className="h-1.5"
                      />
                    </div>
                  </td>
                  <td>{getStatusBadge(trade.status)}</td>
                  <td className="text-right">
                    <Link href={`/trades/${trade.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrades.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No trades match your filters
          </div>
        )}

        {/* Pagination Controls */}
        {filteredTrades.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                of {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
