import { v4 as uuidv4 } from 'uuid';
import {
  BrokerProvider,
  AccountInfo,
  BrokerPosition,
  Order,
  OrderRequest,
  OrderResponse,
  OrderLeg,
} from './types';

/**
 * PaperBrokerProvider - Simulated paper trading
 *
 * This provider simulates order execution for practice:
 * 1. Maintains a virtual account with starting balance
 * 2. Simulates fills at current market prices (with optional slippage)
 * 3. Tracks positions and P/L
 * 4. Great for learning without risk
 */
export interface PaperProviderConfig {
  startingBalance: number;
  optionBuyingPowerMultiplier?: number; // e.g., 2x for margin
  simulateSlippage?: boolean;
  slippageBps?: number; // Basis points of slippage
}

interface PaperPosition {
  symbol: string;
  optionSymbol?: string;
  quantity: number;
  averageCost: number;
  optionType?: 'call' | 'put';
  strike?: number;
  expiration?: string;
}

export class PaperBrokerProvider implements BrokerProvider {
  readonly name = 'paper';
  readonly isPaper = true;

  private connected = false;
  private config: PaperProviderConfig;
  private cashBalance: number;
  private positions: Map<string, PaperPosition> = new Map();
  private pendingOrders: Map<string, Order> = new Map();
  private orderHistory: Order[] = [];
  private ordersToday = 0;
  private lastOrderDate: string | null = null;

  // Mock price function (in real implementation, would use market data provider)
  private mockPriceGetter?: (symbol: string) => number;

