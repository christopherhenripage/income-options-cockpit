import { z } from 'zod';

// Order types
export const OrderSideSchema = z.enum(['buy', 'sell']);
export const OrderActionSchema = z.enum(['open', 'close']);
export const OrderTypeSchema = z.enum(['market', 'limit', 'stop', 'stop_limit']);
export const OrderDurationSchema = z.enum(['day', 'gtc', 'ioc', 'fok']);

export const OrderStatusSchema = z.enum([
  'pending_approval',
  'pending_submission',
  'submitted',
  'working',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected',
  'expired',
]);

// Order leg for options
export const OrderLegSchema = z.object({
  symbol: z.string(),
  optionSymbol: z.string().optional(),
  side: OrderSideSchema,
  action: OrderActionSchema,
  quantity: z.number().int().positive(),
  strike: z.number().optional(),
  expiration: z.string().optional(),
  optionType: z.enum(['call', 'put']).optional(),
});

// Full order structure
export const OrderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tradePacketId: z.string().optional(),
  legs: z.array(OrderLegSchema),
  orderType: OrderTypeSchema,
  limitPrice: z.number().optional(),
  stopPrice: z.number().optional(),
  duration: OrderDurationSchema,
  status: OrderStatusSchema,

  // Execution details
  filledQuantity: z.number().int().default(0),
  avgFillPrice: z.number().optional(),
  commission: z.number().optional(),

  // Timestamps
  createdAt: z.string(),
  submittedAt: z.string().optional(),
  filledAt: z.string().optional(),
  cancelledAt: z.string().optional(),

  // Broker reference
  brokerOrderId: z.string().optional(),
  brokerName: z.string().optional(),

  // Error info
  rejectReason: z.string().optional(),

  // Paper trading flag
  isPaper: z.boolean().default(false),

  // Dry run flag (order validated but not submitted)
  isDryRun: z.boolean().default(false),
});

// Account information
export const AccountInfoSchema = z.object({
  accountId: z.string(),
  accountType: z.enum(['margin', 'cash', 'ira']),
  buyingPower: z.number(),
  cashBalance: z.number(),
  optionBuyingPower: z.number().optional(),
  dayTradesRemaining: z.number().optional(),
  marginUsed: z.number().optional(),
  marginAvailable: z.number().optional(),
});

// Position from broker
export const BrokerPositionSchema = z.object({
  symbol: z.string(),
  optionSymbol: z.string().optional(),
  quantity: z.number(),
  averageCost: z.number(),
  currentPrice: z.number(),
  marketValue: z.number(),
  unrealizedPnL: z.number(),
  optionType: z.enum(['call', 'put']).optional(),
  strike: z.number().optional(),
  expiration: z.string().optional(),
});

// Order submission request
export const OrderRequestSchema = z.object({
  tradePacketId: z.string().optional(),
  legs: z.array(OrderLegSchema),
  orderType: OrderTypeSchema,
  limitPrice: z.number().optional(),
  stopPrice: z.number().optional(),
  duration: OrderDurationSchema,
  dryRun: z.boolean().default(false),
});

// Order response
export const OrderResponseSchema = z.object({
  success: z.boolean(),
  order: OrderSchema.optional(),
  error: z.string().optional(),
  validationErrors: z.array(z.string()).optional(),
});

// Export types
export type OrderSide = z.infer<typeof OrderSideSchema>;
export type OrderAction = z.infer<typeof OrderActionSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type OrderDuration = z.infer<typeof OrderDurationSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderLeg = z.infer<typeof OrderLegSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type AccountInfo = z.infer<typeof AccountInfoSchema>;
export type BrokerPosition = z.infer<typeof BrokerPositionSchema>;
export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// Broker provider interface
export interface BrokerProvider {
  readonly name: string;
  readonly isConnected: boolean;
  readonly isPaper: boolean;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Account
  getAccountInfo(): Promise<AccountInfo>;
  getPositions(): Promise<BrokerPosition[]>;

  // Orders
  submitOrder(request: OrderRequest): Promise<OrderResponse>;
  cancelOrder(orderId: string): Promise<OrderResponse>;
  getOrder(orderId: string): Promise<Order | null>;
  getOpenOrders(): Promise<Order[]>;
  getOrderHistory(limit?: number): Promise<Order[]>;

  // Validation (check order without submitting)
  validateOrder(request: OrderRequest): Promise<OrderResponse>;
}

// Broker configuration
export const BrokerConfigSchema = z.object({
  mode: z.enum(['manual', 'paper', 'live']),
  brokerName: z.string().optional(),

  // Safety settings
  enabled: z.boolean().default(false),
  requireApproval: z.boolean().default(true),
  dryRunMode: z.boolean().default(true),

  // Limits
  maxOrdersPerDay: z.number().int().positive().optional(),
  maxPositionSize: z.number().positive().optional(),
  maxTotalRisk: z.number().positive().optional(),

  // Credentials (stored securely, not in code)
  credentialsConfigured: z.boolean().default(false),
});

export type BrokerConfig = z.infer<typeof BrokerConfigSchema>;
