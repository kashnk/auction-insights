"use client";

import { CompetitorSummary } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

function barWidth(val: number): string {
  return `${Math.min(100, val * 100)}%`;
}

export function CompetitorTable({
  summaries,
}: {
  summaries: CompetitorSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitor Landscape</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Competitor</TableHead>
              <TableHead>Impr. Share</TableHead>
              <TableHead>Overlap Rate</TableHead>
              <TableHead>Pos. Above Rate</TableHead>
              <TableHead>Top of Page</TableHead>
              <TableHead>Abs. Top</TableHead>
              <TableHead>Outranking Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((s) => (
              <TableRow
                key={s.competitor}
                className={
                  s.competitor.toLowerCase() === "you" ||
                  s.competitor.toLowerCase().includes("you")
                    ? "bg-blue-50 font-medium"
                    : ""
                }
              >
                <TableCell className="font-medium">{s.competitor}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-right text-sm">
                      {pct(s.avgImpressionShare)}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: barWidth(s.avgImpressionShare) }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>{pct(s.avgOverlapRate)}</TableCell>
                <TableCell>{pct(s.avgPositionAboveRate)}</TableCell>
                <TableCell>{pct(s.avgTopOfPageRate)}</TableCell>
                <TableCell>{pct(s.avgAbsTopOfPageRate)}</TableCell>
                <TableCell>{pct(s.avgOutRankingShare)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
