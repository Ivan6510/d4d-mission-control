"use client";

import { useState, useMemo } from "react";
import { createDeal } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/types";
import {
  Calculator,
  DollarSign,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Clock,
  Percent,
} from "lucide-react";

export default function CalculatorPage() {
  const { user } = useAuth();

  const [address, setAddress] = useState("");
  const [arvInput, setArvInput] = useState("");
  const [timeMonths, setTimeMonths] = useState("6");
  const [hmlRate, setHmlRate] = useState("9.25");
  const [pointsPct, setPointsPct] = useState("2");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [rehabCost, setRehabCost] = useState("");
  const [realtorFeePct, setRealtorFeePct] = useState("2.5");
  const [miscHoldPct, setMiscHoldPct] = useState("1");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const numArv = parseFloat(arvInput) || 0;
  const numTime = parseFloat(timeMonths) || 0;
  const numHmlRate = parseFloat(hmlRate) || 0;
  const numPoints = parseFloat(pointsPct) || 0;
  const numPurchase = parseFloat(purchasePrice) || 0;
  const numRehab = parseFloat(rehabCost) || 0;
  const numRealtorPct = parseFloat(realtorFeePct) || 0;
  const numMiscHoldPct = parseFloat(miscHoldPct) || 0;

  const analysis = useMemo(() => {
    const realtorFees = (numRealtorPct / 100) * numArv;
    const interestCost = numPurchase * (numHmlRate / 100) * (numTime / 12);
    const miscHold = (numMiscHoldPct / 100) * numPurchase;
    const closingCosts = 0.01 * numPurchase;
    const transferTaxBuyer = 0.02 * numPurchase;
    const transferTaxSeller = 0.01 * numArv;
    const points = (numPoints / 100) * numPurchase;

    const totalFees = realtorFees + interestCost + miscHold + closingCosts + transferTaxBuyer + transferTaxSeller + points;
    const totalCosts = numPurchase + numRehab + totalFees;
    const netProfit = numArv - totalCosts;
    const kloser25 = netProfit * 0.25;
    const dfdKeeps = netProfit * 0.75;
    const maxOffer = numArv * 0.7 - numRehab;
    const overUnder = numPurchase > 0 ? maxOffer - numPurchase : 0;

    return {
      realtorFees,
      interestCost,
      miscHold,
      closingCosts,
      transferTaxBuyer,
      transferTaxSeller,
      points,
      totalFees,
      totalCosts,
      netProfit,
      kloser25,
      dfdKeeps,
      maxOffer,
      overUnder,
    };
  }, [numArv, numTime, numHmlRate, numPoints, numPurchase, numRehab, numRealtorPct, numMiscHoldPct]);

  const hasInput = numPurchase > 0 && numArv > 0 && numRehab > 0;

  const verdict = useMemo(() => {
    if (!hasInput) return null;
    if (analysis.netProfit >= 20_000) {
      return {
        label: "Strong Deal",
        icon: CheckCircle,
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-500",
      };
    }
    if (analysis.netProfit >= 10_000) {
      return {
        label: "Marginal",
        icon: AlertTriangle,
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-500",
      };
    }
    return {
      label: "Pass",
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-500",
    };
  }, [hasInput, analysis.netProfit]);

  function handleSave() {
    if (!hasInput) return;
    setSaving(true);
    setSaveMessage(null);

    createDeal({
      address: address || "TBD",
      city: "",
      state: "",
      stage: "prospect",
      purchase_price: numPurchase,
      arv: numArv,
      rehab_budget: numRehab,
      expected_profit: analysis.netProfit,
      property_type: "single_family",
      created_by: user?.id ?? null,
      assigned_to: user?.id ?? null,
    });

    setSaveMessage("Deal saved!");
    setPurchasePrice("");
    setArvInput("");
    setRehabCost("");
    setAddress("");
    setSaving(false);
  }

  function handleCurrencyInput(
    value: string,
    setter: (v: string) => void
  ) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setter(cleaned);
  }

  function handlePercentInput(
    value: string,
    setter: (v: string) => void
  ) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setter(cleaned);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-500/10 rounded-lg">
          <Calculator className="w-6 h-6 text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Quick Flip Calculator</h1>
          <p className="text-dark-400 text-sm">D4D deal analysis — exact cost breakdown</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
          Deal Inputs
        </h2>

        <div>
          <label className="block text-sm text-dark-400 mb-1">
            Address <span className="text-dark-500">(optional)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Primary inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">ARV (After Repair Value)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                inputMode="numeric"
                value={arvInput}
                onChange={(e) => handleCurrencyInput(e.target.value, setArvInput)}
                placeholder="350,000"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Purchase Price</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                inputMode="numeric"
                value={purchasePrice}
                onChange={(e) => handleCurrencyInput(e.target.value, setPurchasePrice)}
                placeholder="200,000"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Rehab Cost</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                inputMode="numeric"
                value={rehabCost}
                onChange={(e) => handleCurrencyInput(e.target.value, setRehabCost)}
                placeholder="50,000"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loan & hold time inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              Hold Time (months)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={timeMonths}
              onChange={(e) => handlePercentInput(e.target.value, setTimeMonths)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              <Percent className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              HML Rate (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={hmlRate}
              onChange={(e) => handlePercentInput(e.target.value, setHmlRate)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Points (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={pointsPct}
              onChange={(e) => handlePercentInput(e.target.value, setPointsPct)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Realtor Fee (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={realtorFeePct}
              onChange={(e) => handlePercentInput(e.target.value, setRealtorFeePct)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Misc Hold (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={miscHoldPct}
              onChange={(e) => handlePercentInput(e.target.value, setMiscHoldPct)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2.5 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
          Cost Breakdown
        </h2>

        <div className="space-y-2">
          <CostLine label="Purchase Price" value={numPurchase} />
          <CostLine label="Rehab Cost" value={numRehab} />
          <div className="border-t border-dark-800 pt-2" />
          <CostLine label={`Realtor Fees (${realtorFeePct}% of ARV)`} value={analysis.realtorFees} />
          <CostLine label={`Interest Cost (${hmlRate}% × ${timeMonths}mo)`} value={analysis.interestCost} />
          <CostLine label={`Misc Hold (${miscHoldPct}% of Purchase)`} value={analysis.miscHold} />
          <CostLine label="Closing Costs (1% of Purchase)" value={analysis.closingCosts} />
          <CostLine label="Transfer Tax — Buyer (2% of Purchase)" value={analysis.transferTaxBuyer} />
          <CostLine label="Transfer Tax — Seller (1% of ARV)" value={analysis.transferTaxSeller} />
          <CostLine label={`Points (${pointsPct}% of Purchase)`} value={analysis.points} />
          <div className="border-t border-dark-700 pt-2" />
          <CostLine label="Total Costs" value={analysis.totalCosts} bold />
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
          Profit Analysis
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-lg p-4 border ${
            !hasInput ? "bg-dark-800 border-dark-700" :
            analysis.netProfit >= 20000 ? "bg-green-500/10 border-green-500/30" :
            analysis.netProfit >= 10000 ? "bg-yellow-500/10 border-yellow-500/30" :
            "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="text-xs text-dark-400 mb-1">Net Profit</div>
            <div className={`text-2xl font-bold ${
              !hasInput ? "text-dark-500" :
              analysis.netProfit >= 20000 ? "text-green-400" :
              analysis.netProfit >= 10000 ? "text-yellow-400" :
              "text-red-400"
            }`}>
              {hasInput ? formatCurrency(analysis.netProfit) : "--"}
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
            <div className="text-xs text-dark-400 mb-1">The Kloser (25%)</div>
            <div className={`text-2xl font-bold ${hasInput ? "text-purple-400" : "text-dark-500"}`}>
              {hasInput ? formatCurrency(analysis.kloser25) : "--"}
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
            <div className="text-xs text-dark-400 mb-1">DFD Keeps (75%)</div>
            <div className={`text-2xl font-bold ${hasInput ? "text-blue-400" : "text-dark-500"}`}>
              {hasInput ? formatCurrency(analysis.dfdKeeps) : "--"}
            </div>
          </div>
        </div>

        {/* 70% Rule */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-dark-200">70% Rule Check</span>
          </div>
          <div className="text-lg font-bold text-white">
            Max Offer: {hasInput ? formatCurrency(analysis.maxOffer) : "--"}
          </div>
          {hasInput && numPurchase > 0 && (
            <p
              className={`text-sm mt-1 ${
                analysis.overUnder >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              Purchase is{" "}
              {formatCurrency(Math.abs(analysis.overUnder))}{" "}
              {analysis.overUnder >= 0 ? "below" : "above"} max offer
            </p>
          )}
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <div
          className={`${verdict.bg} border ${verdict.border} rounded-xl p-5 flex items-center gap-4`}
        >
          <verdict.icon className={`w-10 h-10 ${verdict.text} shrink-0`} />
          <div>
            <div className={`text-xl font-bold ${verdict.text}`}>
              {verdict.label}
            </div>
            <p className="text-dark-300 text-sm">
              {analysis.netProfit >= 20_000
                ? `Projected ${formatCurrency(analysis.netProfit)} profit — Kloser: ${formatCurrency(analysis.kloser25)}, DFD: ${formatCurrency(analysis.dfdKeeps)}`
                : analysis.netProfit >= 10_000
                ? `Thin margin at ${formatCurrency(analysis.netProfit)} profit — proceed with caution`
                : `Only ${formatCurrency(analysis.netProfit)} projected profit — not worth the risk`}
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasInput || saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save as Deal"}
        </button>
        {saveMessage && (
          <span
            className={`text-sm ${
              saveMessage.includes("saved") ? "text-green-400" : "text-red-400"
            }`}
          >
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}

function CostLine({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold text-dark-200" : "text-dark-400"}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold text-white" : "text-dark-300"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
