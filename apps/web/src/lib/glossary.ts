// Options Trading Glossary - Plain English Definitions
// Each term has a short definition and an extended explanation with examples

export interface GlossaryTerm {
  term: string;
  short: string; // One-liner for tooltips
  extended: string; // Longer explanation
  example?: string; // Real-world analogy or example
  relatedTerms?: string[];
}

export const glossary: Record<string, GlossaryTerm> = {
  // Core Option Concepts
  'option': {
    term: 'Option',
    short: 'A contract giving you the right (but not obligation) to buy or sell a stock at a specific price.',
    extended: 'An option is like a reservation. You pay a small fee now to lock in a price for later. If you decide not to use it, you just lose the fee. If the deal becomes valuable, you can exercise your right.',
    example: 'Like paying $50 to reserve a concert ticket at $100, even if prices later go to $200.',
    relatedTerms: ['call', 'put', 'strike', 'premium'],
  },

  'call': {
    term: 'Call Option',
    short: 'The right to BUY a stock at a specific price. You profit if the stock goes UP.',
    extended: 'A call option lets you buy shares at a locked-in price. You\'d buy a call if you think the stock will rise. The seller of the call is betting the stock won\'t rise above the strike price.',
    example: 'Like a rain check at a store - you can buy the item at today\'s price even if it goes up later.',
    relatedTerms: ['put', 'strike', 'covered-call'],
  },

  'put': {
    term: 'Put Option',
    short: 'The right to SELL a stock at a specific price. You profit if the stock goes DOWN.',
    extended: 'A put option lets you sell shares at a locked-in price. You\'d buy a put if you think the stock will fall (like insurance). You\'d SELL a put if you\'re willing to buy the stock at that lower price.',
    example: 'Like insurance on your car - you can "sell" your damaged car to the insurance company at an agreed value.',
    relatedTerms: ['call', 'strike', 'cash-secured-put'],
  },

  'strike': {
    term: 'Strike Price',
    short: 'The price at which you can buy (call) or sell (put) the stock.',
    extended: 'The strike price is your "locked-in" price. For a call, it\'s what you\'d pay for the stock. For a put, it\'s what you\'d receive. Options with strikes close to the current stock price are more expensive.',
    example: 'If Apple is at $180 and you have a $170 call, you can buy Apple for $170 (a $10 discount).',
    relatedTerms: ['itm', 'otm', 'atm'],
  },

  'premium': {
    term: 'Premium',
    short: 'The price you pay (or receive) for an option contract.',
    extended: 'The premium is the cost of the option. Buyers pay it, sellers receive it. It\'s influenced by time remaining, stock volatility, and how close the strike is to current price. One contract = 100 shares, so a $2.50 premium = $250.',
    example: 'Like an insurance premium - you pay it for protection, and the seller keeps it if nothing happens.',
    relatedTerms: ['credit', 'debit'],
  },

  'credit': {
    term: 'Credit',
    short: 'Money you RECEIVE when you sell an option. This is your potential profit.',
    extended: 'When you sell an option, you receive a credit upfront. This money is yours to keep if the option expires worthless (which is often the goal). Credit strategies mean you\'re getting paid to take on an obligation.',
    example: 'Like getting paid rent upfront - the money is yours, but you have responsibilities.',
    relatedTerms: ['premium', 'debit', 'net-credit'],
  },

  'debit': {
    term: 'Debit',
    short: 'Money you PAY when you buy an option. This is your maximum risk.',
    extended: 'When you buy an option, you pay a debit. This is the most you can lose - if the option expires worthless, you lose the debit. But your upside can be much larger.',
    example: 'Like buying a lottery ticket - you can only lose what you paid, but you might win big.',
    relatedTerms: ['premium', 'credit'],
  },

  // The Greeks
  'delta': {
    term: 'Delta',
    short: 'How much the option price moves when the stock moves $1. Also roughly the probability of profit.',
    extended: 'Delta tells you two things: (1) If delta is 0.30, the option gains about $0.30 when the stock rises $1. (2) A delta of 0.30 also means roughly 30% chance the option ends up "in the money." For selling options, you want LOW delta.',
    example: 'A -0.20 delta put has about 80% chance of expiring worthless (which is good if you sold it).',
    relatedTerms: ['gamma', 'theta', 'vega', 'greeks'],
  },

  'theta': {
    term: 'Theta',
    short: 'How much value the option loses each day due to time passing. Time decay.',
    extended: 'Options lose value as expiration approaches - this is theta decay. If theta is -0.05, the option loses $5 per day (per contract). Sellers LOVE theta because time decay puts money in their pocket. Buyers fight against it.',
    example: 'Like a carton of milk approaching its expiration date - it becomes less valuable each day.',
    relatedTerms: ['delta', 'gamma', 'vega', 'dte'],
  },

  'gamma': {
    term: 'Gamma',
    short: 'How fast delta changes as the stock moves. Higher gamma = more volatile option price.',
    extended: 'Gamma measures acceleration. High gamma means delta (and option price) can change rapidly. Options near expiration with strikes close to stock price have high gamma - they can swing wildly.',
    example: 'Like the sensitivity of your car\'s steering - high gamma means small movements cause big changes.',
    relatedTerms: ['delta', 'theta', 'vega'],
  },

  'vega': {
    term: 'Vega',
    short: 'How much the option price changes when market volatility changes 1%.',
    extended: 'Vega measures sensitivity to volatility. When markets get fearful, volatility rises and options become more expensive. If you sell options when volatility is high, you collect more premium - but there\'s more risk too.',
    example: 'Like insurance prices after a hurricane - when fear is high, premiums are high.',
    relatedTerms: ['delta', 'theta', 'gamma', 'iv'],
  },

  'greeks': {
    term: 'The Greeks',
    short: 'Measurements (delta, theta, gamma, vega) that describe how option prices change.',
    extended: 'The Greeks are risk metrics that help you understand how your options position will behave. Each Greek measures sensitivity to a different factor: stock price (delta), time (theta), delta changes (gamma), and volatility (vega).',
    relatedTerms: ['delta', 'theta', 'gamma', 'vega'],
  },

  // Volatility
  'iv': {
    term: 'Implied Volatility (IV)',
    short: 'The market\'s expectation of how much the stock will move. Higher IV = more expensive options.',
    extended: 'IV is the market\'s forecast of future price swings. High IV means the market expects big moves (up or down). Sellers prefer high IV (bigger premiums), buyers prefer low IV (cheaper options). IV often spikes before earnings.',
    example: 'Like weather forecasts - if storms are expected, umbrella prices (option premiums) go up.',
    relatedTerms: ['vega', 'iv-rank', 'hv'],
  },

  'iv-rank': {
    term: 'IV Rank',
    short: 'Where current IV sits compared to the past year. 80% = IV is higher than 80% of the past year.',
    extended: 'IV Rank helps you know if options are "expensive" or "cheap" historically. High IV Rank (>50%) is good for selling options - you\'re collecting above-average premium. Low IV Rank is better for buying.',
    example: 'Like knowing if gas prices are high compared to last year - it helps you decide when to fill up.',
    relatedTerms: ['iv', 'iv-percentile'],
  },

  'hv': {
    term: 'Historical Volatility (HV)',
    short: 'How much the stock has actually moved in the past. Measured as an annualized percentage.',
    extended: 'HV looks backward at actual price movements. If a stock has 30% HV, it has historically moved about 30% per year. Comparing HV to IV helps identify if options are over/underpriced.',
    relatedTerms: ['iv', 'iv-rank'],
  },

  // Time
  'dte': {
    term: 'DTE (Days to Expiration)',
    short: 'How many days until the option expires and the contract ends.',
    extended: 'DTE affects everything. More time = more expensive options (more can happen). The sweet spot for selling is often 30-45 DTE - enough premium, but theta decay accelerates. As DTE shrinks, options lose value faster.',
    example: '45 DTE means the option expires in 45 days. After that, it\'s worthless or exercised.',
    relatedTerms: ['theta', 'expiration'],
  },

  'expiration': {
    term: 'Expiration Date',
    short: 'The date when the option contract ends. After this, the option no longer exists.',
    extended: 'On expiration day, options are either exercised (if valuable) or expire worthless. Most option sellers aim for their options to expire worthless - that means they kept all the premium they collected.',
    relatedTerms: ['dte', 'assignment'],
  },

  // Moneyness
  'itm': {
    term: 'In The Money (ITM)',
    short: 'An option that has intrinsic value. Calls: stock above strike. Puts: stock below strike.',
    extended: 'ITM options have real value right now. A $100 call is ITM if the stock is at $105 (you could buy at $100, sell at $105). ITM options are more expensive and have higher delta.',
    example: 'If you have a $170 put and the stock is at $165, your put is ITM by $5.',
    relatedTerms: ['otm', 'atm', 'strike'],
  },

  'otm': {
    term: 'Out of The Money (OTM)',
    short: 'An option with no intrinsic value yet. Most sold options are OTM (and sellers want them to stay that way).',
    extended: 'OTM options only have "time value" - they could become valuable, but aren\'t yet. Sellers prefer OTM options because they expire worthless more often. A $200 call when stock is at $180 is OTM.',
    example: 'Selling OTM puts means you only have to buy the stock if it drops significantly.',
    relatedTerms: ['itm', 'atm', 'strike'],
  },

  'atm': {
    term: 'At The Money (ATM)',
    short: 'An option where the strike price equals (or is very close to) the current stock price.',
    extended: 'ATM options have the most "time value" and are most sensitive to price changes. They have roughly 0.50 delta. Income traders usually avoid ATM options - too much risk of assignment.',
    relatedTerms: ['itm', 'otm', 'strike'],
  },

  // Strategies
  'cash-secured-put': {
    term: 'Cash-Secured Put (CSP)',
    short: 'Selling a put while keeping enough cash to buy the stock if assigned. Get paid to wait for a lower price.',
    extended: 'You\'re saying "I\'ll buy this stock at $X price if it drops there, and I want to be paid for that promise." You keep the premium either way. Worst case: you buy a stock you wanted anyway, at a discount. Best case: stock stays up, you keep the premium, repeat.',
    example: 'Apple is $180. You sell a $170 put for $3. If Apple stays above $170, you keep $300. If it drops to $165, you buy at $170 but really paid $167 after the premium.',
    relatedTerms: ['put', 'assignment', 'premium'],
  },

  'covered-call': {
    term: 'Covered Call (CC)',
    short: 'Selling a call against stock you own. Get paid for agreeing to sell at a higher price.',
    extended: 'You own 100 shares and sell someone the right to buy them at a higher price. You collect premium immediately. If the stock rises past your strike, you sell your shares (but at a profit). If it doesn\'t, you keep shares AND premium.',
    example: 'Own Apple at $180, sell a $190 call for $2. If Apple hits $195, you sell at $190 (still a gain). If it stays at $180, you keep the $200 premium and still own shares.',
    relatedTerms: ['call', 'assignment', 'premium'],
  },

  'credit-spread': {
    term: 'Credit Spread',
    short: 'Selling one option and buying another to limit risk. You receive a net credit (premium).',
    extended: 'A credit spread caps your maximum loss by buying a protective option further out. You receive less premium than a naked option, but your risk is defined. Put credit spreads profit if stock stays up; call credit spreads profit if stock stays down.',
    example: 'Sell $170 put, buy $165 put. Max profit is the credit received. Max loss is $5 minus the credit.',
    relatedTerms: ['put-credit-spread', 'call-credit-spread', 'spread-width'],
  },

  'put-credit-spread': {
    term: 'Put Credit Spread (Bull Put Spread)',
    short: 'Sell a put, buy a lower put. Profits if stock stays above the sold strike. Bullish strategy.',
    extended: 'You\'re betting the stock won\'t fall below your sold strike. The bought put limits your loss if you\'re wrong. Max profit is the credit; max loss is the spread width minus credit. Often used when you\'re mildly bullish.',
    relatedTerms: ['credit-spread', 'cash-secured-put'],
  },

  'call-credit-spread': {
    term: 'Call Credit Spread (Bear Call Spread)',
    short: 'Sell a call, buy a higher call. Profits if stock stays below the sold strike. Bearish strategy.',
    extended: 'You\'re betting the stock won\'t rise above your sold strike. The bought call limits your loss if you\'re wrong. Used when you\'re mildly bearish or think a stock has topped out.',
    relatedTerms: ['credit-spread', 'covered-call'],
  },

  // Risk/Reward
  'max-profit': {
    term: 'Maximum Profit',
    short: 'The most you can make on this trade. For credit trades, this is the premium you collected.',
    extended: 'For option sellers, max profit is usually achieved when options expire worthless. For credit spreads, it\'s the net credit received. You don\'t need to wait until expiration - most traders close at 50-75% of max profit.',
    relatedTerms: ['max-loss', 'breakeven'],
  },

  'max-loss': {
    term: 'Maximum Loss',
    short: 'The worst-case scenario. The most you could possibly lose on this trade.',
    extended: 'Knowing your max loss is crucial for position sizing. For cash-secured puts, it\'s the full stock price minus premium. For spreads, it\'s the spread width minus premium. Never risk more than you can afford to lose.',
    example: 'A $5-wide spread with $1.50 credit has a max loss of $3.50 ($5 - $1.50).',
    relatedTerms: ['max-profit', 'breakeven', 'risk-management'],
  },

  'breakeven': {
    term: 'Breakeven Price',
    short: 'The stock price where you neither make nor lose money at expiration.',
    extended: 'For a sold put, breakeven = strike minus premium received. For a sold call, breakeven = strike plus premium. The stock can move against you by the amount of premium you collected before you start losing.',
    example: 'Sell a $100 put for $3, your breakeven is $97. Stock can drop to $97 before you lose money.',
    relatedTerms: ['max-profit', 'max-loss'],
  },

  'pop': {
    term: 'Probability of Profit (POP)',
    short: 'The estimated chance this trade makes money. Higher is better for sellers.',
    extended: 'POP is derived from delta and current market prices. A 75% POP means historically, similar setups made money 75% of the time. High POP trades usually have smaller profits but win more often.',
    example: 'A 0.20 delta put has roughly 80% POP - you\'ll likely keep the premium 8 out of 10 times.',
    relatedTerms: ['delta', 'expected-value'],
  },

  // Actions
  'assignment': {
    term: 'Assignment',
    short: 'When you\'re required to fulfill your option obligation - buy (put) or sell (call) the shares.',
    extended: 'Assignment happens when someone exercises an option you sold. For puts, you must buy 100 shares at the strike price. For calls, you must sell 100 shares. It\'s not bad - you kept the premium and knew this was possible.',
    example: 'Sold a $170 put, stock drops to $165. You\'re assigned: you buy 100 shares at $170 ($17,000).',
    relatedTerms: ['exercise', 'expiration'],
  },

  'exercise': {
    term: 'Exercise',
    short: 'Using your option right to buy (call) or sell (put) shares at the strike price.',
    extended: 'Option buyers can exercise anytime (American style) or at expiration (European style). Most options are closed before expiration rather than exercised. ITM options at expiration are usually auto-exercised.',
    relatedTerms: ['assignment', 'expiration'],
  },

  'roll': {
    term: 'Roll (Rolling)',
    short: 'Closing your current option and opening a new one, usually at a different strike or expiration.',
    extended: 'Rolling lets you manage a trade that\'s going against you (or extend a winner). Roll out = same strike, later expiration. Roll down = lower strike (for puts). Usually done for a credit to avoid taking a loss.',
    example: 'Your $170 put is being tested. Roll to a $165 put next month, collect more premium, give stock more room.',
    relatedTerms: ['dte', 'assignment'],
  },

  // Position Sizing
  'buying-power': {
    term: 'Buying Power',
    short: 'How much capital your broker is holding aside for this trade.',
    extended: 'Buying power is the collateral requirement. For cash-secured puts, it\'s the full purchase amount. For spreads, it\'s the spread width. Your broker won\'t let you risk more than your buying power allows.',
    relatedTerms: ['margin', 'collateral'],
  },

  'ror': {
    term: 'Return on Risk (ROR)',
    short: 'Your potential profit divided by your maximum risk. Higher is better.',
    extended: 'ROR helps compare trades with different risk profiles. A trade making $100 on $500 risk (20% ROR) might be better than one making $150 on $1000 risk (15% ROR). Annualize this to compare different DTEs.',
    example: '$2.50 credit on a $5 spread = 50% return on risk if it expires worthless.',
    relatedTerms: ['max-profit', 'max-loss'],
  },
};

