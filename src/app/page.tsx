"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/FileUpload";
import { CompetitorTable } from "@/components/CompetitorTable";
import { ISTrendChart } from "@/components/charts/ISTrendChart";
import { OverlapHeatmap } from "@/components/charts/OverlapHeatmap";
import { SpendISChart } from "@/components/charts/SpendISChart";
import { DiminishingReturnsChart } from "@/components/charts/DiminishingReturnsChart";
import { SpendSimulator } from "@/components/SpendSimulator";
import {
  parseAuctionInsightsCSV,
  parseCampaignPerformanceCSV,
  joinData,
} from "@/lib/parser";
import {
  getCompetitorSummaries,
  getSpendISData,
  fitLogCurve,
  generateSimulationCurve,
  getOverlapMatrix,
} from "@/lib/analytics";
import { AuctionInsightRow, CampaignPerformanceRow } from "@/lib/types";
import { SAMPLE_AUCTION_CSV, SAMPLE_PERFORMANCE_CSV } from "@/lib/sample-data";

export default function Home() {
  const [auctionData, setAuctionData] = useState<AuctionInsightRow[]>([]);
  const [perfData, setPerfData] = useState<CampaignPerformanceRow[]>([]);

  const handleAuctionUpload = useCallback((csv: string) => {
    setAuctionData(parseAuctionInsightsCSV(csv));
  }, []);

  const handlePerfUpload = useCallback((csv: string) => {
    setPerfData(parseCampaignPerformanceCSV(csv));
  }, []);

  const loadSampleData = useCallback(() => {
    setAuctionData(parseAuctionInsightsCSV(SAMPLE_AUCTION_CSV));
    setPerfData(parseCampaignPerformanceCSV(SAMPLE_PERFORMANCE_CSV));
  }, []);

  const joined = useMemo(
    () => joinData(auctionData, perfData),
    [auctionData, perfData]
  );
  const summaries = useMemo(
    () => getCompetitorSummaries(joined),
    [joined]
  );
  const spendISData = useMemo(() => getSpendISData(joined), [joined]);
  const curve = useMemo(() => fitLogCurve(spendISData), [spendISData]);
  const simulationCurve = useMemo(
    () => generateSimulationCurve(spendISData, curve),
    [spendISData, curve]
  );
  const overlapData = useMemo(() => getOverlapMatrix(joined), [joined]);

  const hasData = auctionData.length > 0;
  const hasSpendData = spendISData.length >= 2;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Auction Insights Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload Google Ads Auction Insights and Campaign Performance reports
            to analyze your competitive landscape and simulate spend scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <FileUpload
            title="Auction Insights Report"
            description="CSV with competitors, impression share, overlap rates by time period"
            onFileLoaded={handleAuctionUpload}
            loaded={auctionData.length > 0}
            rowCount={auctionData.length}
          />
          <FileUpload
            title="Campaign Performance Report"
            description="CSV with spend, clicks, impressions, conversions by time period"
            onFileLoaded={handlePerfUpload}
            loaded={perfData.length > 0}
            rowCount={perfData.length}
          />
        </div>

        {!hasData && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Upload your CSV files above to get started, or try with sample data.
              </p>
              <Button onClick={loadSampleData} variant="outline">
                Load Sample Data
              </Button>
            </CardContent>
          </Card>
        )}

        {hasData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Competitors Tracked"
                value={summaries.length.toString()}
              />
              <StatCard
                label="Time Periods"
                value={Array.from(new Set(joined.map((d) => d.dateLabel))).length.toString()}
              />
              <StatCard
                label="Your Avg. IS"
                value={`${(
                  (summaries.find(
                    (s) =>
                      s.competitor.toLowerCase() === "you" ||
                      s.competitor.toLowerCase().includes("you")
                  )?.avgImpressionShare ?? 0) * 100
                ).toFixed(1)}%`}
              />
              <StatCard
                label="Total Spend"
                value={`$${Math.round(
                  perfData.reduce((s, p) => s + p.spend, 0)
                ).toLocaleString()}`}
              />
            </div>

            <Separator className="mb-6" />

            <Tabs defaultValue="landscape" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="landscape">Landscape</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="simulator" disabled={!hasSpendData}>
                  Simulator
                </TabsTrigger>
                <TabsTrigger value="returns" disabled={!hasSpendData}>
                  Returns
                </TabsTrigger>
              </TabsList>

              <TabsContent value="landscape" className="space-y-4">
                <CompetitorTable summaries={summaries} />
                <OverlapHeatmap
                  competitors={overlapData.competitors}
                  matrix={overlapData.matrix}
                />
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <ISTrendChart data={joined} />
              </TabsContent>

              <TabsContent value="simulator" className="space-y-4">
                {hasSpendData && (
                  <>
                    <SpendSimulator dataPoints={spendISData} curve={curve} />
                    <SpendISChart
                      dataPoints={spendISData}
                      curvePoints={simulationCurve}
                      r2={curve.r2}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="returns" className="space-y-4">
                {hasSpendData && (
                  <DiminishingReturnsChart curvePoints={simulationCurve} />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
