import { v4 as uuidv4 } from 'uuid';
import {
  BrokerProvider,
  AccountInfo,
  BrokerPosition,
  Order,
  OrderRequest,
  OrderResponse,
} from './types';

/**
 * ManualBrokerProvider - Generates order tickets for manual entry
 *
 * This provider doesn't actually execute orders. Instead, it:
 * 1. Creates order tickets that users can copy to their broker
 * 2. Validates order structure
 * 3. Tracks orders locally (in pending_approval status)
 *
 * Users manually enter the trade in their broker platform and then
 * mark the order as filled/cancelled in the app.
 */
export class ManualBrokerProvider implements BrokerProvider {
  readonly name = 'manual';
  readonly isConnected = true; // Always "connected" since no real connection needed
  readonly isPaper = false;

  private pendingOrders: Map<string, Order> = new Map();
  private orderHistory: Order[] = [];

  async connect(): Promise<void> {
    // No-op for manual mode
  }

  async disconnect(): Promise<void> {
    // No-op for manual mode
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // Manual mode doesn't have real account info
    // Return placeholder values
    return {
      accountId: 'MANUAL',
      accountType: 'cash',
      buyingPower: 0,
      cashBalance: 0,
      optionBuyingPower: 0,
      dayTradesRemaining: undefined,
    };
  }

  async getPositions(): Promise<BrokerPosition[]> {
    // Manual mode doesn't track positions automatically
    return [];
  }

  async submitOrder(request: OrderRequest): Promise<OrderResponse> {
    // Validate first
    const validation = await this.validateOrder(request);
    if (!validation.success) {
      return validation;
    }

    // Create order in pending_approval status
    const order: Order = {
      id: uuidv4(),
      workspaceId: '', // Will be set by caller
      tradePacketId: request.tradePacketId,
      legs: request.legs,
      orderType: request.orderType,
      limitPrice: request.limitPrice,
      stopPrice: request.stopPrice,
      duration: request.duration,
      status: 'pending_approval',
      filledQuantity: 0,
      createdAt: new Date().toISOString(),
      isPaper: false,
      isDryRun: request.dryRun,
      brokerName: this.name,
    };

    this.pendingOrders.set(order.id, order);

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
        error: `Order ${orderId} not found`,
      };
    }

    // Update status
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();

    // Move to history
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

    const historical = this.orderHistory.find((o) => o.id === orderId);
    return historical || null;
  }

  async getOpenOrders(): Promise<Order[]> {
    return Array.from(this.pendingOrders.values());
  }

  async getOrderHistory(limit = 50): Promise<Order[]> {
    return this.orderHistory.slice(0, limit);
  }

  async validateOrder(request: OrderRequest): Promise<OrderResponse> {
    const errors: string[] = [];

    // Check legs
    if (!request.legs || request.legs.length === 0) {
      errors.push('Order must have at least one leg');
    }

    // Check quantity
    for (const leg of request.legs) {
      if (leg.quantity <= 0) {
        errors.push(`Invalid quantity for ${leg.symbol}: ${leg.quantity}`);
      }
    }

    // Check limit price for limit orders
    if (request.orderType === 'limit' && !request.limitPrice) {
      errors.push('Limit orders require a limit price');
    }

    // Check stop price for stop orders
    if (
      (request.orderType === 'stop' || request.orderType === 'stop_limit') &&
      !request.stopPrice
    ) {
      errors.push('Stop orders require a stop price');
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Order validation failed',
        validationErrors: errors,
      };
    }

    return {
      success: true,
    };
  }

  // Manual-specific methods

  /**
   * Generate a formatted order ticket for manual entry
   */
  generateOrderTicket(order: Order): string {
    const lines: string[] = [
      '═══════════════════════════════════════',
      '          ORDER TICKET',
      '═══════════════════════════════════════',
      '',
    ];

    for (const leg of order.legs) {
      lines.push(`Symbol: ${leg.optionSymbol || leg.symbol}`);
      lines.push(`Action: ${leg.side.toUpperCase()} TO ${leg.action.toUpperCase()}`);
      lines.push(`Quantity: ${leg.quantity}`);

      if (leg.strike) {
        lines.push(`Strike: $${leg.strike}`);
      }
      if (leg.expiration) {
        lines.push(`Expiration: ${leg.expiration}`);
      }
      if (leg.optionType) {
        lines.push(`Type: ${leg.optionType.toUpperCase()}`);
      }
      lines.push('');
    }

    lines.push(`Order Type: ${order.orderType.toUpperCase()}`);
    if (order.limitPrice) {
      lines.push(`Limit Price: $${order.limitPrice.toFixed(2)}`);
    }
    lines.push(`Duration: ${order.duration.toUpperCase()}`);
    lines.push('');
    lines.push('═══════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Mark an order as filled (user confirms they executed it)
   */
  async markAsFilled(
    orderId: string,
    fillPrice: number,
    commission?: number
  ): Promise<OrderResponse> {
    const order = this.pendingOrders.get(orderId);

    if (!order) {
      return {
        success: false,
        error: `Order ${orderId} not found`,
      };
    }

    // Update order
    order.status = 'filled';
    order.filledQuantity = order.legs.reduce((sum, leg) => sum + leg.quantity, 0);
    order.avgFillPrice = fillPrice;
    order.commission = commission;
    order.filledAt = new Date().toISOString();

    // Move to history
    this.pendingOrders.delete(orderId);
    this.orderHistory.unshift(order);

    return {
      success: true,
      order,
    };
  }
}
