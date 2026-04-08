import Papa from "papaparse";
import {
  AuctionInsightRow,
  CampaignPerformanceRow,
  JoinedDataPoint,
} from "./types";

function parsePercent(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/%/g, "").replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num / 100;
}

function parseCurrency(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$€£,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeHeader(h: string): string {
  // Strip BOM, whitespace, and non-alphanumeric characters
  return h.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findHeader(
  headers: Record<string, string>,
  ...candidates: string[]
): string | undefined {
  for (const c of candidates) {
    const norm = normalizeHeader(c);
    if (headers[norm]) return headers[norm];
  }
  return undefined;
}

function buildHeaderMap(row: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    map[normalizeHeader(key)] = key;
  }
  return map;
}

function parseDateRange(dateStr: string): { start: string; end: string } {
  if (!dateStr) return { start: "", end: "" };
  // Handle "YYYY-MM-DD - YYYY-MM-DD" or "YYYY-MM-DD" or "MM/DD/YYYY" etc.
  const rangeSep = dateStr.includes(" - ") ? " - " : dateStr.includes("–") ? "–" : null;
  if (rangeSep) {
    const [s, e] = dateStr.split(rangeSep).map((d) => d.trim());
    return { start: normalizeDate(s), end: normalizeDate(e) };
  }
  const d = normalizeDate(dateStr);
  return { start: d, end: d };
}

function normalizeDate(d: string): string {
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  // Try MM/DD/YYYY
  const match = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  }
  return d;
}

export function parseAuctionInsightsCSV(
  csvText: string
): AuctionInsightRow[] {
  // Strip BOM and skip Google Ads report header rows
  const lines = csvText.replace(/^\uFEFF/, "").split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (
      lines[i].toLowerCase().includes("campaign") &&
      (lines[i].toLowerCase().includes("impression") ||
        lines[i].toLowerCase().includes("display url") ||
        lines[i].toLowerCase().includes("domain"))
    ) {
      startIdx = i;
      break;
    }
  }
  const cleanCSV = lines.slice(startIdx).join("\n");

  const result = Papa.parse<Record<string, string>>(cleanCSV, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.data.length === 0) return [];

  const hMap = buildHeaderMap(result.data[0]);
  const rows: AuctionInsightRow[] = [];

  // Resolve header names once (findHeader returns original CSV column name)
  const dateCol = findHeader(hMap, "Day", "Date", "Week", "Month", "Quarter", "Year", "date range");
  const campaignCol = findHeader(hMap, "Campaign", "campaign name");
  const domainCol = findHeader(hMap, "Display URL domain", "Domain", "Competitor", "display url", "search impr share domain");
  const isCol = findHeader(hMap, "Search impr. share", "Impression share", "Impr. share", "search impression share");
  const overlapCol = findHeader(hMap, "Search overlap rate", "Overlap rate");
  const posAboveCol = findHeader(hMap, "Position above rate", "Search position above rate");
  const topCol = findHeader(hMap, "Search top of page rate", "Top of page rate");
  const absTopCol = findHeader(hMap, "Search abs. top of page rate", "Abs. top of page rate", "Absolute top of page rate");
  const outrankCol = findHeader(hMap, "Search outranking share", "Outranking share");

  for (const row of result.data) {
    const dateStr = dateCol ? row[dateCol] || "" : "";
    const { start, end } = parseDateRange(dateStr);
    const campaign = campaignCol ? row[campaignCol] || "" : "";
    const domain = domainCol ? row[domainCol] || "" : "";

    if (!domain) continue;

    rows.push({
      date: dateStr,
      startDate: start,
      endDate: end,
      campaign,
      displayUrl: domain,
      impressionShare: parsePercent(isCol ? row[isCol] : undefined),
      overlapRate: parsePercent(overlapCol ? row[overlapCol] : undefined),
      positionAboveRate: parsePercent(posAboveCol ? row[posAboveCol] : undefined),
      topOfPageRate: parsePercent(topCol ? row[topCol] : undefined),
      absTopOfPageRate: parsePercent(absTopCol ? row[absTopCol] : undefined),
      outRankingShare: parsePercent(outrankCol ? row[outrankCol] : undefined),
    });
  }

  return rows;
}

