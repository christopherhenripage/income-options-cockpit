// Broker types
export * from './types';

// Broker providers
export { ManualBrokerProvider } from './manual-provider';
export { PaperBrokerProvider, type PaperProviderConfig } from './paper-provider';
export { SchwabBrokerProvider, type SchwabConfig } from './schwab-provider';

// Factory function to create broker providers
import { BrokerProvider, BrokerConfig } from './types';
import { ManualBrokerProvider } from './manual-provider';
import { PaperBrokerProvider, PaperProviderConfig } from './paper-provider';
import { SchwabBrokerProvider, SchwabConfig } from './schwab-provider';

export interface BrokerFactoryOptions {
  paperConfig?: PaperProviderConfig;
  schwabConfig?: SchwabConfig;
}

/**
 * Create a broker provider based on configuration
 */
export function createBrokerProvider(
  config: BrokerConfig,
  options?: BrokerFactoryOptions
): BrokerProvider {
  switch (config.mode) {
    case 'manual':
      return new ManualBrokerProvider();

    case 'paper':
      if (!options?.paperConfig) {
        // Default paper config
        return new PaperBrokerProvider({
          startingBalance: 100000, // $100k default
          simulateSlippage: true,
          slippageBps: 5,
        });
      }
      return new PaperBrokerProvider(options.paperConfig);

    case 'live':
      if (!options?.schwabConfig) {
        throw new Error(
          'Live trading requires Schwab configuration. ' +
            'Provide schwabConfig in options.'
        );
      }
      return new SchwabBrokerProvider(options.schwabConfig);

    default:
      throw new Error(`Unknown broker mode: ${config.mode}`);
  }
}

/**
 * Broker execution manager
 *
 * Wraps broker provider with safety checks:
 * - Kill switch verification
 * - Approval gates
 * - Dry run mode
 * - Risk limits
 */
export class BrokerExecutionManager {
  private provider: BrokerProvider;
  private config: BrokerConfig;
  private ordersToday = 0;
  private lastOrderDate: string | null = null;

  constructor(provider: BrokerProvider, config: BrokerConfig) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Check if execution is allowed
   */
  canExecute(): { allowed: boolean; reason?: string } {
    // Check master kill switch
    if (!this.config.enabled) {
      return {
        allowed: false,
        reason: 'Broker execution is disabled (kill switch)',
      };
    }

    // Check daily order limit
    if (this.config.maxOrdersPerDay) {
      this.updateDailyOrderCount();
      if (this.ordersToday >= this.config.maxOrdersPerDay) {
        return {
          allowed: false,
          reason: `Daily order limit reached (${this.config.maxOrdersPerDay})`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Submit order with safety checks
   */
  async submitOrderWithChecks(
    request: import('./types').OrderRequest,
    skipApproval = false
  ): Promise<import('./types').OrderResponse> {
    // Check if execution is allowed
    const canExecute = this.canExecute();
    if (!canExecute.allowed) {
      return {
        success: false,
        error: canExecute.reason,
      };
    }

    // Check approval requirement
    if (this.config.requireApproval && !skipApproval) {
      // Return order in pending_approval status
      // Actual submission happens when approved
      return {
        success: true,
        order: {
          id: `pending-${Date.now()}`,
          workspaceId: '',
          legs: request.legs,
          orderType: request.orderType,
          limitPrice: request.limitPrice,
          stopPrice: request.stopPrice,
          duration: request.duration,
          status: 'pending_approval',
          filledQuantity: 0,
          createdAt: new Date().toISOString(),
          isPaper: this.provider.isPaper,
          isDryRun: request.dryRun || this.config.dryRunMode,
        },
      };
    }

    // Force dry run if configured
    const finalRequest = {
      ...request,
      dryRun: request.dryRun || this.config.dryRunMode,
    };

    // Submit to provider
    const result = await this.provider.submitOrder(finalRequest);

    // Track order count
    if (result.success && result.order?.status === 'filled') {
      this.ordersToday++;
    }

    return result;
  }

  /**
   * Get provider (for read-only operations)
   */
  getProvider(): BrokerProvider {
    return this.provider;
  }

  private updateDailyOrderCount(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastOrderDate !== today) {
      this.lastOrderDate = today;
      this.ordersToday = 0;
    }
  }
}
