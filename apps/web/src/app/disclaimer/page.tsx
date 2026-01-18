import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Info, Scale } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Security & Risk Disclaimer"
        subtitle="Important information about using this application"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Warning */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-6 w-6" />
                IMPORTANT RISK WARNING
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">
                Options trading involves substantial risk and is not suitable for all investors.
              </p>
              <p className="text-muted-foreground">
                Before trading options, you should carefully consider your investment objectives,
                level of experience, and risk appetite. You may lose some or all of your initial
                investment; do not invest money you cannot afford to lose.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Past performance is not indicative of future results.</strong> The
                calculations and recommendations provided by this application are based on
                historical data and theoretical models that may not accurately predict future
                market conditions.
              </p>
            </CardContent>
          </Card>

          {/* No Guarantees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                No Profit Guarantees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                This application does NOT guarantee profits or returns of any kind. The trade
                recommendations, scores, and analytics provided are:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">For educational and informational purposes only</strong> -
                  They should not be construed as personalized investment advice.
                </li>
                <li>
                  <strong className="text-foreground">Based on automated analysis</strong> -
                  The algorithms use predefined rules and may not account for all market conditions
                  or individual circumstances.
                </li>
                <li>
                  <strong className="text-foreground">Subject to limitations</strong> -
                  Market data may be delayed, incomplete, or inaccurate. Calculations are approximations
                  and may not reflect actual execution prices.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Defined Risk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Defined-Risk Strategies Only
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                This application exclusively recommends <strong className="text-foreground">defined-risk strategies</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Cash-Secured Puts:</strong> Selling puts with cash collateral
                  equal to the potential assignment cost.
                </li>
                <li>
                  <strong className="text-foreground">Covered Calls:</strong> Selling calls against owned shares.
                </li>
                <li>
                  <strong className="text-foreground">Credit Spreads:</strong> Vertical spreads with defined maximum loss.
                </li>
              </ul>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                <p className="font-medium text-green-400">
                  This application will NEVER recommend:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm">
                  <li>Naked (uncovered) short options</li>
                  <li>Undefined-risk strategies</li>
                  <li>Margin-based positions beyond conservative estimates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Responsibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Your Responsibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                By using this application, you acknowledge and agree that:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  You are solely responsible for your investment decisions and any resulting gains
                  or losses.
                </li>
                <li>
                  You will conduct your own research and due diligence before placing any trades.
                </li>
                <li>
                  You understand options trading and the specific strategies recommended by this
                  application.
                </li>
                <li>
                  You will not rely solely on this application for trading decisions.
                </li>
                <li>
                  You have reviewed and understand your broker&apos;s margin requirements and trading
                  policies.
                </li>
                <li>
                  You will use appropriate position sizing and risk management regardless of
                  recommendations.
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Safety Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Built-in Safety Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                This application includes multiple safety mechanisms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-foreground">Kill Switches:</strong> Global toggles to disable trading
                  and broker execution.
                </li>
                <li>
                  <strong className="text-foreground">Risk Limits:</strong> Configurable per-trade and portfolio-level
                  risk caps that cannot exceed safe maximums.
                </li>
                <li>
                  <strong className="text-foreground">Paper Mode:</strong> Simulation mode for testing without real
                  money (default).
                </li>
                <li>
                  <strong className="text-foreground">Approval Gates:</strong> All trades require explicit user
                  approval before execution.
                </li>
                <li>
                  <strong className="text-foreground">Liquidity Filters:</strong> Automated screening for adequate
                  option liquidity.
                </li>
                <li>
                  <strong className="text-foreground">Earnings Exclusion:</strong> Automatic blocking of trades
                  near earnings announcements.
                </li>
              </ul>
              <p className="text-sm mt-4">
                These safety features are provided as additional protection but do not eliminate
                trading risk. Always use your own judgment and risk management practices.
              </p>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Disclaimer:</strong> This application is provided
                &quot;as is&quot; without warranty of any kind. The developers and operators are not
                registered investment advisers, broker-dealers, or financial planners. Nothing
                in this application constitutes investment, legal, or tax advice. Consult with
                qualified professionals before making investment decisions.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                <strong className="text-foreground">Limitation of Liability:</strong> In no event shall
                the developers or operators be liable for any direct, indirect, incidental,
                special, or consequential damages arising from the use of this application.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
