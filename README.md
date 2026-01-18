# Income Options Cockpit

A production-quality web application for generating income-focused options trade candidates with defined risk. Features a futuristic, interactive UI with AI-powered trade analysis, collaboration tools, and safe broker integration.

## IMPORTANT DISCLAIMERS

**This application does NOT guarantee profits.** Options trading involves substantial risk and is not suitable for all investors. See `/disclaimer` in the app for full details.

**Safety Features:**
- Only defined-risk strategies (NO naked options)
- All trades require explicit approval
- Kill switches for trading and broker execution
- Paper mode enabled by default
- Hard caps on risk limits

## Features

- **Trade Generation Engine**: Automatically computes and ranks income options trades (CSP, CC, PCS/CCS)
- **Auditable Recommendations**: Every trade includes structured evidence, pass/fail checks, and scoring breakdown
- **Market Narrative**: Daily regime analysis with strategy implications
- **What-If Simulator**: Interactive P/L projections with sliders
- **Learning Mode**: Educational tooltips and explanations
- **Experienced Trader Mode**: Raw Greeks and advanced metrics
- **Paper Trading**: Simulated fills and position tracking
- **Collaboration**: Invite family members, share workspace, comment on trades
- **Safe Broker Integration**: Manual guidance, paper mode, or broker API with approval gates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Database/Auth**: Supabase (Postgres + Auth + RLS)
- **Engine**: Custom TypeScript trading engine (`@cockpit/engine`)
- **Deployment**: Vercel with Cron jobs
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd income-options-cockpit
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings -> API to get your keys
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Migrations

Option A: Using Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

Option B: Manual SQL execution:
- Go to Supabase Dashboard -> SQL Editor
- Run the contents of `supabase/migrations/001_initial_schema.sql`
- Then run `supabase/migrations/002_rls_policies.sql`

### 4. Build the Engine

```bash
pnpm --filter @cockpit/engine build
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `MARKET_DATA_PROVIDER` | No | `mock` (default), `polygon`, or `tradier` |
| `MARKET_DATA_API_KEY` | No | API key for real provider |
| `CRON_SECRET` | No | Secret for cron job authentication |
| `TRADING_ENABLED` | No | `false` (default) - master trading switch |
| `BROKER_EXECUTION_ENABLED` | No | `false` (default) - broker execution switch |
| `BROKER_PROVIDER` | No | `manual` (default), `paper`, or `schwab` |
| `APP_BASE_URL` | No | Base URL for OAuth callbacks |

## Project Structure

```
income-options-cockpit/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities and Supabase clients
│       │   └── hooks/          # React hooks
│       └── scripts/            # Seed scripts
├── packages/
│   └── engine/                 # Trading engine
│       └── src/
│           ├── providers/      # Market data providers
│           ├── signals/        # Regime detection
│           ├── strategies/     # Strategy implementations
│           ├── scoring/        # Trade ranking
│           └── narrative/      # Market brief generation
└── supabase/
    └── migrations/             # SQL migrations
```

## Key Pages

| Page | Description |
|------|-------------|
| `/` | Dashboard with market overview and top trades |
| `/trades` | List of all trade candidates |
| `/trades/[id]` | Trade detail with what-if simulator |
| `/strategies` | Strategy explorer with education |
| `/narrative` | Daily market brief |
| `/settings` | Risk profile and configuration |
| `/portfolio` | Paper trading positions |
| `/broker` | Broker connection management |
| `/disclaimer` | Risk disclaimer |

## Deploying to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Cron jobs are configured in `vercel.json` to run recompute at:
- 8:30 AM CT (13:30 UTC)
- 12:30 PM CT (17:30 UTC)

## Inviting Collaborators (Father-in-Law)

1. Log into the app with your account
2. Go to Settings
3. Click "Invite Member"
4. Enter their email and select role (viewer/admin)
5. They'll receive an invite to join your workspace

### Enabling Experienced Trader Mode

Toggle "Advanced" in the header to show:
- Full Greeks (delta, gamma, theta, vega)
- IV metrics and percentiles
- Open interest and volume
- Raw score components

## Switching Between Trading Modes

### Manual Mode (Default)
- View trade recommendations
- Copy order instructions to your broker
- No automated execution

### Paper Mode
- Enable in Settings -> Safety Controls
- Simulates fills at mid price
- Tracks positions and P/L
- Perfect for testing strategies

### Broker Mode (Advanced)
1. Enable `TRADING_ENABLED=true` in env
2. Enable `BROKER_EXECUTION_ENABLED=true` in env
3. Connect broker in `/broker`
4. Each trade still requires explicit approval

## Testing

```bash
# Run engine tests
pnpm --filter @cockpit/engine test

# Run all tests
pnpm test
```

## Mock Mode

The app runs fully in mock mode without any paid APIs:
- `MockProvider` generates realistic market data
- Quotes, historical prices, and option chains are simulated
- Perfect for development and testing

To use real data, set `MARKET_DATA_PROVIDER=polygon` and provide your API key.

## Safety Architecture

```
User Request
    │
    ▼
┌─────────────────────┐
│  TRADING_ENABLED?   │──No──▶ Manual guidance only
└─────────────────────┘
    │ Yes
    ▼
┌─────────────────────┐
│  Risk Limits OK?    │──No──▶ Blocked
└─────────────────────┘
    │ Yes
    ▼
┌─────────────────────┐
│  User Approval      │──No──▶ Blocked
└─────────────────────┘
    │ Yes
    ▼
┌─────────────────────┐
│  BROKER_ENABLED?    │──No──▶ Paper fill
└─────────────────────┘
    │ Yes
    ▼
┌─────────────────────┐
│  Pre-submit checks  │──Fail──▶ Blocked
└─────────────────────┘
    │ Pass
    ▼
  Broker Order
```

## Risk Limits (Hard Caps)

These limits cannot be exceeded regardless of settings:

| Limit | Maximum |
|-------|---------|
| Risk per trade | 5% of account |
| Total risk | 25% of account |
| Daily loss limit | Must be set |
| Min option OI | Cannot be disabled |

## Contributing

This is a personal project. Feel free to fork and customize for your needs.

## License

MIT

---

**Remember**: This tool is for educational purposes. Always do your own research and consult with a financial advisor before trading options.
