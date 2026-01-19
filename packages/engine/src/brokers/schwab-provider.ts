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
 * SchwabBrokerProvider - Charles Schwab API Integration
 *
 * SCAFFOLD IMPLEMENTATION
 *
 * This is a scaffold for integrating with Charles Schwab's API.
 * Full implementation requires:
 * 1. OAuth 2.0 authentication flow
 * 2. Schwab API developer account and credentials
 * 3. Proper error handling for API responses
 * 4. Rate limiting and retry logic
 *
 * Schwab API Documentation:
 * https://developer.schwab.com/
 *
 * IMPORTANT: This scaffold does NOT execute real trades.
 * All methods throw errors indicating they are not implemented.
 */

export interface SchwabTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SchwabConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountId?: string;
  // Callback when tokens are refreshed - use to persist new tokens
  onTokenRefresh?: (tokens: SchwabTokens) => void;
}

export class SchwabBrokerProvider implements BrokerProvider {
  readonly name = 'schwab';
  readonly isPaper = false;

  private config: SchwabConfig;
  private tokens: SchwabTokens | null = null;
  private connected = false;

  // Schwab API base URL
  private readonly API_BASE = 'https://api.schwabapi.com/trader/v1';
  private readonly AUTH_BASE = 'https://api.schwabapi.com/v1/oauth';

  constructor(config: SchwabConfig) {
    this.config = config;
  }

  get isConnected(): boolean {
    return this.connected && this.tokens !== null;
  }

