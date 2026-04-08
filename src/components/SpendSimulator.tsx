"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SpendISDataPoint } from "@/lib/types";
import { simulateSpend } from "@/lib/analytics";

interface SpendSimulatorProps {
  dataPoints: SpendISDataPoint[];
  curve: { a: number; b: number };
}

export function SpendSimulator({ dataPoints, curve }: SpendSimulatorProps) {
  const minSpend = Math.min(...dataPoints.map((p) => p.spend));
  const maxSpend = Math.max(...dataPoints.map((p) => p.spend));
  const currentSpend = dataPoints[dataPoints.length - 1]?.spend ?? maxSpend;

  const [targetSpend, setTargetSpend] = useState(currentSpend);

  const sliderMin = Math.round(minSpend * 0.5);
  const sliderMax = Math.round(maxSpend * 3);

  const result = useMemo(
    () => simulateSpend(targetSpend, dataPoints, curve, currentSpend),
    [targetSpend, dataPoints, curve, currentSpend]
  );

  const spendChange = targetSpend - currentSpend;
  const spendChangePct = currentSpend > 0 ? (spendChange / currentSpend) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Target Monthly Spend</Label>
            <span className="text-2xl font-bold">
              ${targetSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <Slider
            value={[targetSpend]}
            onValueChange={([v]) => setTargetSpend(v)}
            min={sliderMin}
            max={sliderMax}
            step={Math.round((sliderMax - sliderMin) / 100)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${sliderMin.toLocaleString()}</span>
            <span className="text-blue-600 font-medium">
              Current: ${currentSpend.toLocaleString()}
            </span>
            <span>${sliderMax.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Predicted IS"
            value={`${(result.predictedIS * 100).toFixed(1)}%`}
            subtext={`${spendChangePct >= 0 ? "+" : ""}${spendChangePct.toFixed(0)}% spend`}
          />
          <MetricCard
            label="Predicted Clicks"
            value={Math.round(result.predictedClicks).toLocaleString()}
            subtext={`+${Math.round(result.incrementalClicks).toLocaleString()} incremental`}
          />
          <MetricCard
            label="Marginal CPC"
            value={
              result.marginalCPC > 0
                ? `$${result.marginalCPC.toFixed(2)}`
                : "—"
            }
            subtext="Cost per incremental click"
            warn={result.marginalCPC > (currentSpend > 0 && dataPoints[dataPoints.length - 1]?.clicks > 0
              ? currentSpend / dataPoints[dataPoints.length - 1].clicks * 2
              : Infinity)}
          />
          <MetricCard
            label="Incremental Spend"
            value={`$${Math.round(result.incrementalSpend).toLocaleString()}`}
            subtext={
              result.incrementalClicks > 0
                ? `${Math.round(result.incrementalClicks)} more clicks`
                : "No additional clicks"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  warn,
}: {
  label: string;
  value: string;
  subtext: string;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${warn ? "border-amber-300 bg-amber-50" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${warn ? "text-amber-700" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}
