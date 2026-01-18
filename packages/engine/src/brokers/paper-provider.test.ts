import { describe, it, expect, beforeEach } from 'vitest';
import { PaperBrokerProvider, PaperProviderConfig } from './paper-provider';
import { OrderRequest } from './types';

describe('PaperBrokerProvider', () => {
  let provider: PaperBrokerProvider;
  const config: PaperProviderConfig = {
    startingBalance: 100000,
    simulateSlippage: false, // Disable for predictable tests
    slippageBps: 0,
  };

  beforeEach(() => {
    provider = new PaperBrokerProvider(config);
  });

  describe('connection', () => {
    it('should not be connected initially', () => {
      expect(provider.isConnected).toBe(false);
    });

    it('should connect successfully', async () => {
      await provider.connect();
      expect(provider.isConnected).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await provider.connect();
      await provider.disconnect();
      expect(provider.isConnected).toBe(false);
    });
  });

  describe('account info', () => {
    beforeEach(async () => {
      await provider.connect();
    });

    it('should return starting balance', async () => {
      const info = await provider.getAccountInfo();

      expect(info.accountId).toBe('PAPER-001');
      expect(info.cashBalance).toBe(config.startingBalance);
      expect(info.buyingPower).toBe(config.startingBalance);
    });

    it('should return empty positions initially', async () => {
      const positions = await provider.getPositions();
      expect(positions).toHaveLength(0);
    });
  });

  describe('order submission', () => {
    beforeEach(async () => {
      await provider.connect();
      // Set a mock price getter for predictable tests
      provider.setMockPriceGetter((symbol) => {
        const prices: Record<string, number> = {
          AAPL: 2.5,
          'AAPL  240216P00230000': 2.5,
          SPY: 3.0,
        };
        return prices[symbol] || 2.0;
      });
    });

    it('should require connection', async () => {
      await provider.disconnect();

      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            optionSymbol: 'AAPL  240216P00230000',
            side: 'sell',
            action: 'open',
            quantity: 1,
            strike: 230,
            expiration: '2024-02-16',
            optionType: 'put',
          },
        ],
        orderType: 'limit',
        limitPrice: 2.5,
        duration: 'day',
      };

      const result = await provider.submitOrder(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not connected');
    });

    it('should validate order legs', async () => {
      const request: OrderRequest = {
        legs: [],
        orderType: 'market',
        duration: 'day',
      };

      const result = await provider.submitOrder(request);
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Order must have at least one leg');
    });

    it('should submit and fill market order', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            optionSymbol: 'AAPL  240216P00230000',
            side: 'sell',
            action: 'open',
            quantity: 1,
            strike: 230,
            expiration: '2024-02-16',
            optionType: 'put',
          },
        ],
        orderType: 'market',
        duration: 'day',
      };

      const result = await provider.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.status).toBe('filled');
      expect(result.order?.isPaper).toBe(true);
    });

    it('should update positions after fill', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            optionSymbol: 'AAPL  240216P00230000',
            side: 'sell',
            action: 'open',
            quantity: 1,
            strike: 230,
            expiration: '2024-02-16',
            optionType: 'put',
          },
        ],
        orderType: 'market',
        duration: 'day',
      };

      await provider.submitOrder(request);
      const positions = await provider.getPositions();

      expect(positions).toHaveLength(1);
      expect(positions[0].symbol).toBe('AAPL');
      expect(positions[0].quantity).toBe(1);
    });

    it('should update cash balance after sell', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            optionSymbol: 'AAPL  240216P00230000',
            side: 'sell',
            action: 'open',
            quantity: 1,
            strike: 230,
            expiration: '2024-02-16',
            optionType: 'put',
          },
        ],
        orderType: 'market',
        duration: 'day',
      };

      await provider.submitOrder(request);
      const info = await provider.getAccountInfo();

      // Should have received credit (minus commission)
      // 1 contract * $2.50 * 100 = $250, minus ~$0.65 commission
      expect(info.cashBalance).toBeGreaterThan(config.startingBalance);
    });

    it('should handle dry run mode', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            side: 'sell',
            action: 'open',
            quantity: 1,
          },
        ],
        orderType: 'market',
        duration: 'day',
        dryRun: true,
      };

      const result = await provider.submitOrder(request);

      expect(result.success).toBe(true);
      expect(result.order?.isDryRun).toBe(true);
      expect(result.order?.status).toBe('cancelled');

      // Should not affect positions
      const positions = await provider.getPositions();
      expect(positions).toHaveLength(0);
    });
  });

  describe('order history', () => {
    beforeEach(async () => {
      await provider.connect();
      provider.setMockPriceGetter(() => 2.5);
    });

    it('should track order history', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            side: 'sell',
            action: 'open',
            quantity: 1,
          },
        ],
        orderType: 'market',
        duration: 'day',
      };

      await provider.submitOrder(request);
      const history = await provider.getOrderHistory();

      expect(history).toHaveLength(1);
      expect(history[0].status).toBe('filled');
    });

    it('should return empty open orders after fill', async () => {
      const request: OrderRequest = {
        legs: [
          {
            symbol: 'AAPL',
            side: 'sell',
            action: 'open',
            quantity: 1,
          },
        ],
        orderType: 'market',
        duration: 'day',
      };

      await provider.submitOrder(request);
      const openOrders = await provider.getOpenOrders();

      expect(openOrders).toHaveLength(0);
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await provider.connect();
      provider.setMockPriceGetter(() => 2.5);
    });

    it('should reset to initial state', async () => {
      // Submit an order
      await provider.submitOrder({
        legs: [{ symbol: 'AAPL', side: 'sell', action: 'open', quantity: 1 }],
        orderType: 'market',
        duration: 'day',
      });

      // Reset
      provider.reset();

      // Check state
      const info = await provider.getAccountInfo();
      const positions = await provider.getPositions();
      const history = await provider.getOrderHistory();

      expect(info.cashBalance).toBe(config.startingBalance);
      expect(positions).toHaveLength(0);
      expect(history).toHaveLength(0);
    });
  });

  describe('P/L calculations', () => {
    beforeEach(async () => {
      await provider.connect();
    });

    it('should calculate total account value', async () => {
      const totalValue = await provider.getTotalAccountValue();
      expect(totalValue).toBe(config.startingBalance);
    });

    it('should calculate total P/L', async () => {
      const pnl = await provider.getTotalPnL();
      expect(pnl).toBe(0); // No trades yet
    });
  });
});
