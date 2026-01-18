export { BaseStrategy, type StrategyContext, type StrategyCandidate } from './base-strategy';
export { CashSecuredPutStrategy } from './cash-secured-put';
export { CoveredCallStrategy } from './covered-call';
export { PutCreditSpreadStrategy, CallCreditSpreadStrategy } from './credit-spread';

import { BaseStrategy } from './base-strategy';
import { CashSecuredPutStrategy } from './cash-secured-put';
import { CoveredCallStrategy } from './covered-call';
import { PutCreditSpreadStrategy, CallCreditSpreadStrategy } from './credit-spread';

/**
 * Get all available strategy implementations
 */
export function getAllStrategies(): BaseStrategy[] {
  return [
    new CashSecuredPutStrategy(),
    new CoveredCallStrategy(),
    new PutCreditSpreadStrategy(),
    new CallCreditSpreadStrategy(),
  ];
}
