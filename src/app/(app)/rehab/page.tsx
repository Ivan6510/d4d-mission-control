"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useDeals, useRehabItems, useDraws } from "@/lib/useStore";
import type { RehabItem, Draw, DrawStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import {
  Hammer,
  ChevronDown,
  Plus,
  X,
  DollarSign,
  ClipboardList,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pencil,
  Save,
} from "lucide-react";

const CATEGORIES = [
  "Kitchen",
  "Bathroom",
  "Flooring",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Paint",
  "Windows",
  "Exterior",
  "General",
  "Other",
] as const;

const ITEM_STATUSES = ["pending", "in_progress", "completed"] as const;

const DRAW_STATUS_FLOW: DrawStatus[] = ["pending", "requested", "approved", "paid"];

const DRAW_LABELS: Record<number, { title: string; description: string }> = {
  1: { title: "Draw 1 — Front Money", description: "Start of rehab" },
  2: { title: "Draw 2 — Midpoint", description: "Submit proof of 50% completion" },
  3: { title: "Draw 3 — Final", description: "Final completion + proof" },
};

const DRAW_STATUS_COLORS: Record<DrawStatus, string> = {
  pending: "bg-dark-700 text-dark-300",
  requested: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400",
};

interface NewLineItem {
  category: string;
  description: string;
  estimated_cost: string;
  contractor: string;
}

const EMPTY_LINE_ITEM: NewLineItem = {
  category: "General",
  description: "",
  estimated_cost: "",
  contractor: "",
};

export default function RehabPage() {
  useAuth();

  const { data: allDeals } = useDeals();
  const deals = allDeals.filter((d) => ["in_rehab", "under_contract"].includes(d.stage));

  const [selectedDealId, setSelectedDealId] = useState<string>("");
  useEffect(() => {
    if (selectedDealId || deals.length === 0) return;
    const rehabFirst = deals.find((d) => d.stage === "in_rehab");
    setSelectedDealId(rehabFirst?.id ?? deals[0]?.id ?? "");
  }, [deals, selectedDealId]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<NewLineItem>(EMPTY_LINE_ITEM);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ actual_cost: string; status: string }>({
    actual_cost: "",
    status: "",
  });
  const [progressNotes, setProgressNotes] = useState("");

  const { data: rehabItems, createRehabItem, updateRehabItem } = useRehabItems(selectedDealId || null);
  const { data: draws, createDraw, updateDraw } = useDraws(selectedDealId || null);

  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null;

  // Add new line item
  async function handleAddItem() {
    if (!selectedDealId || !newItem.description.trim()) return;
    await createRehabItem({
      deal_id: selectedDealId,
      category: newItem.category,
      description: newItem.description.trim(),
      estimated_cost: parseFloat(newItem.estimated_cost) || 0,
      actual_cost: 0,
      contractor: newItem.contractor.trim() || null,
      status: "pending" as const,
    });
    setNewItem(EMPTY_LINE_ITEM);
    setShowAddForm(false);
  }

  // Inline edit save
  async function handleSaveEdit(itemId: string) {
    await updateRehabItem(itemId, {
      actual_cost: parseFloat(editValues.actual_cost) || 0,
      status: editValues.status as RehabItem["status"],
    });
    setEditingItemId(null);
  }

  // Update draw status
  async function handleDrawStatusChange(drawId: string, newStatus: DrawStatus) {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "requested") updates.requested_at = new Date().toISOString();
    if (newStatus === "approved") updates.approved_at = new Date().toISOString();
    if (newStatus === "paid") updates.paid_at = new Date().toISOString();
    await updateDraw(drawId, updates as Partial<Draw>);
  }

  // Initialize draws if none exist for selected deal
  async function initializeDraws() {
    if (!selectedDeal || !selectedDeal.rehab_budget) return;
    const drawAmount = Math.round(selectedDeal.rehab_budget / 3);
    for (const n of [1, 2, 3]) {
      await createDraw({
        deal_id: selectedDeal.id,
        draw_number: n,
        amount: n === 3 ? selectedDeal.rehab_budget! - drawAmount * 2 : drawAmount,
        status: "pending" as DrawStatus,
        description: DRAW_LABELS[n].title,
      });
    }
  }

  // Budget calculations
  const totalEstimated = rehabItems.reduce((sum, item) => sum + item.estimated_cost, 0);
  const totalActual = rehabItems.reduce((sum, item) => sum + item.actual_cost, 0);
  const budget = selectedDeal?.rehab_budget ?? totalEstimated;
  const budgetPercent = budget > 0 ? (totalActual / budget) * 100 : 0;
  const remaining = budget - totalActual;

  function getProgressColor(pct: number) {
    if (pct >= 100) return "bg-red-500";
    if (pct >= 80) return "bg-yellow-500";
    return "bg-green-500";
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Empty state — no deals in rehab
  if (deals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Hammer className="w-7 h-7 text-brand-500" />
          <h1 className="text-2xl font-bold text-dark-200">Rehab Tracker</h1>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-dark-400 gap-3">
          <ClipboardList className="w-16 h-16 text-dark-700" />
          <p className="text-lg font-medium text-dark-300">No properties in rehab</p>
          <p className="text-sm text-dark-500">
            Move a deal to &quot;Under Contract&quot; or &quot;In Rehab&quot; stage to start tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header + Property Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Hammer className="w-7 h-7 text-brand-500" />
          <h1 className="text-2xl font-bold text-dark-200">Rehab Tracker</h1>
        </div>

        <div className="relative sm:ml-auto">
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            className="w-full sm:w-80 appearance-none bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 pr-10 text-dark-200 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          >
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.address}, {deal.city} — {formatCurrency(deal.rehab_budget)} budget
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* Stage badge */}
      {selectedDeal && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              selectedDeal.stage === "in_rehab"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {selectedDeal.stage === "in_rehab" ? "In Rehab" : "Under Contract"}
          </span>
          {selectedDeal.rehab_start_date && (
            <span className="text-dark-500">
              Started {formatDate(selectedDeal.rehab_start_date)}
            </span>
          )}
        </div>
      )}

      {/* Budget Overview Card */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-dark-200">Budget Overview</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-dark-500 uppercase tracking-wide">Total Budget</p>
            <p className="text-xl font-bold text-dark-200">{formatCurrency(budget)}</p>
          </div>
          <div>
            <p className="text-xs text-dark-500 uppercase tracking-wide">Actual Spend</p>
            <p className="text-xl font-bold text-dark-200">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-dark-500 uppercase tracking-wide">Remaining</p>
            <p
              className={`text-xl font-bold ${
                remaining < 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
            <span>Budget utilization</span>
            <span>{budgetPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budgetPercent)}`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
          {budgetPercent > 100 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Over budget by {formatCurrency(Math.abs(remaining))}
            </div>
          )}
        </div>
      </div>

      {/* Budget Line Items Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-dark-200">Budget Line Items</h2>
            <span className="text-xs text-dark-500">({rehabItems.length})</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors"
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Item
              </>
            )}
          </button>
        </div>

        {/* Add new item form */}
        {showAddForm && (
          <div className="mx-5 mb-4 p-4 bg-dark-800 border border-dark-700 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:border-brand-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Estimated Cost</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newItem.estimated_cost}
                  onChange={(e) => setNewItem({ ...newItem, estimated_cost: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="Describe the work..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Contractor</label>
                <input
                  type="text"
                  placeholder="Contractor name"
                  value={newItem.contractor}
                  onChange={(e) => setNewItem({ ...newItem, contractor: e.target.value })}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddItem}
                disabled={!newItem.description.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-dark-700 text-dark-400 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-right px-5 py-3 font-medium">Estimated</th>
                <th className="text-right px-5 py-3 font-medium">Actual</th>
                <th className="text-left px-5 py-3 font-medium">Contractor</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {rehabItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-dark-500">
                    No line items yet. Click &quot;Add Item&quot; to start tracking.
                  </td>
                </tr>
              ) : (
                rehabItems.map((item) => (
                  <tr key={item.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-5 py-3 text-dark-300 font-medium">{item.category}</td>
                    <td className="px-5 py-3 text-dark-400">{item.description ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-dark-300">
                      {formatCurrency(item.estimated_cost)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editingItemId === item.id ? (
                        <input
                          type="number"
                          value={editValues.actual_cost}
                          onChange={(e) =>
                            setEditValues({ ...editValues, actual_cost: e.target.value })
                          }
                          className="w-24 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-dark-200 text-right focus:outline-none focus:border-brand-500"
                        />
                      ) : (
                        <span
                          className={
                            item.actual_cost > item.estimated_cost
                              ? "text-red-400"
                              : "text-dark-300"
                          }
                        >
                          {formatCurrency(item.actual_cost)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-dark-400">{item.contractor ?? "—"}</td>
                    <td className="px-5 py-3">
                      {editingItemId === item.id ? (
                        <select
                          value={editValues.status}
                          onChange={(e) =>
                            setEditValues({ ...editValues, status: e.target.value })
                          }
                          className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-xs text-dark-200 focus:outline-none focus:border-brand-500"
                        >
                          {ITEM_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : item.status === "in_progress"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-dark-700 text-dark-400"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingItemId === item.id ? (
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="text-brand-500 hover:text-brand-400 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditValues({
                              actual_cost: item.actual_cost.toString(),
                              status: item.status,
                            });
                          }}
                          className="text-dark-500 hover:text-dark-300 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rehabItems.length > 0 && (
              <tfoot>
                <tr className="border-t border-dark-700 font-medium">
                  <td className="px-5 py-3 text-dark-300" colSpan={2}>
                    Totals
                  </td>
                  <td className="px-5 py-3 text-right text-dark-200">
                    {formatCurrency(totalEstimated)}
                  </td>
                  <td className="px-5 py-3 text-right text-dark-200">
                    {formatCurrency(totalActual)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Draw Schedule */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-dark-200">Draw Schedule</h2>
          </div>
          {draws.length === 0 && selectedDeal?.rehab_budget && (
            <button
              onClick={initializeDraws}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Initialize Draws
            </button>
          )}
        </div>

        {draws.length === 0 ? (
          <div className="text-center py-8 text-dark-500 text-sm">
            {selectedDeal?.rehab_budget
              ? "No draws created yet. Click \"Initialize Draws\" to set up the 3-draw schedule."
              : "Set a rehab budget on this deal to enable the draw schedule."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {draws.map((draw) => {
              const label = DRAW_LABELS[draw.draw_number] ?? {
                title: `Draw ${draw.draw_number}`,
                description: "",
              };
              const currentIdx = DRAW_STATUS_FLOW.indexOf(draw.status);
              const nextStatus =
                currentIdx < DRAW_STATUS_FLOW.length - 1
                  ? DRAW_STATUS_FLOW[currentIdx + 1]
                  : null;

              return (
                <div
                  key={draw.id}
                  className="bg-dark-800 border border-dark-700 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-dark-200">{label.title}</h3>
                    <p className="text-xs text-dark-500">{label.description}</p>
                  </div>

                  <p className="text-xl font-bold text-dark-200">
                    {formatCurrency(draw.amount)}
                  </p>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${DRAW_STATUS_COLORS[draw.status]}`}
                    >
                      {draw.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-dark-500">
                    {draw.requested_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Requested: {formatDate(draw.requested_at)}
                      </div>
                    )}
                    {draw.approved_at && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved: {formatDate(draw.approved_at)}
                      </div>
                    )}
                    {draw.paid_at && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" />
                        Paid: {formatDate(draw.paid_at)}
                      </div>
                    )}
                  </div>

                  {nextStatus && (
                    <button
                      onClick={() => handleDrawStatusChange(draw.id, nextStatus)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors capitalize"
                    >
                      Mark as {nextStatus}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes / Progress */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-dark-200">Progress Notes</h2>
        </div>
        <textarea
          value={progressNotes}
          onChange={(e) => setProgressNotes(e.target.value)}
          placeholder="Add progress notes, track milestones, or jot down observations... (Photo uploads coming soon)"
          rows={4}
          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:border-brand-500 resize-none transition-colors"
        />
        <p className="mt-2 text-xs text-dark-500">
          Photo documentation support coming soon.
        </p>
      </div>
    </div>
  );
}
