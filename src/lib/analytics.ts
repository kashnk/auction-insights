import {
  JoinedDataPoint,
  CompetitorSummary,
  SpendISDataPoint,
  SimulationResult,
} from "./types";

export function getCompetitorSummaries(
  data: JoinedDataPoint[]
): CompetitorSummary[] {
  const groups = new Map<string, JoinedDataPoint[]>();
  for (const d of data) {
    const existing = groups.get(d.competitor) || [];
    existing.push(d);
    groups.set(d.competitor, existing);
  }

  const summaries: CompetitorSummary[] = [];
  for (const [competitor, points] of groups) {
    const n = points.length;
    summaries.push({
      competitor,
      avgImpressionShare: points.reduce((s, p) => s + p.impressionShare, 0) / n,
      avgOverlapRate: points.reduce((s, p) => s + p.overlapRate, 0) / n,
      avgPositionAboveRate:
        points.reduce((s, p) => s + p.positionAboveRate, 0) / n,
      avgTopOfPageRate: points.reduce((s, p) => s + p.topOfPageRate, 0) / n,
      avgAbsTopOfPageRate:
        points.reduce((s, p) => s + p.absTopOfPageRate, 0) / n,
      avgOutRankingShare:
        points.reduce((s, p) => s + p.outRankingShare, 0) / n,
      dataPoints: n,
    });
  }

  return summaries.sort((a, b) => b.avgImpressionShare - a.avgImpressionShare);
}

export function getSpendISData(data: JoinedDataPoint[]): SpendISDataPoint[] {
  // Aggregate by date period, looking at "You" rows
  const youData = data.filter(
    (d) =>
      d.competitor.toLowerCase() === "you" ||
      d.competitor.toLowerCase().includes("you")
  );

  // Group by date label
  const byDate = new Map<string, JoinedDataPoint[]>();
  for (const d of youData) {
    const existing = byDate.get(d.dateLabel) || [];
    existing.push(d);
    byDate.set(d.dateLabel, existing);
  }

  const points: SpendISDataPoint[] = [];
  for (const [dateLabel, rows] of byDate) {
    // Average IS across campaigns for this period
    const avgIS = rows.reduce((s, r) => s + r.impressionShare, 0) / rows.length;
    // Sum spend across campaigns for this period
    const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
    const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);

    if (totalSpend > 0 && avgIS > 0) {
      points.push({
        spend: totalSpend,
        impressionShare: avgIS,
        clicks: totalClicks,
        impressions: totalImpressions,
        conversions: totalConversions,
        dateLabel,
      });
    }
  }

  return points.sort((a, b) => a.spend - b.spend);
}

/**
 * Fit a logarithmic curve: IS = a * ln(spend) + b
 * Using least squares regression on ln(spend) vs IS
 */
export function fitLogCurve(
  points: SpendISDataPoint[]
): { a: number; b: number; r2: number } {
  if (points.length < 2) return { a: 0, b: 0, r2: 0 };

  const n = points.length;
  const xs = points.map((p) => Math.log(p.spend));
  const ys = points.map((p) => p.impressionShare);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { a: 0, b: sumY / n, r2: 0 };

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  const ssRes = ys.reduce((s, y, i) => {
    const pred = a * xs[i] + b;
    return s + (y - pred) ** 2;
  }, 0);
  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { a, b, r2 };
}

export function predictIS(
  spend: number,
  curve: { a: number; b: number }
): number {
  if (spend <= 0) return 0;
  const predicted = curve.a * Math.log(spend) + curve.b;
  return Math.max(0, Math.min(1, predicted)); // Clamp 0-100%
}

/**
 * Estimate clicks at a given spend level using historical CPC trends
 */
function estimateClicks(
  spend: number,
  points: SpendISDataPoint[],
): number {
  if (points.length === 0 || spend <= 0) return 0;

  // Use weighted average CPC from data, adjusted for diminishing returns
  const avgCPC =
    points.reduce((s, p) => s + (p.clicks > 0 ? p.spend / p.clicks : 0), 0) /
    points.filter((p) => p.clicks > 0).length;

  if (!avgCPC || avgCPC <= 0) return 0;

  // As spend increases beyond observed range, CPC increases (diminishing returns)
  const maxObservedSpend = Math.max(...points.map((p) => p.spend));
  const spendRatio = spend / maxObservedSpend;

  // CPC scales with sqrt of spend ratio beyond observed data
  const adjustedCPC =
    spendRatio > 1 ? avgCPC * Math.sqrt(spendRatio) : avgCPC;

  return spend / adjustedCPC;
}

export function simulateSpend(
  targetSpend: number,
  points: SpendISDataPoint[],
  curve: { a: number; b: number },
  baseSpend?: number
): SimulationResult {
  const base = baseSpend ?? (points.length > 0 ? points[points.length - 1].spend : 0);
  const baseClicks = estimateClicks(base, points);

  const newIS = predictIS(targetSpend, curve);
  const newClicks = estimateClicks(targetSpend, points);

  const incrementalClicks = Math.max(0, newClicks - baseClicks);
  const incrementalSpend = Math.max(0, targetSpend - base);
  const marginalCPC =
    incrementalClicks > 0 ? incrementalSpend / incrementalClicks : 0;

  return {
    spend: targetSpend,
    predictedIS: newIS,
    predictedClicks: newClicks,
    marginalCPC,
    incrementalClicks,
    incrementalSpend,
  };
}

export function generateSimulationCurve(
  points: SpendISDataPoint[],
  curve: { a: number; b: number },
  steps: number = 50
): SimulationResult[] {
  if (points.length === 0) return [];

  const minSpend = Math.min(...points.map((p) => p.spend)) * 0.5;
  const maxSpend = Math.max(...points.map((p) => p.spend)) * 2.5;
  const step = (maxSpend - minSpend) / steps;

  const results: SimulationResult[] = [];
  for (let i = 0; i <= steps; i++) {
    const spend = minSpend + step * i;
    results.push(simulateSpend(spend, points, curve));
  }

  return results;
}

export function getCompetitorTrends(
  data: JoinedDataPoint[]
): Map<string, { dateLabel: string; impressionShare: number }[]> {
  const trends = new Map<string, { dateLabel: string; impressionShare: number }[]>();

  for (const d of data) {
    const existing = trends.get(d.competitor) || [];
    existing.push({
      dateLabel: d.dateLabel,
      impressionShare: d.impressionShare,
    });
    trends.set(d.competitor, existing);
  }

  // Sort each competitor's data by date
  for (const [, points] of trends) {
    points.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  }

  return trends;
}

export function getOverlapMatrix(
  data: JoinedDataPoint[]
): { competitors: string[]; matrix: number[][] } {
  // Get unique competitors
  const competitors = Array.from(new Set(data.map((d) => d.competitor))).sort();

  // Build overlap matrix from overlap rates
  const overlapMap = new Map<string, number[]>();
  for (const d of data) {
    const existing = overlapMap.get(d.competitor) || [];
    existing.push(d.overlapRate);
    overlapMap.set(d.competitor, existing);
  }

  const matrix: number[][] = competitors.map((c) => {
    const rates = overlapMap.get(c) || [];
    const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    // Create a row where overlap with self is 1, others get the overlap rate
    return competitors.map((other) => {
      if (c === other) return 1;
      // Find overlap data between these two
      const relevantData = data.filter((d) => d.competitor === other);
      if (relevantData.length === 0) return avg;
      return (
        relevantData.reduce((s, d) => s + d.overlapRate, 0) /
        relevantData.length
      );
    });
  });

  return { competitors, matrix };
}
