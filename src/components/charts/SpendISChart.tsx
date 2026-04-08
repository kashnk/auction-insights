"use client";

import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpendISDataPoint, SimulationResult } from "@/lib/types";

interface SpendISChartProps {
  dataPoints: SpendISDataPoint[];
  curvePoints: SimulationResult[];
  r2: number;
}

export function SpendISChart({
  dataPoints,
  curvePoints,
  r2,
}: SpendISChartProps) {
  // Combine actual data points and curve for the chart
  const scatterData = dataPoints.map((p) => ({
    spend: Math.round(p.spend),
    is: Math.round(p.impressionShare * 1000) / 10,
    label: p.dateLabel,
  }));

  const lineData = curvePoints.map((p) => ({
    spend: Math.round(p.spend),
    fittedIS: Math.round(p.predictedIS * 1000) / 10,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spend vs. Impression Share</CardTitle>
          <Badge variant="outline">R² = {r2.toFixed(3)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="spend"
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              label={{
                value: "Spend",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              label={{
                value: "Impression Share",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value}%`,
                name === "is" ? "Actual IS" : "Fitted IS",
              ]}
              labelFormatter={(label) => `Spend: $${Number(label).toLocaleString()}`}
            />
            <Scatter
              name="Actual"
              data={scatterData}
              dataKey="is"
              fill="#2563eb"
              r={6}
            />
            <Line
              name="Log Fit"
              data={lineData}
              dataKey="fittedIS"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