// Get a term by key (case-insensitive, handles variations)
export function getTerm(key: string): GlossaryTerm | undefined {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return glossary[normalized] || Object.values(glossary).find(
    t => t.term.toLowerCase().replace(/[^a-z0-9]/g, '-') === normalized
  );
}

// Get all terms as an array
export function getAllTerms(): GlossaryTerm[] {
  return Object.values(glossary);
}

// Categories for organized display
export const glossaryCategories = {
  'Basics': ['option', 'call', 'put', 'strike', 'premium', 'credit', 'debit'],
  'The Greeks': ['delta', 'theta', 'gamma', 'vega', 'greeks'],
  'Volatility': ['iv', 'iv-rank', 'hv'],
  'Time': ['dte', 'expiration'],
  'Moneyness': ['itm', 'otm', 'atm'],
  'Strategies': ['cash-secured-put', 'covered-call', 'credit-spread', 'put-credit-spread', 'call-credit-spread'],
  'Risk & Reward': ['max-profit', 'max-loss', 'breakeven', 'pop', 'ror', 'buying-power'],
  'Actions': ['assignment', 'exercise', 'roll'],
};

// Plain English strategy explanations
export const strategyExplanations: Record<string, {
  oneLiner: string;
  whyDoThis: string;
  bestWhen: string;
  worstCase: string;
  analogy: string;
}> = {
  'cash_secured_put': {
    oneLiner: "Get paid to promise you'll buy a stock at a lower price",
    whyDoThis: "You want to own this stock anyway, but at a discount. Or you're happy collecting premium if it never drops.",
    bestWhen: "Stock is stable or rising, you like the company long-term, volatility is elevated (higher premiums)",
    worstCase: "Stock crashes and you're forced to buy at your strike price, even though it's now much lower",
    analogy: "Like getting paid rent to hold a reservation at a restaurant - you might have to show up and pay, or you just keep the money",
  },
  'covered_call': {
    oneLiner: "Get paid for agreeing to sell stock you own at a higher price",
    whyDoThis: "Generate income from shares you're holding. Willing to sell if price rises enough.",
    bestWhen: "Stock is flat or slowly rising, you're okay selling at your strike, want monthly income",
    worstCase: "Stock rockets up and you miss the gains above your strike (but still profit)",
    analogy: "Like renting out a vacation home - you get income, but might miss out if property values soar",
  },
  'put_credit_spread': {
    oneLiner: "Bet that stock stays above a certain level, with limited risk",
    whyDoThis: "Similar to cash-secured put but requires less capital and has defined max loss",
    bestWhen: "Mildly bullish, want defined risk, smaller account size",
    worstCase: "Stock drops below both strikes - you lose the spread width minus premium",
    analogy: "Like insurance deductible - you're protected from catastrophe but eat small losses",
  },
  'call_credit_spread': {
    oneLiner: "Bet that stock stays below a certain level, with limited risk",
    whyDoThis: "Think stock won't go much higher, want to profit from sideways or down movement",
    bestWhen: "Mildly bearish, stock seems overextended, high IV",
    worstCase: "Stock rockets above both strikes - you lose the spread width minus premium",
    analogy: "Like betting a basketball team won't score more than 100 points - you profit if they underperform",
  },
};
