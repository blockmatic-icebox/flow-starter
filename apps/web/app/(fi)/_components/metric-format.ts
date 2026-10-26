export const formatInsightMs = (ms: number | null) => {
  if (ms === null) return null;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
};

export const formatCaptureRate = (rate: number | null) => {
  if (rate === null) return null;
  return `${(rate * 100).toFixed(0)}%`;
};

export const formatIntakeRate = (rate: number | null) => {
  if (rate === null) return null;
  return `${(rate * 100).toFixed(0)}%`;
};