  constructor(config: PaperProviderConfig) {
    this.config = {
      optionBuyingPowerMultiplier: 1,
      simulateSlippage: true,
      slippageBps: 5, // 0.05% default slippage
      ...config,
    };
    this.cashBalance = config.startingBalance;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  setMockPriceGetter(getter: (symbol: string) => number): void {
    this.mockPriceGetter = getter;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const positionValue = Array.from(this.positions.values()).reduce(
      (sum, pos) => {
        const price = this.getPrice(pos.optionSymbol || pos.symbol);
        return sum + pos.quantity * price * 100; // Options are per 100 shares
      },
      0
    );

    const buyingPower = this.cashBalance;
    const optionBuyingPower =
      buyingPower * (this.config.optionBuyingPowerMultiplier || 1);

    return {
      accountId: 'PAPER-001',
      accountType: 'cash',
      buyingPower,
      cashBalance: this.cashBalance,
      optionBuyingPower,
      dayTradesRemaining: 3, // Simulated PDT rule
    };
  }

  async getPositions(): Promise<BrokerPosition[]> {
    return Array.from(this.positions.values()).map((pos) => {
      const currentPrice = this.getPrice(pos.optionSymbol || pos.symbol);
      const marketValue = pos.quantity * currentPrice * 100;
      const costBasis = pos.quantity * pos.averageCost * 100;

      return {
        symbol: pos.symbol,
        optionSymbol: pos.optionSymbol,
        quantity: pos.quantity,
        averageCost: pos.averageCost,
        currentPrice,
        marketValue,
        unrealizedPnL: marketValue - costBasis,
        optionType: pos.optionType,
        strike: pos.strike,
        expiration: pos.expiration,
      };
    });
  }

  async submitOrder(request: OrderRequest): Promise<OrderResponse> {
    // Check if connected
    if (!this.connected) {
      return {
        success: false,
        error: 'Paper broker not connected',
      };
    }

    // Validate order
    const validation = await this.validateOrder(request);
    if (!validation.success) {
      return validation;
    }

    // Create order
    const order: Order = {
      id: uuidv4(),
      workspaceId: '',
      tradePacketId: request.tradePacketId,
      legs: request.legs,
      orderType: request.orderType,
      limitPrice: request.limitPrice,
      stopPrice: request.stopPrice,
      duration: request.duration,
      status: 'pending_submission',
      filledQuantity: 0,
      createdAt: new Date().toISOString(),
      isPaper: true,
      isDryRun: request.dryRun,
      brokerName: this.name,
    };

    if (request.dryRun) {
      // Dry run - just validate, don't execute
      order.status = 'cancelled';
      order.rejectReason = 'Dry run - order not submitted';
      return {
        success: true,
        order,
      };
    }

    // Simulate execution
    const fillResult = this.simulateFill(order);
    if (!fillResult.success) {
      order.status = 'rejected';
      order.rejectReason = fillResult.error;
      this.orderHistory.unshift(order);
      return fillResult;
    }

    // Update order with fill info
    order.status = 'filled';
    order.filledQuantity = order.legs.reduce((sum, leg) => sum + leg.quantity, 0);
    order.avgFillPrice = fillResult.fillPrice;
    order.submittedAt = new Date().toISOString();
    order.filledAt = new Date().toISOString();
    order.commission = this.calculateCommission(order);
    order.brokerOrderId = `PAPER-${Date.now()}`;

    // Update positions
    this.updatePositions(order, fillResult.fillPrice!);

    // Update cash balance
    this.updateCashBalance(order, fillResult.fillPrice!);

    // Track order
    this.orderHistory.unshift(order);
    this.trackDailyOrders();

    return {
      success: true,
      order,
    };
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    const order = this.pendingOrders.get(orderId);

    if (!order) {
      return {
        success: false,
        error: `Order ${orderId} not found or already filled`,
      };
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();

    this.pendingOrders.delete(orderId);
    this.orderHistory.unshift(order);

    return {
      success: true,
      order,
    };
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const pending = this.pendingOrders.get(orderId);
    if (pending) return pending;

    return this.orderHistory.find((o) => o.id === orderId) || null;
  }

  async getOpenOrders(): Promise<Order[]> {
    return Array.from(this.pendingOrders.values());
  }

  async getOrderHistory(limit = 50): Promise<Order[]> {
    return this.orderHistory.slice(0, limit);
  }

  async validateOrder(request: OrderRequest): Promise<OrderResponse> {
    const errors: string[] = [];

    // Basic validation
    if (!request.legs || request.legs.length === 0) {
      errors.push('Order must have at least one leg');
    }

    for (const leg of request.legs) {
      if (leg.quantity <= 0) {
        errors.push(`Invalid quantity for ${leg.symbol}: ${leg.quantity}`);
      }
    }

    if (request.orderType === 'limit' && !request.limitPrice) {
      errors.push('Limit orders require a limit price');
    }

    // Check buying power for sells
    const estimatedCost = this.estimateOrderCost(request);
    const accountInfo = await this.getAccountInfo();

    if (estimatedCost > accountInfo.buyingPower) {
      errors.push(
        `Insufficient buying power. Required: $${estimatedCost.toFixed(2)}, ` +
          `Available: $${accountInfo.buyingPower.toFixed(2)}`
      );
    }

    // Check for closing positions we don't have
    for (const leg of request.legs) {
      if (leg.action === 'close') {
        const posKey = leg.optionSymbol || leg.symbol;
        const position = this.positions.get(posKey);

        if (!position || position.quantity < leg.quantity) {
          errors.push(
            `Cannot close position for ${leg.symbol}: ` +
              `requested ${leg.quantity}, have ${position?.quantity || 0}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Order validation failed',
        validationErrors: errors,
      };
    }

    return { success: true };
  }

  // Private methods

  private getPrice(symbol: string): number {
    if (this.mockPriceGetter) {
      return this.mockPriceGetter(symbol);
    }
    // Default mock price based on symbol
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return 1 + (hash % 500) / 100; // Returns 1.00 to 6.00
  }

  private simulateFill(order: Order): { success: boolean; fillPrice?: number; error?: string } {
    // Get the market price
    const leg = order.legs[0];
    const marketPrice = this.getPrice(leg.optionSymbol || leg.symbol);

    let fillPrice = marketPrice;

    // Apply slippage for market orders
    if (order.orderType === 'market' && this.config.simulateSlippage) {
      const slippageFactor = 1 + (this.config.slippageBps || 0) / 10000;
      // Slippage is unfavorable: higher for buys, lower for sells
      if (leg.side === 'buy') {
        fillPrice *= slippageFactor;
      } else {
        fillPrice /= slippageFactor;
      }
    }

    // For limit orders, check if price is acceptable
    if (order.orderType === 'limit' && order.limitPrice) {
      if (leg.side === 'buy' && marketPrice > order.limitPrice) {
        // Can't fill buy at limit below market
        return {
          success: false,
          error: `Market price $${marketPrice.toFixed(2)} above limit $${order.limitPrice.toFixed(2)}`,
        };
      }
      if (leg.side === 'sell' && marketPrice < order.limitPrice) {
        // Can't fill sell at limit above market
        return {
          success: false,
          error: `Market price $${marketPrice.toFixed(2)} below limit $${order.limitPrice.toFixed(2)}`,
        };
      }
      fillPrice = order.limitPrice;
    }

    return {
      success: true,
      fillPrice: Math.round(fillPrice * 100) / 100,
    };
  }

  private updatePositions(order: Order, fillPrice: number): void {
    for (const leg of order.legs) {
      const posKey = leg.optionSymbol || leg.symbol;
      const existing = this.positions.get(posKey);

      if (leg.action === 'open') {
        // Opening new position or adding to existing
        if (existing) {
          // Average in
          const totalQuantity = existing.quantity + leg.quantity;
          const totalCost =
            existing.quantity * existing.averageCost + leg.quantity * fillPrice;
          existing.quantity = totalQuantity;
          existing.averageCost = totalCost / totalQuantity;
        } else {
          // New position
          this.positions.set(posKey, {
            symbol: leg.symbol,
            optionSymbol: leg.optionSymbol,
            quantity: leg.quantity,
            averageCost: fillPrice,
            optionType: leg.optionType,
            strike: leg.strike,
            expiration: leg.expiration,
          });
        }
      } else {
        // Closing position
        if (existing) {
          existing.quantity -= leg.quantity;
          if (existing.quantity <= 0) {
            this.positions.delete(posKey);
          }
        }
      }
    }
  }

  private updateCashBalance(order: Order, fillPrice: number): void {
    for (const leg of order.legs) {
      const value = leg.quantity * fillPrice * 100; // Options are per 100 shares

      if (leg.side === 'sell') {
        // Selling = receiving credit
        this.cashBalance += value;
      } else {
        // Buying = paying debit
        this.cashBalance -= value;
      }
    }

    // Deduct commission
    const commission = this.calculateCommission(order);
    this.cashBalance -= commission;
  }

  private calculateCommission(order: Order): number {
    // Simulate typical options commission: $0.65 per contract
    const contracts = order.legs.reduce((sum, leg) => sum + leg.quantity, 0);
    return contracts * 0.65;
  }

  private estimateOrderCost(request: OrderRequest): number {
    let cost = 0;

    for (const leg of request.legs) {
      const price =
        request.limitPrice || this.getPrice(leg.optionSymbol || leg.symbol);

      if (leg.side === 'buy' && leg.action === 'open') {
        cost += leg.quantity * price * 100;
      }
      // For cash-secured puts, need to reserve strike price * 100
      if (
        leg.side === 'sell' &&
        leg.action === 'open' &&
        leg.optionType === 'put' &&
        leg.strike
      ) {
        cost += leg.quantity * leg.strike * 100;
      }
    }

    return cost;
  }

  private trackDailyOrders(): void {
    const today = new Date().toISOString().split('T')[0];

    if (this.lastOrderDate !== today) {
      this.lastOrderDate = today;
      this.ordersToday = 0;
    }

    this.ordersToday++;
  }

  // Utility methods for paper trading

  /**
   * Reset the paper account to starting state
   */
  reset(): void {
    this.cashBalance = this.config.startingBalance;
    this.positions.clear();
    this.pendingOrders.clear();
    this.orderHistory = [];
    this.ordersToday = 0;
  }

  /**
   * Get total account value (cash + positions)
   */
  async getTotalAccountValue(): Promise<number> {
    const positions = await this.getPositions();
    const positionValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    return this.cashBalance + positionValue;
  }

  /**
   * Get total P/L since inception
   */
  async getTotalPnL(): Promise<number> {
    const totalValue = await this.getTotalAccountValue();
    return totalValue - this.config.startingBalance;
  }
}
