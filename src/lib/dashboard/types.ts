// What My Dashboard sends to the browser. Everything is already worked out and already limited to what the signed-in person may see.
import type { Period, Slice } from "./period";

export const CARD_KEYS = [
  "productSales", "projects", "projectValue", "quotes", "acceptedQuotes", "declinedQuotes", "leadsAssigned", "newLeads", "followUpLeads",
  "closedLeads", "followUpDeals", "closedDeals", "dealsConverted", "pendingTasks", "completedTasks", "siteVisitsToday",
] as const;
export type CardKey = (typeof CARD_KEYS)[number];

// period: follows the date filter. current: what is true now (the leads assigned to me now, tasks still pending ...). today: today only.
export type CardScope = "period" | "current" | "today";
export type DashboardCard = { key: CardKey; label: string; value: number; format: "number" | "money"; href: string | null; scope: CardScope };

export const CHART_KEYS = ["deal", "lead", "quote"] as const;
export type ChartKey = (typeof CHART_KEYS)[number];
export type DashboardChart = { key: ChartKey; title: string; total: number; slices: Slice[] };

export type TodayItem = { id: string; title: string; sub: string; meta: string; href: string };
export type TodaySection = { key: "leads" | "tasks" | "siteVisits" | "deals"; title: string; total: number; items: TodayItem[]; href: string };

export type AttendanceSummary = { present: number; absent: number; pct: number | null; workingDays: number; from: string | null; to: string | null };

export type DashboardMetrics = {
  userName: string;
  period: Period;
  cards: DashboardCard[];
  charts: DashboardChart[];
  today: TodaySection[];
  attendance: AttendanceSummary | null; // null: the person may not see Attendance
  linked: boolean; // false: the account is not linked to an employee, so the lead / deal / task numbers cannot be worked out
};

// ---- Quick actions (what the three-dot menu offers) and the page layout (Edit Page Layout)
export type QuickActionDef = { id: string; label: string; href: string; icon: string; hint: string };
export type QuickActions = { available: QuickActionDef[]; selected: string[] };

export const SECTION_KEYS = ["cards", "charts", "today", "attendance", "quickActions"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export type DashboardLayout = {
  sections: { key: SectionKey; visible: boolean }[]; // top to bottom
  cards: { key: CardKey; visible: boolean }[]; // left to right, then down
  charts: { key: ChartKey; visible: boolean }[];
  today: { key: TodaySection["key"]; visible: boolean }[];
};
export const SECTION_LABELS: Record<SectionKey, string> = { cards: "Summary Cards", charts: "Status Charts", today: "Today's Activity", attendance: "Attendance Overview", quickActions: "Quick Actions" };
