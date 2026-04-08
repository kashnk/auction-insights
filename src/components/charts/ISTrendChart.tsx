"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinedDataPoint } from "@/lib/types";
import { getColor } from "@/lib/colors";

export function ISTrendChart({ data }: { data: JoinedDataPoint[] }) {
  // Get unique dates and competitors
  const dates = Array.from(new Set(data.map((d) => d.dateLabel))).sort();
  const competitors = Array.from(new Set(data.map((d) => d.competitor)));

  // Pivot data for recharts
  const chartData = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const comp of competitors) {
      const points = data.filter(
        (d) => d.dateLabel === date && d.competitor === comp
      );
      if (points.length > 0) {
        row[comp] =
          Math.round(
            (points.reduce((s, p) => s + p.impressionShare, 0) /
              points.length) *
              1000
          ) / 10;
      }
    }
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impression Share Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            {competitors.map((comp, i) => (
              <Line
                key={comp}
                type="monotone"
                dataKey={comp}
                stroke={getColor(i)}
                strokeWidth={comp.toLowerCase().includes("you") ? 3 : 1.5}
                dot={{ r: comp.toLowerCase().includes("you") ? 4 : 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
