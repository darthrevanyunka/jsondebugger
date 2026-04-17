const MATCH_TONES = {
  neutral: {
    name: "neutral",
    text: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  },
  danger: {
    name: "danger",
    text: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
  },
  warning: {
    name: "warning",
    text: "#92400e",
    bg: "#fef3c7",
    border: "#fde68a",
  },
  success: {
    name: "success",
    text: "#166534",
    bg: "#dcfce7",
    border: "#bbf7d0",
  },
};

export function getMatchTone(count, total) {
  if (!total) return MATCH_TONES.neutral;
  const ratio = count / total;
  if (ratio < 0.34) return MATCH_TONES.danger;
  if (ratio < 0.67) return MATCH_TONES.warning;
  return MATCH_TONES.success;
}
