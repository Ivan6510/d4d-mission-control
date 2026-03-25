"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Hash,
  Target,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Building2,
  UserCheck,
} from "lucide-react";
import { getDeals } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/types";

type Period = "monthly" | "quarterly" | "annual";

interface CashFlowEntry {
  date: string;
  label: string;
  type: "in" | "out";
  amount: number;
  balance: number;
}

export default function FinancialsPage() {
  useAuth();

  const [allDeals, setAllDeals] = useState<import("@/lib/types").Deal[]>([]);
  useEffect(() => { getDeals().then(setAllDeals).catch(() => {}); }, []);
  const deals = useMemo(() => allDeals.filter((d) => d.stage === "sold"), [allDeals]);

  const [period, setPeriod] = useState<Period>("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.floor(new Date().getMonth() / 3)
  );

  // Filter deals by selected period
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (!deal.sold_date) return false;
      const soldDate = new Date(deal.sold_date);
      const soldYear = soldDate.getFullYear();
      const soldMonth = soldDate.getMonth();

      if (soldYear !== year) return false;

      if (period === "monthly") {
        return soldMonth === selectedMonth;
      } else if (period === "quarterly") {
        const quarter = Math.floor(soldMonth / 3);
        return quarter === selectedQuarter;
      }
      // annual — just year match
      return true;
    });
  }, [deals, period, year, selectedMonth, selectedQuarter]);

  // Summary calculations
  const summary = useMemo(() => {
    const totalRevenue = filteredDeals.reduce(
      (sum, d) => sum + (d.sale_price ?? 0),
      0
    );
    const totalCosts = filteredDeals.reduce(
      (sum, d) =>
        sum +
        (d.purchase_price ?? 0) +
        (d.rehab_actual ?? 0) +
        (d.holding_costs ?? 0) +
        (d.closing_costs ?? 0),
      0
    );
    // Gross profit: actual_profit if available, else expected_profit
    const grossProfit = filteredDeals.reduce(
      (sum, d) => sum + (d.actual_profit ?? d.expected_profit ?? 0),
      0
    );
    const dfdKeeps = grossProfit * 0.75;
    const ivansCut = grossProfit * 0.25;
    const dealsClosed = filteredDeals.length;
    const avgProfit = dealsClosed > 0 ? grossProfit / dealsClosed : 0;

    return { totalRevenue, totalCosts, grossProfit, dfdKeeps, ivansCut, dealsClosed, avgProfit };
  }, [filteredDeals]);

  // Cash flow timeline
  const cashFlow = useMemo(() => {
    const entries: CashFlowEntry[] = [];

    for (const deal of filteredDeals) {
      const addr = deal.address.split(",")[0] || deal.address;

      // Purchase (money out)
      if (deal.purchase_price && deal.closing_date) {
        entries.push({
          date: deal.closing_date,
          label: `Purchase: ${addr}`,
          type: "out",
          amount: deal.purchase_price,
          balance: 0,
        });
      }

      // Rehab spend (money out)
      if (deal.rehab_actual && deal.rehab_end_date) {
        entries.push({
          date: deal.rehab_end_date,
          label: `Rehab: ${addr}`,
          type: "out",
          amount: deal.rehab_actual,
          balance: 0,
        });
      }

      // Holding + closing costs (money out)
      const holdingClosing = (deal.holding_costs ?? 0) + (deal.closing_costs ?? 0);
      if (holdingClosing > 0 && deal.sold_date) {
        entries.push({
          date: deal.sold_date,
          label: `Holding/Closing: ${addr}`,
          type: "out",
          amount: holdingClosing,
          balance: 0,
        });
      }

      // Sale (money in)
      if (deal.sale_price && deal.sold_date) {
        entries.push({
          date: deal.sold_date,
          label: `Sale: ${addr}`,
          type: "in",
          amount: deal.sale_price,
          balance: 0,
        });
      }
    }

    // Sort chronologically
    entries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate running balance
    let balance = 0;
    for (const entry of entries) {
      if (entry.type === "in") {
        balance += entry.amount;
      } else {
        balance -= entry.amount;
      }
      entry.balance = balance;
    }

    return entries;
  }, [filteredDeals]);

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    for (const deal of deals) {
      if (deal.sold_date) {
        years.add(new Date(deal.sold_date).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [deals]);

  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

  function getPeriodLabel(): string {
    if (period === "monthly") return `${MONTHS[selectedMonth]} ${year}`;
    if (period === "quarterly") return `${QUARTERS[selectedQuarter]} ${year}`;
    return String(year);
  }

  function navigatePeriod(direction: -1 | 1) {
    if (period === "monthly") {
      let newMonth = selectedMonth + direction;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setSelectedMonth(newMonth);
      setYear(newYear);
    } else if (period === "quarterly") {
      let newQuarter = selectedQuarter + direction;
      let newYear = year;
      if (newQuarter < 0) {
        newQuarter = 3;
        newYear--;
      } else if (newQuarter > 3) {
        newQuarter = 0;
        newYear++;
      }
      setSelectedQuarter(newQuarter);
      setYear(newYear);
    } else {
      setYear(year + direction);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-dark-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-200 sm:text-3xl">
          Financials
        </h1>
        <p className="mt-1 text-dark-400">
          Profit & loss tracking for completed deals
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Period tabs */}
        <div className="flex rounded-lg border border-dark-700 bg-dark-900 p-1">
          {(["monthly", "quarterly", "annual"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-brand-500 text-white"
                  : "text-dark-400 hover:text-dark-200"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigatePeriod(-1)}
            className="rounded-lg border border-dark-700 bg-dark-900 p-2 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-dark-200">
            {getPeriodLabel()}
          </span>
          <button
            onClick={() => navigatePeriod(1)}
            className="rounded-lg border border-dark-700 bg-dark-900 p-2 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Year picker */}
          {period !== "annual" && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-dark-200 outline-none focus:border-brand-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filteredDeals.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-700 bg-dark-900 py-20 text-center">
          <Receipt className="mb-4 h-12 w-12 text-dark-600" />
          <h3 className="text-lg font-semibold text-dark-300">
            No sold deals in {getPeriodLabel()}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-dark-500">
            Financial data will appear here once deals are marked as sold within
            the selected time period.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            <SummaryCard
              icon={<DollarSign className="h-5 w-5 text-green-400" />}
              label="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
            />
            <SummaryCard
              icon={<TrendingDown className="h-5 w-5 text-red-400" />}
              label="Total Costs"
              value={formatCurrency(summary.totalCosts)}
            />
            <SummaryCard
              icon={<TrendingUp className="h-5 w-5 text-brand-500" />}
              label="Gross Profit"
              value={formatCurrency(summary.grossProfit)}
              valueColor={
                summary.grossProfit >= 0 ? "text-green-400" : "text-red-400"
              }
            />
            <SummaryCard
              icon={<Building2 className="h-5 w-5 text-blue-400" />}
              label="D4D Keeps (75%)"
              value={formatCurrency(summary.dfdKeeps)}
              valueColor={
                summary.dfdKeeps >= 0 ? "text-blue-400" : "text-red-400"
              }
            />
            <SummaryCard
              icon={<UserCheck className="h-5 w-5 text-purple-400" />}
              label="Ivan's Cut (25%)"
              value={formatCurrency(summary.ivansCut)}
              sublabel="The Kloser"
              valueColor={
                summary.ivansCut >= 0 ? "text-purple-400" : "text-red-400"
              }
            />
            <SummaryCard
              icon={<Hash className="h-5 w-5 text-blue-400" />}
              label="Deals Closed"
              value={String(summary.dealsClosed)}
            />
            <SummaryCard
              icon={<Target className="h-5 w-5 text-yellow-400" />}
              label="Avg Profit / Deal"
              value={formatCurrency(summary.avgProfit)}
              valueColor={
                summary.avgProfit >= 0 ? "text-green-400" : "text-red-400"
              }
            />
          </div>

          {/* Deal-by-Deal P&L Table */}
          <div className="mb-8 rounded-xl border border-dark-700 bg-dark-900">
            <div className="border-b border-dark-700 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-dark-200">
                <BarChart3 className="h-5 w-5 text-brand-500" />
                Deal-by-Deal P&L
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-dark-500 sm:px-6">
                      Address
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500">
                      Purchase
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500">
                      Rehab
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500">
                      Sale Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500">
                      Gross Profit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500">
                      D4D (75%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-dark-500 sm:px-6">
                      Ivan (25%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {filteredDeals.map((deal) => {
                    const profit = deal.actual_profit ?? deal.expected_profit ?? 0;
                    const dfdShare = profit * 0.75;
                    const ivanShare = profit * 0.25;

                    return (
                      <tr
                        key={deal.id}
                        className="transition-colors hover:bg-dark-800/50"
                      >
                        <td className="px-4 py-3.5 sm:px-6">
                          <div className="text-sm font-medium text-dark-200">
                            {deal.address}
                          </div>
                          <div className="text-xs text-dark-500">
                            {deal.city}{deal.city && ", "}{deal.state}
                            {deal.sold_date && (
                              <span className="ml-2">
                                Sold {formatDate(deal.sold_date)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-dark-300">
                          {formatCurrency(deal.purchase_price)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-dark-300">
                          {formatCurrency(deal.rehab_budget)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-dark-300">
                          {formatCurrency(deal.sale_price)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold ${
                            profit >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {formatCurrency(profit)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-blue-400">
                          {formatCurrency(dfdShare)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm text-purple-400 sm:px-6">
                          {formatCurrency(ivanShare)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t border-dark-700 bg-dark-800/30">
                    <td className="px-4 py-3.5 text-sm font-semibold text-dark-200 sm:px-6">
                      Totals ({filteredDeals.length} deal
                      {filteredDeals.length !== 1 ? "s" : ""})
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-dark-200">
                      {formatCurrency(
                        filteredDeals.reduce(
                          (s, d) => s + (d.purchase_price ?? 0),
                          0
                        )
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-dark-200">
                      {formatCurrency(
                        filteredDeals.reduce(
                          (s, d) => s + (d.rehab_budget ?? 0),
                          0
                        )
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-dark-200">
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold ${
                        summary.grossProfit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(summary.grossProfit)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-blue-400">
                      {formatCurrency(summary.dfdKeeps)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-purple-400 sm:px-6">
                      {formatCurrency(summary.ivansCut)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cash Flow Timeline */}
          {cashFlow.length > 0 && (
            <div className="rounded-xl border border-dark-700 bg-dark-900">
              <div className="border-b border-dark-700 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-dark-200">
                  <DollarSign className="h-5 w-5 text-brand-500" />
                  Cash Flow Timeline
                </h2>
              </div>
              <div className="divide-y divide-dark-800">
                {cashFlow.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3.5 sm:px-6"
                  >
                    {/* Indicator */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        entry.type === "in"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {entry.type === "in" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-dark-200">
                        {entry.label}
                      </p>
                      <p className="text-xs text-dark-500">
                        {formatDate(entry.date)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          entry.type === "in"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {entry.type === "in" ? "+" : "-"}
                        {formatCurrency(entry.amount)}
                      </p>
                      <p
                        className={`text-xs ${
                          entry.balance >= 0 ? "text-dark-400" : "text-red-400"
                        }`}
                      >
                        Bal: {formatCurrency(entry.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function SummaryCard({
  icon,
  label,
  value,
  sublabel,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  valueColor?: string;
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
        className={`text-xl font-bold sm:text-2xl ${
          valueColor ?? "text-dark-200"
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-dark-500">{sublabel}</p>
      )}
    </div>
  );
}
