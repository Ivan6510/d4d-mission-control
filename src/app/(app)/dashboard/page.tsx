"use client";

import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  Landmark,
  ArrowRight,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { useDeals } from "@/lib/useStore";
import { useAuth } from "@/lib/auth";
import {
  DEAL_STAGES,
  formatCurrency,
  daysInStage,
} from "@/lib/types";

const PIPELINE_STAGES = DEAL_STAGES.filter(
  (s) => s.key !== "dead" && s.key !== "sold"
);

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-500",
  prospect: "bg-blue-500",
  under_contract: "bg-purple-500",
  in_rehab: "bg-yellow-500",
  listed: "bg-brand-500",
  sold: "bg-green-500",
  dead: "bg-red-500",
};

const STAGE_TEXT_COLORS: Record<string, string> = {
  lead: "text-gray-400",
  prospect: "text-blue-400",
  under_contract: "text-purple-400",
  in_rehab: "text-yellow-400",
  listed: "text-brand-400",
  sold: "text-green-400",
  dead: "text-red-400",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: deals, loading } = useDeals();

  // Computed stats
  const activeDeals = deals.filter(
    (d) => d.stage !== "dead" && d.stage !== "sold"
  );

  const now = new Date();
  const thisMonthDeals = deals.filter((d) => {
    const created = new Date(d.created_at);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  });

  const thisYearProfit = deals
    .filter((d) => {
      if (!d.sold_date) return false;
      return new Date(d.sold_date).getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + (d.actual_profit ?? 0), 0);

  // Pipeline counts
  const stageCounts: Record<string, number> = {};
  for (const stage of DEAL_STAGES) {
    stageCounts[stage.key] = deals.filter((d) => d.stage === stage.key).length;
  }

  const maxStageCount = Math.max(
    ...PIPELINE_STAGES.map((s) => stageCounts[s.key] || 0),
    1
  );

  // Recent deals (last 5, excluding dead)
  const recentDeals = deals
    .filter((d) => d.stage !== "dead")
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-dark-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-200 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-dark-400">
            {user ? `Welcome back, ${user.name}` : "Welcome to D4D Mission Control"}
          </p>
        </div>
        <Link
          href="/deals?add=true"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500/90 hover:shadow-brand-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Deal
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<LayoutDashboard className="h-5 w-5 text-brand-500" />}
          label="Active Deals"
          value={loading ? "..." : String(activeDeals.length)}
          sub={`${stageCounts["in_rehab"] || 0} in rehab`}
        />
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-blue-400" />}
          label="Deals This Month"
          value={loading ? "..." : String(thisMonthDeals.length)}
          sub={`${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`}
        />
        <SummaryCard
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
          label="Total Profit YTD"
          value={loading ? "..." : formatCurrency(thisYearProfit)}
          sub={`${deals.filter((d) => d.sold_date && new Date(d.sold_date).getFullYear() === now.getFullYear()).length} deals sold`}
        />
        <SummaryCard
          icon={<Landmark className="h-5 w-5 text-purple-400" />}
          label="Cash Position"
          value="--"
          sub="Connect Bank"
          placeholder
        />
      </div>

      {/* Pipeline Visualization */}
      <div className="mb-8 rounded-xl border border-dark-700 bg-dark-900 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-200">Pipeline</h2>
          <Link
            href="/deals"
            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 transition-colors"
          >
            View all deals
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stage flow - horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = stageCounts[stage.key] || 0;
            const barHeight = maxStageCount > 0 ? (count / maxStageCount) * 100 : 0;

            return (
              <div key={stage.key} className="flex-1">
                {/* Desktop: vertical bars */}
                <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-2">
                  <span className="text-xl font-bold text-dark-200">
                    {loading ? "-" : count}
                  </span>
                  <div className="relative h-24 w-full rounded-lg bg-dark-800">
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500 ${STAGE_COLORS[stage.key]}`}
                      style={{
                        height: loading ? "0%" : `${Math.max(barHeight, 8)}%`,
                        opacity: count === 0 ? 0.3 : 1,
                      }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 text-center whitespace-nowrap">
                    {stage.label}
                  </span>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden" />
                  )}
                </div>

                {/* Mobile: horizontal bars */}
                <div className="flex items-center gap-3 sm:hidden">
                  <span className="w-28 text-xs text-dark-400 shrink-0">
                    {stage.label}
                  </span>
                  <div className="relative h-7 flex-1 rounded-md bg-dark-800 overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-md transition-all duration-500 ${STAGE_COLORS[stage.key]}`}
                      style={{
                        width: loading ? "0%" : `${Math.max(barHeight, 4)}%`,
                        opacity: count === 0 ? 0.3 : 1,
                      }}
                    />
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-white drop-shadow">
                      {loading ? "-" : count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage flow arrows (desktop only) */}
        <div className="mt-3 hidden sm:flex sm:items-center sm:justify-center sm:gap-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${STAGE_COLORS[stage.key]}`}
              />
              <span className="text-[10px] text-dark-500">{stage.label}</span>
              {i < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className="mx-1 h-3 w-3 text-dark-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deals */}
      <div className="rounded-xl border border-dark-700 bg-dark-900 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-200">Recent Deals</h2>
          <Link
            href="/deals"
            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 transition-colors"
          >
            All deals
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-dark-800"
              />
            ))}
          </div>
        ) : recentDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="mb-3 h-10 w-10 text-dark-600" />
            <p className="text-sm text-dark-400">No deals yet</p>
            <Link
              href="/deals?add=true"
              className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-400"
            >
              Add your first deal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDeals.map((deal) => {
              const stageInfo = DEAL_STAGES.find((s) => s.key === deal.stage);
              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="flex items-center gap-4 rounded-lg border border-dark-700/50 bg-dark-800/50 px-4 py-3 transition-colors hover:bg-dark-800 hover:border-dark-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dark-200">
                      {deal.address}
                    </p>
                    <p className="text-xs text-dark-500">
                      {deal.city}, {deal.state}
                      {deal.stage !== "lead" && deal.stage !== "prospect" && (
                        <span className="ml-2">
                          {daysInStage(deal.stage_changed_at)}d in stage
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {deal.expected_profit != null && (
                      <span className="hidden text-sm font-medium text-green-400 sm:inline">
                        {formatCurrency(deal.expected_profit)}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${stageInfo?.color ?? "bg-dark-700"} bg-opacity-20 ${STAGE_TEXT_COLORS[deal.stage] ?? "text-dark-300"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${stageInfo?.color ?? "bg-dark-500"}`}
                      />
                      {stageInfo?.label ?? deal.stage}
                    </span>
                    <ChevronRight className="h-4 w-4 text-dark-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function SummaryCard({
  icon,
  label,
  value,
  sub,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  placeholder?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dark-700 bg-dark-900 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-bold sm:text-3xl ${
          placeholder ? "text-dark-500" : "text-dark-200"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-1 text-xs ${
          placeholder
            ? "text-brand-500 cursor-pointer hover:text-brand-400"
            : "text-dark-400"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}