export function parseCampaignPerformanceCSV(
  csvText: string
): CampaignPerformanceRow[] {
  const lines = csvText.replace(/^\uFEFF/, "").split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (
      lines[i].toLowerCase().includes("campaign") &&
      (lines[i].toLowerCase().includes("cost") ||
        lines[i].toLowerCase().includes("spend") ||
        lines[i].toLowerCase().includes("click"))
    ) {
      startIdx = i;
      break;
    }
  }
  const cleanCSV = lines.slice(startIdx).join("\n");

  const result = Papa.parse<Record<string, string>>(cleanCSV, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.data.length === 0) return [];

  const hMap = buildHeaderMap(result.data[0]);
  const rows: CampaignPerformanceRow[] = [];

  // Resolve header names once
  const dateCol = findHeader(hMap, "Day", "Date", "Week", "Month", "Quarter", "date range");
  const campaignCol = findHeader(hMap, "Campaign", "campaign name");
  const spendCol = findHeader(hMap, "Cost", "Spend", "Amount spent");
  const clicksCol = findHeader(hMap, "Clicks");
  const imprCol = findHeader(hMap, "Impressions", "Impr.", "Impr");
  const convCol = findHeader(hMap, "Conversions", "Conv.", "Conv");
  const cpcCol = findHeader(hMap, "Avg. CPC", "CPC", "Cost / click", "Average CPC");

  for (const row of result.data) {
    const dateStr = dateCol ? row[dateCol] || "" : "";
    const { start, end } = parseDateRange(dateStr);
    const campaign = campaignCol ? row[campaignCol] || "" : "";

    const spend = parseCurrency(spendCol ? row[spendCol] : undefined);
    const clicks = parseNumber(clicksCol ? row[clicksCol] : undefined);
    const impressions = parseNumber(imprCol ? row[imprCol] : undefined);
    const conversions = parseNumber(convCol ? row[convCol] : undefined);
    const cpc = cpcCol
      ? parseCurrency(row[cpcCol])
      : clicks > 0
        ? spend / clicks
        : 0;

    if (!campaign && spend === 0 && clicks === 0) continue;

    rows.push({
      date: dateStr,
      startDate: start,
      endDate: end,
      campaign,
      spend,
      clicks,
      impressions,
      conversions,
      cpc,
    });
  }

  return rows;
}

export function joinData(
  auctionData: AuctionInsightRow[],
  performanceData: CampaignPerformanceRow[]
): JoinedDataPoint[] {
  const joined: JoinedDataPoint[] = [];

  // Build a lookup for performance data by campaign + date range
  const perfMap = new Map<string, CampaignPerformanceRow>();
  for (const p of performanceData) {
    const key = `${p.campaign}|${p.startDate}|${p.endDate}`;
    perfMap.set(key, p);
  }

  // Also build a campaign-only lookup for when dates don't match exactly
  const perfByCampaign = new Map<string, CampaignPerformanceRow[]>();
  for (const p of performanceData) {
    const existing = perfByCampaign.get(p.campaign) || [];
    existing.push(p);
    perfByCampaign.set(p.campaign, existing);
  }

  for (const a of auctionData) {
    const exactKey = `${a.campaign}|${a.startDate}|${a.endDate}`;
    let perf = perfMap.get(exactKey);

    // Fallback: find performance data with overlapping date range
    if (!perf && a.campaign) {
      const campPerf = perfByCampaign.get(a.campaign);
      if (campPerf) {
        perf = campPerf.find(
          (p) =>
            p.startDate === a.startDate ||
            p.endDate === a.endDate ||
            (p.startDate <= a.endDate && p.endDate >= a.startDate)
        );
      }
    }

    // If still no match, try with empty campaign (aggregate rows)
    if (!perf) {
      const aggKey = `|${a.startDate}|${a.endDate}`;
      perf = perfMap.get(aggKey);
    }

    const dateLabel = a.startDate === a.endDate
      ? a.startDate
      : `${a.startDate} – ${a.endDate}`;

    joined.push({
      startDate: a.startDate,
      endDate: a.endDate,
      dateLabel: dateLabel || a.date || "Unknown",
      campaign: a.campaign,
      competitor: a.displayUrl,
      impressionShare: a.impressionShare,
      overlapRate: a.overlapRate,
      positionAboveRate: a.positionAboveRate,
      topOfPageRate: a.topOfPageRate,
      absTopOfPageRate: a.absTopOfPageRate,
      outRankingShare: a.outRankingShare,
      spend: perf?.spend ?? 0,
      clicks: perf?.clicks ?? 0,
      impressions: perf?.impressions ?? 0,
      conversions: perf?.conversions ?? 0,
      cpc: perf?.cpc ?? 0,
    });
  }

  return joined;
}