  /**
   * Initiate OAuth flow with Schwab
   * Returns the authorization URL to redirect the user to
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'PlaceTrades AccountAccess MoveMoney',
    });

    return `${this.AUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * Call this after user is redirected back from Schwab
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    // SCAFFOLD: In real implementation, this would:
    // 1. POST to Schwab's token endpoint
    // 2. Include code, client_id, client_secret, redirect_uri
    // 3. Store the returned access_token and refresh_token

    throw new Error(
      'SchwabBrokerProvider.exchangeCodeForTokens is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async connect(): Promise<void> {
    // SCAFFOLD: In real implementation, this would:
    // 1. Check if we have valid tokens
    // 2. Refresh tokens if expired
    // 3. Verify connection by calling a simple API endpoint

    if (!this.tokens) {
      throw new Error(
        'No tokens available. Please complete OAuth flow first by calling ' +
          'getAuthorizationUrl() and exchangeCodeForTokens().'
      );
    }

    // Check token expiration
    if (Date.now() >= this.tokens.expiresAt) {
      await this.refreshTokens();
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    // Note: Tokens are kept for potential reconnection
  }

  async getAccountInfo(): Promise<AccountInfo> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // GET /accounts/{accountId}
    // Parse response to extract buying power, cash balance, etc.

    throw new Error(
      'SchwabBrokerProvider.getAccountInfo is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async getPositions(): Promise<BrokerPosition[]> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // GET /accounts/{accountId}/positions
    // Map Schwab position format to our BrokerPosition type

    throw new Error(
      'SchwabBrokerProvider.getPositions is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async submitOrder(request: OrderRequest): Promise<OrderResponse> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // 1. Validate the order
    // 2. Transform to Schwab's order format
    // 3. POST /accounts/{accountId}/orders
    // 4. Handle response and map to our Order type

    // If dry run, just validate
    if (request.dryRun) {
      return this.validateOrder(request);
    }

    throw new Error(
      'SchwabBrokerProvider.submitOrder is not implemented. ' +
        'This is a scaffold for the Schwab API integration. ' +
        'REAL MONEY OPERATIONS ARE NOT AVAILABLE.'
    );
  }

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // DELETE /accounts/{accountId}/orders/{orderId}

    throw new Error(
      'SchwabBrokerProvider.cancelOrder is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async getOrder(orderId: string): Promise<Order | null> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // GET /accounts/{accountId}/orders/{orderId}

    throw new Error(
      'SchwabBrokerProvider.getOrder is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async getOpenOrders(): Promise<Order[]> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // GET /accounts/{accountId}/orders?status=WORKING

    throw new Error(
      'SchwabBrokerProvider.getOpenOrders is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async getOrderHistory(limit = 50): Promise<Order[]> {
    this.ensureConnected();

    // SCAFFOLD: In real implementation, this would:
    // GET /accounts/{accountId}/orders with date range parameters

    throw new Error(
      'SchwabBrokerProvider.getOrderHistory is not implemented. ' +
        'This is a scaffold for the Schwab API integration.'
    );
  }

  async validateOrder(request: OrderRequest): Promise<OrderResponse> {
    // Basic client-side validation
    const errors: string[] = [];

    if (!request.legs || request.legs.length === 0) {
      errors.push('Order must have at least one leg');
    }

    for (const leg of request.legs) {
      if (leg.quantity <= 0) {
        errors.push(`Invalid quantity for ${leg.symbol}: ${leg.quantity}`);
      }

      // Schwab-specific: option symbols must follow OCC format
      if (leg.optionSymbol && !this.isValidOccSymbol(leg.optionSymbol)) {
        errors.push(`Invalid OCC option symbol: ${leg.optionSymbol}`);
      }
    }

    if (request.orderType === 'limit' && !request.limitPrice) {
      errors.push('Limit orders require a limit price');
    }

    if (request.orderType === 'limit' && request.limitPrice) {
      // Schwab requires minimum price increments
      if (request.limitPrice < 3 && !this.isValidNickelIncrement(request.limitPrice)) {
        errors.push('Options under $3 must be in $0.05 increments');
      }
      if (request.limitPrice >= 3 && !this.isValidDimeIncrement(request.limitPrice)) {
        errors.push('Options $3 and above must be in $0.10 increments');
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

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Schwab broker not connected. Call connect() first.');
    }
  }

  private async refreshTokens(): Promise<void> {
    // SCAFFOLD: In real implementation, this would:
    // POST to Schwab's token endpoint with refresh_token
    // Update stored tokens

    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available. Re-authentication required.');
    }

    const tokenEndpoint = 'https://api.schwabapi.com/v1/oauth/token';

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Update stored tokens
      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.tokens.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      // Call the callback if provided
      if (this.config.onTokenRefresh) {
        this.config.onTokenRefresh(this.tokens);
      }
    } catch (error) {
      // If refresh fails, disconnect and require re-auth
      this.connected = false;
      this.tokens = null;
      throw new Error(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          'Please reconnect to Schwab.'
      );
    }
  }

  private isValidOccSymbol(symbol: string): boolean {
    // OCC format: SYMBOL  YYMMDDCPXXXXXXXX
    // e.g., AAPL  240216C00235000 for AAPL Feb 16 2024 $235 Call
    const occRegex = /^[A-Z]{1,6}\s{0,6}\d{6}[CP]\d{8}$/;
    return occRegex.test(symbol);
  }

  private isValidNickelIncrement(price: number): boolean {
    return Math.round(price * 100) % 5 === 0;
  }

  private isValidDimeIncrement(price: number): boolean {
    return Math.round(price * 100) % 10 === 0;
  }

  /**
   * Transform our order format to Schwab's API format
   * SCAFFOLD - shows the expected structure
   */
  private transformToSchwabOrder(request: OrderRequest): object {
    // Schwab uses a different order structure
    // This is a scaffold showing the expected format

    const schwabOrder = {
      orderType: this.mapOrderType(request.orderType),
      session: 'NORMAL',
      duration: this.mapDuration(request.duration),
      orderStrategyType: request.legs.length > 1 ? 'TRIGGER' : 'SINGLE',
      price: request.limitPrice,
      orderLegCollection: request.legs.map((leg) => ({
        instruction: `${leg.side.toUpperCase()}_TO_${leg.action.toUpperCase()}`,
        quantity: leg.quantity,
        instrument: {
          symbol: leg.optionSymbol || leg.symbol,
          assetType: leg.optionSymbol ? 'OPTION' : 'EQUITY',
        },
      })),
    };

    return schwabOrder;
  }

  private mapOrderType(type: string): string {
    const mapping: Record<string, string> = {
      market: 'MARKET',
      limit: 'LIMIT',
      stop: 'STOP',
      stop_limit: 'STOP_LIMIT',
    };
    return mapping[type] || 'LIMIT';
  }

  private mapDuration(duration: string): string {
    const mapping: Record<string, string> = {
      day: 'DAY',
      gtc: 'GOOD_TILL_CANCEL',
      ioc: 'IMMEDIATE_OR_CANCEL',
      fok: 'FILL_OR_KILL',
    };
    return mapping[duration] || 'DAY';
  }

  /**
   * Transform Schwab's order response to our Order type
   * SCAFFOLD - shows the expected mapping
   */
  private transformFromSchwabOrder(schwabOrder: any): Order {
    // This would transform Schwab's response format to our Order type
    throw new Error('Not implemented - scaffold only');
  }
}
