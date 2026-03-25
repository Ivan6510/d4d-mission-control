"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Plus,
  X,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  GripVertical,
  Save,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { useDeals, createActivity } from "@/lib/useStore";
import { useAuth } from "@/lib/auth";
import type { Deal, DealStage } from "@/lib/types";
import {
  DEAL_STAGES,
  LEAD_SOURCES,
  formatCurrency,
  daysInStage,
  getStageLabel,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function profitColor(profit: number | null | undefined): string {
  if (profit == null) return "text-dark-400";
  if (profit >= 20000) return "text-green-400";
  if (profit >= 10000) return "text-yellow-400";
  return "text-red-400";
}

function stageColorBorder(color: string): string {
  // Convert bg-X-500 to border-X-500
  return color.replace("bg-", "border-");
}

const EMPTY_FORM: AddDealForm = {
  address: "",
  city: "",
  state: "",
  zip: "",
  purchase_price: "",
  arv: "",
  rehab_budget: "",
  lead_source: "",
  notes: "",
};

interface AddDealForm {
  address: string;
  city: string;
  state: string;
  zip: string;
  purchase_price: string;
  arv: string;
  rehab_budget: string;
  lead_source: string;
  notes: string;
}

interface StageHistoryEntry {
  stage: DealStage;
  changed_at: string;
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function DealsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: fetchedDeals, loading, refetch: refetchDeals, createDeal, updateDeal } = useDeals();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync from hook
  useEffect(() => {
    setDeals(fetchedDeals);
  }, [fetchedDeals]);
  const [mounted, setMounted] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form
  const [form, setForm] = useState<AddDealForm>({ ...EMPTY_FORM });

  // Detail editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);

  // -----------------------------------------------------------------------
  // Mount check for DnD (needs DOM)
  // -----------------------------------------------------------------------
  useEffect(() => {
    setMounted(true);
  }, []);

  // -----------------------------------------------------------------------
  // Check URL for ?add=true
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setAddModalOpen(true);
    }
  }, [searchParams]);

  // -----------------------------------------------------------------------
  // Group deals by stage
  // -----------------------------------------------------------------------
  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      lead: [],
      prospect: [],
      under_contract: [],
      in_rehab: [],
      listed: [],
      sold: [],
      dead: [],
    };
    for (const deal of deals) {
      if (map[deal.stage]) {
        map[deal.stage].push(deal);
      }
    }
    return map;
  }, [deals]);

  // -----------------------------------------------------------------------
  // Drag & drop handler
  // -----------------------------------------------------------------------
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      const newStage = destination.droppableId as DealStage;
      const dealId = draggableId;

      // Optimistic update
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStage, stage_changed_at: new Date().toISOString() } : d))
      );

      const updated = await updateDeal(dealId, {
        stage: newStage,
        stage_changed_at: new Date().toISOString(),
      });

      if (updated) {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? updated : d))
        );

        // Log activity
        if (user) {
          createActivity({
            user_id: user.id,
            user_name: user.name,
            action: `Moved deal to ${getStageLabel(newStage)}`,
            entity_type: "deal",
            entity_id: dealId,
          });
        }
      }
    },
    [user, updateDeal]
  );

  // -----------------------------------------------------------------------
  // Add deal
  // -----------------------------------------------------------------------
  const calcExpectedProfit = useCallback(() => {
    const arv = parseFloat(form.arv) || 0;
    const purchase = parseFloat(form.purchase_price) || 0;
    const rehab = parseFloat(form.rehab_budget) || 0;
    if (arv === 0) return null;
    return Math.round(arv - purchase - rehab - arv * 0.13);
  }, [form.arv, form.purchase_price, form.rehab_budget]);

  const expectedProfit = calcExpectedProfit();

  const handleAddDeal = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.address.trim() || !form.city.trim() || !form.state.trim()) return;

      setSaving(true);

      const now = new Date().toISOString();
      const newDeal = await createDeal({
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        zip: form.zip.trim() || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        arv: form.arv ? parseFloat(form.arv) : null,
        rehab_budget: form.rehab_budget ? parseFloat(form.rehab_budget) : null,
        expected_profit: expectedProfit,
        lead_source: form.lead_source || null,
        notes: form.notes.trim() || null,
        stage: "lead" as DealStage,
        stage_changed_at: now,
        property_type: "single_family",
        created_by: user?.id ?? null,
      });

      // Log activity
      if (user) {
        createActivity({
          user_id: user.id,
          user_name: user.name,
          action: `Added deal: ${form.address}`,
          entity_type: "deal",
          entity_id: newDeal.id,
        });
      }

      setDeals((prev) => [newDeal, ...prev]);
      setForm({ ...EMPTY_FORM });
      setAddModalOpen(false);
      // Remove ?add=true from URL
      if (searchParams.get("add") === "true") {
        router.replace("/deals");
      }
      setSaving(false);
    },
    [form, expectedProfit, user, searchParams, router, createDeal]
  );

  // -----------------------------------------------------------------------
  // Deal detail
  // -----------------------------------------------------------------------
  const openDetail = useCallback(
    (deal: Deal) => {
      setDetailDeal(deal);
      setEditingField(null);

      // Build pseudo-history from the deal data
      const history: StageHistoryEntry[] = [];
      if (deal.created_at) history.push({ stage: "lead", changed_at: deal.created_at });
      if (deal.offer_date)
        history.push({ stage: "prospect", changed_at: deal.offer_date });
      if (deal.contract_date)
        history.push({ stage: "under_contract", changed_at: deal.contract_date });
      if (deal.rehab_start_date)
        history.push({ stage: "in_rehab", changed_at: deal.rehab_start_date });
      if (deal.list_date) history.push({ stage: "listed", changed_at: deal.list_date });
      if (deal.sold_date) history.push({ stage: "sold", changed_at: deal.sold_date });
      setStageHistory(history);
    },
    []
  );

  const saveField = useCallback(
    async (field: string, value: string) => {
      if (!detailDeal) return;
      setSaving(true);

      const numericFields = [
        "purchase_price",
        "arv",
        "rehab_budget",
        "rehab_actual",
        "holding_costs",
        "closing_costs",
        "sale_price",
        "expected_profit",
        "actual_profit",
        "beds",
        "baths",
        "sqft",
        "year_built",
      ];
      const parsed = numericFields.includes(field)
        ? value
          ? parseFloat(value)
          : null
        : value || null;

      const updated = await updateDeal(detailDeal.id, { [field]: parsed });

      if (updated) {
        setDetailDeal(updated);
        setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setEditingField(null);
      }

      setSaving(false);
    },
    [detailDeal, updateDeal]
  );

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderDealCard = (deal: Deal, index: number) => {
    const days = daysInStage(deal.stage_changed_at);
    return (
      <Draggable key={deal.id} draggableId={deal.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`bg-dark-800 rounded-lg border border-dark-700 p-3 mb-2 cursor-pointer
              transition-all hover:border-dark-500
              ${snapshot.isDragging ? "shadow-xl shadow-black/40 rotate-1 scale-105" : ""}`}
            onClick={() => openDetail(deal)}
          >
            <div className="flex items-start gap-2">
              <div
                {...provided.dragHandleProps}
                className="mt-1 text-dark-500 hover:text-dark-300 shrink-0"
              >
                <GripVertical size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-200 text-sm truncate">
                  {deal.address}
                </p>
                <p className="text-xs text-dark-400 truncate">
                  {deal.city}, {deal.state}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-dark-300">
                    {formatCurrency(deal.purchase_price)}
                  </span>
                  <ChevronRight size={10} className="text-dark-500" />
                  <span className="text-dark-300">{formatCurrency(deal.arv)}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs font-medium ${profitColor(deal.expected_profit)}`}>
                    {deal.expected_profit != null
                      ? `${formatCurrency(deal.expected_profit)} profit`
                      : "No estimate"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      days > 30
                        ? "bg-red-500/10 text-red-400"
                        : days > 14
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-dark-700 text-dark-400"
                    }`}
                  >
                    {days}d
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderColumn = (stageInfo: (typeof DEAL_STAGES)[number]) => {
    const stageDeals = dealsByStage[stageInfo.key];
    return (
      <div
        key={stageInfo.key}
        className="flex-shrink-0 w-72 md:w-64 lg:w-72 flex flex-col max-h-full"
      >
        {/* Column header */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-t-lg border-t-2 ${stageColorBorder(
            stageInfo.color
          )} bg-dark-900`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stageInfo.color}`} />
            <span className="text-sm font-medium text-dark-200">{stageInfo.label}</span>
          </div>
          <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
            {stageDeals.length}
          </span>
        </div>

        {/* Droppable area */}
        <Droppable droppableId={stageInfo.key}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-2 rounded-b-lg min-h-[120px] overflow-y-auto transition-colors ${
                snapshot.isDraggingOver
                  ? "bg-dark-800/80 ring-1 ring-brand-500/30"
                  : "bg-dark-900/50"
              }`}
            >
              {stageDeals.map((deal, index) => renderDealCard(deal, index))}
              {provided.placeholder}
              {stageDeals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-dark-500">No deals</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Detail modal editable row
  // -----------------------------------------------------------------------
  const renderDetailRow = (
    label: string,
    field: string,
    value: string | number | null | undefined,
    type: "text" | "number" | "date" = "text"
  ) => {
    const isEditing = editingField === field;
    const displayVal =
      type === "number" && typeof value === "number"
        ? formatCurrency(value)
        : value ?? "\u2014";

    return (
      <div
        key={field}
        className="flex items-center justify-between py-2 border-b border-dark-800 group"
      >
        <span className="text-xs text-dark-400 w-32 shrink-0">{label}</span>
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 justify-end">
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-dark-200 w-full max-w-[180px] text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveField(field, editValue);
                if (e.key === "Escape") setEditingField(null);
              }}
            />
            <button
              onClick={() => saveField(field, editValue)}
              className="p-1 text-brand-500 hover:text-brand-400"
              disabled={saving}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            </button>
          </div>
        ) : (
          <span
            className="text-sm text-dark-200 cursor-pointer hover:text-brand-400 transition-colors text-right flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setEditingField(field);
              setEditValue(
                value != null ? String(type === "number" ? value : value) : ""
              );
            }}
          >
            {displayVal}
          </span>
        )}
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Loading / error states
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <div className="h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-200">Deal Pipeline</h1>
          <p className="text-sm text-dark-400 mt-0.5">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} across{" "}
            {DEAL_STAGES.filter((s) => dealsByStage[s.key].length > 0).length} stages
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Deal</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              refetchDeals();
            }}
            className="ml-auto text-xs text-red-400 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban board */}
      {mounted ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Desktop: horizontal scroll */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-4 -mx-2 px-2" style={{ height: "calc(100vh - 180px)" }}>
            {DEAL_STAGES.map((stage) => renderColumn(stage))}
          </div>

          {/* Mobile: vertical stacked list */}
          <div className="md:hidden space-y-4">
            {DEAL_STAGES.map((stageInfo) => {
              const stageDeals = dealsByStage[stageInfo.key];
              if (stageDeals.length === 0) return null;
              return (
                <div key={stageInfo.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${stageInfo.color}`} />
                    <span className="text-sm font-medium text-dark-200">
                      {stageInfo.label}
                    </span>
                    <span className="text-xs text-dark-500">({stageDeals.length})</span>
                  </div>
                  <Droppable droppableId={stageInfo.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-lg p-2 min-h-[60px] transition-colors ${
                          snapshot.isDraggingOver
                            ? "bg-dark-800/80 ring-1 ring-brand-500/30"
                            : "bg-dark-900/50"
                        }`}
                      >
                        {stageDeals.map((deal, index) => renderDealCard(deal, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Mobile empty state */}
            {deals.length === 0 && (
              <div className="text-center py-16">
                <Home size={40} className="mx-auto text-dark-600 mb-3" />
                <p className="text-dark-400 text-sm">No deals yet</p>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="mt-3 text-brand-500 text-sm underline hover:text-brand-400"
                >
                  Add your first deal
                </button>
              </div>
            )}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      )}

      {/* Desktop empty state */}
      {mounted && deals.length === 0 && (
        <div className="hidden md:flex flex-col items-center justify-center py-16">
          <Home size={48} className="text-dark-600 mb-3" />
          <p className="text-dark-400">No deals in the pipeline yet</p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="mt-3 text-brand-500 text-sm underline hover:text-brand-400"
          >
            Add your first deal
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* ADD DEAL MODAL                                                    */}
      {/* ================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setAddModalOpen(false);
              if (searchParams.get("add") === "true") router.replace("/deals");
            }}
          />
          <div className="relative bg-dark-900 border border-dark-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-dark-200">Add New Deal</h2>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  if (searchParams.get("add") === "true") router.replace("/deals");
                }}
                className="text-dark-400 hover:text-dark-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDeal} className="p-5 space-y-4">
              {/* Address */}
              <div>
                <label className="block text-xs text-dark-400 mb-1">
                  Street Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              {/* City / State / Zip row */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Austin"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-dark-400 mb-1">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value.toUpperCase() })
                    }
                    placeholder="TX"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Zip</label>
                  <input
                    type="text"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    placeholder="78701"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Financial fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Purchase Price</label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-500"
                    />
                    <input
                      type="number"
                      value={form.purchase_price}
                      onChange={(e) =>
                        setForm({ ...form, purchase_price: e.target.value })
                      }
                      placeholder="0"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-7 pr-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">ARV</label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-500"
                    />
                    <input
                      type="number"
                      value={form.arv}
                      onChange={(e) => setForm({ ...form, arv: e.target.value })}
                      placeholder="0"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-7 pr-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Rehab Budget</label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-500"
                    />
                    <input
                      type="number"
                      value={form.rehab_budget}
                      onChange={(e) =>
                        setForm({ ...form, rehab_budget: e.target.value })
                      }
                      placeholder="0"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-7 pr-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-calc profit display */}
              {expectedProfit !== null && (
                <div className="bg-dark-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-dark-400">
                    Expected Profit (ARV - Purchase - Rehab - 13% costs)
                  </span>
                  <span
                    className={`text-sm font-semibold ${profitColor(expectedProfit)}`}
                  >
                    {formatCurrency(expectedProfit)}
                  </span>
                </div>
              )}

              {/* Lead source */}
              <div>
                <label className="block text-xs text-dark-400 mb-1">Lead Source</label>
                <select
                  value={form.lead_source}
                  onChange={(e) => setForm({ ...form, lead_source: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Select source...</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-dark-400 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this deal..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    if (searchParams.get("add") === "true") router.replace("/deals");
                  }}
                  className="px-4 py-2 text-sm text-dark-400 hover:text-dark-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DEAL DETAIL MODAL                                                 */}
      {/* ================================================================= */}
      {detailDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDetailDeal(null)}
          />
          <div className="relative bg-dark-900 border border-dark-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-dark-700">
              <div>
                <h2 className="text-lg font-semibold text-dark-200">
                  {detailDeal.address}
                </h2>
                <p className="text-sm text-dark-400">
                  {detailDeal.city}, {detailDeal.state}{" "}
                  {detailDeal.zip ?? ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    DEAL_STAGES.find((s) => s.key === detailDeal.stage)?.color ??
                    "bg-dark-700"
                  } text-white`}
                >
                  {getStageLabel(detailDeal.stage)}
                </span>
                <button
                  onClick={() => setDetailDeal(null)}
                  className="text-dark-400 hover:text-dark-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Financial summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Purchase", value: detailDeal.purchase_price, icon: DollarSign },
                  { label: "ARV", value: detailDeal.arv, icon: TrendingUp },
                  { label: "Rehab Budget", value: detailDeal.rehab_budget, icon: FileText },
                  {
                    label: "Expected Profit",
                    value: detailDeal.expected_profit,
                    icon: TrendingUp,
                    color: profitColor(detailDeal.expected_profit),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-dark-800 rounded-lg p-3 text-center"
                  >
                    <item.icon
                      size={16}
                      className={`mx-auto mb-1 ${item.color ?? "text-dark-500"}`}
                    />
                    <p
                      className={`text-sm font-semibold ${
                        item.color ?? "text-dark-200"
                      }`}
                    >
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-[10px] text-dark-500">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Editable fields */}
              <div>
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                  Deal Details
                </h3>
                <div className="bg-dark-800/50 rounded-lg px-4 py-1">
                  {renderDetailRow("Address", "address", detailDeal.address)}
                  {renderDetailRow("City", "city", detailDeal.city)}
                  {renderDetailRow("State", "state", detailDeal.state)}
                  {renderDetailRow("Zip", "zip", detailDeal.zip)}
                  {renderDetailRow("Purchase Price", "purchase_price", detailDeal.purchase_price, "number")}
                  {renderDetailRow("ARV", "arv", detailDeal.arv, "number")}
                  {renderDetailRow("Rehab Budget", "rehab_budget", detailDeal.rehab_budget, "number")}
                  {renderDetailRow("Rehab Actual", "rehab_actual", detailDeal.rehab_actual, "number")}
                  {renderDetailRow("Holding Costs", "holding_costs", detailDeal.holding_costs, "number")}
                  {renderDetailRow("Closing Costs", "closing_costs", detailDeal.closing_costs, "number")}
                  {renderDetailRow("Sale Price", "sale_price", detailDeal.sale_price, "number")}
                  {renderDetailRow("Expected Profit", "expected_profit", detailDeal.expected_profit, "number")}
                  {renderDetailRow("Actual Profit", "actual_profit", detailDeal.actual_profit, "number")}
                  {renderDetailRow("Lead Source", "lead_source", detailDeal.lead_source)}
                  {renderDetailRow("Property Type", "property_type", detailDeal.property_type)}
                  {renderDetailRow("Beds", "beds", detailDeal.beds, "number")}
                  {renderDetailRow("Baths", "baths", detailDeal.baths, "number")}
                  {renderDetailRow("Sqft", "sqft", detailDeal.sqft, "number")}
                  {renderDetailRow("Year Built", "year_built", detailDeal.year_built, "number")}
                  {renderDetailRow("Notes", "notes", detailDeal.notes)}
                </div>
              </div>

              {/* Key dates */}
              <div>
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                  Key Dates
                </h3>
                <div className="bg-dark-800/50 rounded-lg px-4 py-1">
                  {renderDetailRow("Offer Date", "offer_date", detailDeal.offer_date, "date")}
                  {renderDetailRow("Contract Date", "contract_date", detailDeal.contract_date, "date")}
                  {renderDetailRow("Closing Date", "closing_date", detailDeal.closing_date, "date")}
                  {renderDetailRow("Rehab Start", "rehab_start_date", detailDeal.rehab_start_date, "date")}
                  {renderDetailRow("Rehab End", "rehab_end_date", detailDeal.rehab_end_date, "date")}
                  {renderDetailRow("List Date", "list_date", detailDeal.list_date, "date")}
                  {renderDetailRow("Sold Date", "sold_date", detailDeal.sold_date, "date")}
                </div>
              </div>

              {/* Stage history */}
              <div>
                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                  Stage History
                </h3>
                {stageHistory.length > 0 ? (
                  <div className="relative pl-4">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-dark-700" />
                    {stageHistory.map((entry, i) => {
                      const info = DEAL_STAGES.find((s) => s.key === entry.stage);
                      return (
                        <div key={i} className="relative flex items-center gap-3 py-2">
                          <div
                            className={`w-3 h-3 rounded-full border-2 border-dark-900 ${
                              info?.color ?? "bg-dark-600"
                            } -ml-[10px] z-10`}
                          />
                          <span className="text-sm text-dark-200">
                            {info?.label ?? entry.stage}
                          </span>
                          <span className="text-xs text-dark-500 ml-auto">
                            {new Date(entry.changed_at).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-dark-500">No history available</p>
                )}
              </div>

              {/* Days in current stage */}
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <Clock size={12} />
                <span>
                  {daysInStage(detailDeal.stage_changed_at)} days in{" "}
                  {getStageLabel(detailDeal.stage)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
