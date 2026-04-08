const CHART_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#ea580c", // orange
  "#9333ea", // purple
  "#0891b2", // cyan
  "#d97706", // amber
  "#db2777", // pink
  "#4f46e5", // indigo
  "#059669", // emerald
  "#7c3aed", // violet
  "#c026d3", // fuchsia
];

export function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getHeatmapColor(value: number): string {
  // 0 = light, 1 = dark blue
  const intensity = Math.round(value * 255);
  return `rgb(${255 - intensity}, ${255 - intensity * 0.6}, 255)`;
}
