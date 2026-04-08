"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHeatmapColor } from "@/lib/colors";

interface OverlapHeatmapProps {
  competitors: string[];
  matrix: number[][];
}

export function OverlapHeatmap({ competitors, matrix }: OverlapHeatmapProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Overlap Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="p-2" />
                {competitors.map((c) => (
                  <th
                    key={c}
                    className="p-2 font-medium text-center max-w-[80px] truncate"
                    title={c}
                  >
                    {c.length > 12 ? c.slice(0, 12) + "…" : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitors.map((rowComp, ri) => (
                <tr key={rowComp}>
                  <td className="p-2 font-medium max-w-[120px] truncate" title={rowComp}>
                    {rowComp.length > 15 ? rowComp.slice(0, 15) + "…" : rowComp}
                  </td>
                  {matrix[ri].map((val, ci) => (
                    <td
                      key={ci}
                      className="p-2 text-center border"
                      style={{
                        backgroundColor: getHeatmapColor(val),
                        color: val > 0.6 ? "white" : "black",
                      }}
                    >
                      {(val * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
