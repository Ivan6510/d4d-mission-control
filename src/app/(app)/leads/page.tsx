"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Phone,
  Flame,
  Thermometer,
  Snowflake,
  ArrowRightCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Filter,
} from "lucide-react";
import { getLeads, createLead, updateLead, createDeal } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  Lead,
  LeadScore,
  LeadStatus,
  LEAD_SOURCES,
  formatCurrency,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCORE_CONFIG: Record<LeadScore, { label: string; color: string; bg: string; icon: typeof Flame }> = {
  hot: { label: "Hot", color: "text-orange-400", bg: "bg-orange-500/20", icon: Flame },
  warm: { label: "Warm", color: "text-yellow-400", bg: "bg-yellow-500/20", icon: Thermometer },
  cold: { label: "Cold", color: "text-blue-400", bg: "bg-blue-500/20", icon: Snowflake },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-green-400", bg: "bg-green-500/20" },
  contacted: { label: "Contacted", color: "text-blue-400", bg: "bg-blue-500/20" },
  follow_up: { label: "Follow Up", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  converted: { label: "Converted", color: "text-brand-400", bg: "bg-brand-500/20" },
  dead: { label: "Dead", color: "text-red-400", bg: "bg-red-500/20" },
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "bg-blue-600/20 text-blue-400",
  investor_lift: "bg-purple-500/20 text-purple-400",
  rtk: "bg-cyan-500/20 text-cyan-400",
  cold_call: "bg-green-500/20 text-green-400",
  ppc: "bg-brand-500/20 text-brand-400",
  referral: "bg-pink-500/20 text-pink-400",
  driving: "bg-yellow-500/20 text-yellow-400",
  other: "bg-dark-700/50 text-dark-300",
};

function daysSince(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function sourceLabel(key: string): string {
  return LEAD_SOURCES.find((s) => s.key === key)?.label ?? key;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const { user } = useAuth();

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);

  // Filters
  const [filterSource, setFilterSource] = useState("");
  const [filterScore, setFilterScore] = useState<LeadScore | "">("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Feedback
  const [toast, setToast] = useState<string | null>(null);

  // ------- load from localStorage on mount -------
  useEffect(() => {
    setLeads(getLeads());
  }, []);

  // ------- filtered leads -------
  const filtered = useMemo(() => {
    let result = leads;

    if (filterSource) {
      result = result.filter((l) => l.source === filterSource);
    }
    if (filterScore) {
      result = result.filter((l) => l.score === filterScore);
    }
    if (filterStatus) {
      result = result.filter((l) => l.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.address ?? "").toLowerCase().includes(q) ||
          (l.contact_name ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [leads, filterSource, filterScore, filterStatus, searchQuery]);

  // ------- source attribution stats -------
  const sourceStats = useMemo(() => {
    return LEAD_SOURCES.map((src) => {
      const total = leads.filter((l) => l.source === src.key).length;
      const converted = leads.filter(
        (l) => l.source === src.key && l.status === "converted"
      ).length;
      const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
      return { ...src, total, converted, rate };
    }).filter((s) => s.total > 0);
  }, [leads]);

  // ------- update score -------
  function handleUpdateScore(id: string, score: LeadScore) {
    const updated = updateLead(id, { score });
    if (updated) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? updated : l))
      );
    }
  }

  // ------- convert to deal -------
  function handleConvertToDeal(lead: Lead) {
    const deal = createDeal({
      address: lead.address ?? "Unknown Address",
      city: lead.city ?? "",
      state: lead.state,
      zip: lead.zip,
      stage: "prospect" as const,
      stage_changed_at: new Date().toISOString(),
      purchase_price: lead.asking_price,
      lead_source: lead.source,
      notes: lead.notes,
      created_by: user?.id ?? null,
      property_type: "single_family",
    });

    const updated = updateLead(lead.id, {
      deal_id: deal.id,
      converted_at: new Date().toISOString(),
      status: "converted" as LeadStatus,
    });

    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id ? (updated ?? l) : l
      )
    );

    showToast("Lead converted to deal successfully!");
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  // ------- render -------
  return (
    <div className="min-h-screen bg-dark-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-200 sm:text-3xl">
            Lead Pipeline
          </h1>
          <p className="mt-1 text-dark-400">
            {`${leads.length} total leads`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500/90 hover:shadow-brand-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-dark-200 shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Source Attribution Stats */}
      {sourceStats.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {sourceStats.map((src) => (
            <div
              key={src.key}
              className="rounded-lg border border-dark-700 bg-dark-900 p-3"
            >
              <p className="text-xs font-medium text-dark-400 truncate">
                {src.label}
              </p>
              <p className="mt-1 text-lg font-bold text-dark-200">
                {src.total}
              </p>
              <p className="text-xs text-dark-500">
                {src.rate}% converted
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 rounded-xl border border-dark-700 bg-dark-900 p-4">
        <div className="flex items-center gap-2 mb-3 text-dark-400">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
            <input
              type="text"
              placeholder="Search address or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2 pl-10 pr-4 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Source filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Score filter */}
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value as LeadScore | "")}
            className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Scores</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "")}
            className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lead Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-700 bg-dark-900 py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-dark-600" />
          <p className="text-sm text-dark-400">
            {leads.length === 0 ? "No leads yet" : "No leads match your filters"}
          </p>
          {leads.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-400"
            >
              Add your first lead
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdateScore={handleUpdateScore}
              onConvert={handleConvertToDeal}
            />
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          userId={user?.id ?? null}
          onClose={() => setShowAddModal(false)}
          onCreated={(newLead) => {
            setLeads((prev) => [newLead, ...prev]);
            setShowAddModal(false);
            showToast("Lead added successfully!");
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead Card
// ---------------------------------------------------------------------------

function LeadCard({
  lead,
  onUpdateScore,
  onConvert,
}: {
  lead: Lead;
  onUpdateScore: (id: string, score: LeadScore) => void;
  onConvert: (lead: Lead) => void;
}) {
  const scoreInfo = SCORE_CONFIG[lead.score];
  const statusInfo = STATUS_CONFIG[lead.status];
  const ScoreIcon = scoreInfo.icon;
  const days = daysSince(lead.created_at);
  const isConverted = lead.status === "converted";

  return (
    <div className="rounded-xl border border-dark-700 bg-dark-900 p-4 transition-colors hover:border-dark-600">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: info */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Address + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-dark-200 truncate">
              {lead.address || "No address"}
            </h3>

            {/* Source badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                SOURCE_COLORS[lead.source] ?? SOURCE_COLORS.other
              }`}
            >
              {sourceLabel(lead.source)}
            </span>

            {/* Score badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${scoreInfo.bg} ${scoreInfo.color}`}
            >
              <ScoreIcon className="h-3 w-3" />
              {scoreInfo.label}
            </span>

            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.bg} ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Contact + meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-400">
            {lead.contact_name && (
              <span>{lead.contact_name}</span>
            )}
            {lead.contact_phone && (
              <a
                href={`tel:${lead.contact_phone}`}
                className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-400"
              >
                <Phone className="h-3 w-3" />
                {lead.contact_phone}
              </a>
            )}
            {lead.asking_price != null && (
              <span className="font-medium text-dark-300">
                {formatCurrency(lead.asking_price)}
              </span>
            )}
            <span className="text-dark-500">{days}d ago</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Score quick-set buttons */}
          {(["hot", "warm", "cold"] as LeadScore[]).map((s) => {
            const cfg = SCORE_CONFIG[s];
            const Icon = cfg.icon;
            const active = lead.score === s;
            return (
              <button
                key={s}
                title={`Mark ${cfg.label}`}
                onClick={() => onUpdateScore(lead.id, s)}
                className={`rounded-lg p-2 text-xs transition-colors ${
                  active
                    ? `${cfg.bg} ${cfg.color}`
                    : "bg-dark-800 text-dark-500 hover:text-dark-300 hover:bg-dark-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}

          {/* Call button */}
          {lead.contact_phone && (
            <a
              href={`tel:${lead.contact_phone}`}
              className="rounded-lg bg-dark-800 p-2 text-green-400 transition-colors hover:bg-green-500/20"
              title="Call"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}

          {/* Convert to deal */}
          {!isConverted && (
            <button
              onClick={() => onConvert(lead)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/20 px-3 py-2 text-xs font-medium text-brand-400 transition-colors hover:bg-brand-500/30"
              title="Convert to Deal"
            >
              <ArrowRightCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Convert</span>
            </button>
          )}

          {isConverted && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Converted</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Lead Modal
// ---------------------------------------------------------------------------

function AddLeadModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string | null;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    source: "other",
    asking_price: "",
    notes: "",
    score: "warm" as LeadScore,
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.state.trim()) {
      setFormError("State is required.");
      return;
    }

    const newLead = createLead({
      address: form.address || null,
      city: form.city || null,
      state: form.state.trim(),
      zip: form.zip || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      source: form.source,
      asking_price: form.asking_price ? Number(form.asking_price) : null,
      notes: form.notes || null,
      score: form.score,
      status: "new" as LeadStatus,
      created_by: userId,
      assigned_to: userId,
    });

    onCreated(newLead);
  }

  const inputCls =
    "w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
  const labelCls = "block text-xs font-medium text-dark-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 sm:pt-24">
      <div className="w-full max-w-lg rounded-xl border border-dark-700 bg-dark-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-700 px-5 py-4">
          <h2 className="text-lg font-semibold text-dark-200">Add New Lead</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {/* Address */}
          <div>
            <label className={labelCls}>Address</label>
            <input
              type="text"
              placeholder="123 Main St"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* City / State / Zip */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input
                type="text"
                placeholder="Atlanta"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="GA"
                maxLength={2}
                value={form.state}
                onChange={(e) => updateField("state", e.target.value.toUpperCase())}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Zip</label>
              <input
                type="text"
                placeholder="30301"
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Contact Name / Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Contact Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={form.contact_phone}
                onChange={(e) => updateField("contact_phone", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={form.contact_email}
              onChange={(e) => updateField("contact_email", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Source / Asking Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Source</label>
              <select
                value={form.source}
                onChange={(e) => updateField("source", e.target.value)}
                className={inputCls}
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Asking Price</label>
              <input
                type="number"
                placeholder="150000"
                value={form.asking_price}
                onChange={(e) => updateField("asking_price", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Score selector */}
          <div>
            <label className={labelCls}>Lead Score</label>
            <div className="flex gap-2">
              {(["hot", "warm", "cold"] as LeadScore[]).map((s) => {
                const cfg = SCORE_CONFIG[s];
                const Icon = cfg.icon;
                const active = form.score === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, score: s }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? `${cfg.bg} ${cfg.color} border-transparent`
                        : "border-dark-700 bg-dark-800 text-dark-400 hover:text-dark-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={3}
              placeholder="Additional details..."
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm font-medium text-dark-300 transition-colors hover:bg-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500/90"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
