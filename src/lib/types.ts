export interface AuctionInsightRow {
  date: string; // YYYY-MM-DD or date range string
  startDate: string;
  endDate: string;
  campaign: string;
  displayUrl: string; // competitor domain
  impressionShare: number;
  overlapRate: number;
  positionAboveRate: number;
  topOfPageRate: number;
  absTopOfPageRate: number;
  outRankingShare: number;
}

export interface CampaignPerformanceRow {
  date: string;
  startDate: string;
  endDate: string;
  campaign: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  cpc: number;
}

export interface JoinedDataPoint {
  startDate: string;
  endDate: string;
  dateLabel: string;
  campaign: string;
  competitor: string;
  impressionShare: number;
  overlapRate: number;
  positionAboveRate: number;
  topOfPageRate: number;
  absTopOfPageRate: number;
  outRankingShare: number;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  cpc: number;
}

export interface CompetitorSummary {
  competitor: string;
  avgImpressionShare: number;
  avgOverlapRate: number;
  avgPositionAboveRate: number;
  avgTopOfPageRate: number;
  avgAbsTopOfPageRate: number;
  avgOutRankingShare: number;
  dataPoints: number;
}

export interface SpendISDataPoint {
  spend: number;
  impressionShare: number;
  clicks: number;
  impressions: number;
  conversions: number;
  dateLabel: string;
}

export interface SimulationResult {
  spend: number;
  predictedIS: number;
  predictedLeads: number;
  marginalCPL: number;
  incrementalLeads: number;
  incrementalSpend: number;
}
