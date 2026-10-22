import React, { useState } from "react";
import { useVault } from "../useVault";
import { Search, AlertOctagon, CheckCircle2, ShieldAlert, KeyRound, ArrowRight, Lock } from "lucide-react";

export function CheckPanel({ onNavigateToDisclosure }) {
  const { checkIdentifier, requestTier2Disclosure, currentPersona } = useVault();
  const [identifierType, setIdentifierType] = useState("BANK");
  const [identifierValue, setIdentifierValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Quick fill samples
  const samples = [
    { label: "Bank A Mule (Critical Pass-Through)", type: "BANK", val: "5512-3490-8812" },
    { label: "Telco Mule (SMS Phishing)", type: "PHONE", val: "+6012-8899-102" },
    { label: "Bank B Mule (ATM Structuring)", type: "BANK", val: "7041-9920-1134" },
    { label: "Clean Account (No hit)", type: "BANK", val: "8888-2211-9900" }
  ];

  async function handleCheck(e) {
    if (e) e.preventDefault();
    if (!identifierValue.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await checkIdentifier(identifierType, identifierValue);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Tier-2 request modal / inline state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [caseRef, setCaseRef] = useState("CAD-2026-NSRC-998");
  const [justification, setJustification] = useState("Urgent investigation into victim loss transfer under Section 133 Financial Services Act exception.");
  const [requestSuccess, setRequestSuccess] = useState(false);

  async function handleCreateRequest() {
    if (!result?.reportId) return;
    try {
      await requestTier2Disclosure(result.reportId, caseRef, justification);
      setRequestSuccess(true);
      setTimeout(() => {
        if (onNavigateToDisclosure) onNavigateToDisclosure();
      }, 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Tier-1 Instant Signal Matching
              </span>
              <span className="text-xs text-slate-400">Zero Plaintext Stored</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Blinded Mule Account Verification
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-institutional lookup without sharing raw customer databases. Identifiers are transformed into ineffable HMAC hashes locally. If a hit exists, only Tier-1 reason codes are revealed.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 w-full md:w-auto">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" /> Tide Ineffable Hash Key
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Key fragments split across ORK nodes
            </div>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Identifier Type
              </label>
              <select
                value={identifierType}
                onChange={(e) => setIdentifierType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="BANK">Bank Account Number</option>
                <option value="PHONE">Mobile / WhatsApp Number</option>
                <option value="IC">National IC / Passport</option>
                <option value="EWALLET">E-Wallet DuitNow ID</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Identifier (Malaysian Synthetic Account)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 5512-3490-8812"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !identifierValue.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? "Hashing..." : "Check"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Fill Sample Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Demo Samples:</span>
            {samples.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIdentifierType(s.type);
                  setIdentifierValue(s.val);
                  setResult(null);
                }}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 hover:border-cyan-500/50 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer"
              >
                {s.label} ({s.val})
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error Card */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 text-sm text-red-300 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card: HIT */}
      {result && result.hit && (
        <div className="bg-slate-900 border-2 border-red-500/60 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500 text-white">
                    SIGNAL HIT
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {result.reportId}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Suspected Mule Account Identified
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-300 uppercase">
                Severity: {result.tier1?.severity}
              </span>
            </div>
          </div>

          {/* Blinded Hash & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                HMAC-SHA256 Match Hash
              </div>
              <div className="font-mono text-xs text-cyan-400 break-all">
                {result.hash}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reporting Consortium Member
              </div>
              <div className="text-sm font-semibold text-white uppercase">
                {result.reportingOrg}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Filed on: {new Date(result.tier1?.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reason Code (Tier-1 Payload)
              </div>
              <div className="text-sm font-bold text-amber-400">
                {result.tier1?.reasonCode}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {result.tier1?.reasonCode === "R01" && "Mule Recruiter / Social Media Syndicate"}
                {result.tier1?.reasonCode === "R02" && "Rapid Pass-Through / High Velocity Mule"}
                {result.tier1?.reasonCode === "R03" && "Layered Cash-Out / Structured Withdrawals"}
                {result.tier1?.reasonCode === "R04" && "Phishing Deposit Hub / Compromised Credentials"}
              </div>
            </div>
          </div>

          {/* Hermetic Evidence Lock Callout */}
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  Detailed Case Evidence is Hermetically Sealed
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Per Financial Services Act 2013 s.133 customer secrecy protections, full bank statements, IP logs, and evidence files cannot be viewed in Tier-1. Access requires a multi-party Tier-2 disclosure approval signed by 2 distinct organizations.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              {showRequestForm ? "Cancel Request" : "Request Tier-2 Evidence"}
            </button>
          </div>

          {/* Tier-2 Request Form */}
          {showRequestForm && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 animate-in fade-in">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Submit Cross-Institutional Disclosure Request</span>
                <span className="text-[11px] font-mono text-cyan-400">
                  (Requester: {currentPersona.name} @ {currentPersona.orgId})
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Formal Investigation / NSRC Case Reference
                  </label>
                  <input
                    type="text"
                    value={caseRef}
                    onChange={(e) => setCaseRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Legal Justification (FSA 2013 Exception)
                  </label>
                  <input
                    type="text"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreateRequest}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Submit Request for Quorum Signing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {requestSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Request registered! Navigating to Tier-2 Quorum Inbox...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Result Card: NO HIT */}
      {result && !result.hit && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            No Suspected Mule Reports Found
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Target identifier matched zero hashes in the shared registry. No banks, telcos, or e-wallets have flagged this account.
          </p>
          <div className="text-[11px] font-mono text-slate-500">
            Searched HMAC: {result.hash}
          </div>
        </div>
      )}
    </div>
  );
}
