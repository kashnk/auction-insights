"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResult } from "@/lib/types";

export function DiminishingReturnsChart({
  curvePoints,
}: {
  curvePoints: SimulationResult[];
}) {
  const chartData = curvePoints
    .filter((p) => p.marginalCPC > 0 && p.marginalCPC < 1000)
    .map((p) => ({
      spend: Math.round(p.spend),
      marginalCPC: Math.round(p.marginalCPC * 100) / 100,
      predictedIS: Math.round(p.predictedIS * 1000) / 10,
      incrementalClicks: Math.round(p.incrementalClicks),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diminishing Returns Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="spend"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="cpc"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${v}`}
              label={{
                value: "Marginal CPC",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <YAxis
              yAxisId="is"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              label={{
                value: "Impression Share",
                angle: 90,
                position: "insideRight",
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "marginalCPC") return [`$${v.toFixed(2)}`, "Marginal CPC"];
                if (name === "predictedIS") return [`${v}%`, "Predicted IS"];
                return [String(value), String(name)];
              }}
              labelFormatter={(label) => `Spend: $${Number(label).toLocaleString()}`}
            />
            <Legend />
            <Line
              yAxisId="cpc"
              type="monotone"
              dataKey="marginalCPC"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              name="Marginal CPC"
            />
            <Line
              yAxisId="is"
              type="monotone"
              dataKey="predictedIS"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Predicted IS"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
