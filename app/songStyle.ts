export const CHART_STYLE: Record<string, { color: string; prefix: string }> = {
  LEGGENDARIA: { color: "#fd067c", prefix: "† " },
  ANOTHER: { color: "inherit", prefix: "" },
  HYPER: { color: "#ffa500", prefix: "" },
};

const NEWEST_VERSION_COLOR = "#4ade80";
export const CURRENT_VERSION_ID = 34;

export function getTitleColor(chart: string, versionId: number | null | undefined): string {
  if (versionId != null && versionId === CURRENT_VERSION_ID) return NEWEST_VERSION_COLOR;
  return CHART_STYLE[chart]?.color ?? "inherit";
}