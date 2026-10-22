import React, { useState } from "react";
import { useVault } from "../useVault";
import { SYSTEM_CONFIG } from "../config";
import { ShieldCheck, Lock, Send, CheckCircle2, AlertOctagon, KeyRound } from "lucide-react";

export function ReportPanel({ onReportSubmitted }) {
  const { fileReport, currentPersona } = useVault();
  const [identifierType, setIdentifierType] = useState("BANK");
  const [rawIdentifier, setRawIdentifier] = useState("");
  const [reasonCode, setReasonCode] = useState("R02");
  const [severity, setSeverity] = useState("CRITICAL");
  const [evidenceText, setEvidenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Check if current persona has permission to file reports
  const canFile = currentPersona.tideRoles.includes("_tide_evidence.selfencrypt");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawIdentifier.trim() || !evidenceText.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await fileReport({
        identifierType,
        rawIdentifier,
        reasonCode,
        severity,
        evidenceText
      });

      setSuccess(true);
      setRawIdentifier("");
      setEvidenceText("");

      if (onReportSubmitted) {
        setTimeout(() => onReportSubmitted(), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                End-to-End Encrypted Submission
              </span>
              <span className="text-xs text-slate-400">Zero Host Exposure</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              File Encrypted Mule Intelligence Report
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Identifiers are HMAC-hashed and evidence is encrypted inside the browser with TideCloak tags <code className="text-cyan-400 font-mono">[tier1, evidence]</code>. The cloud platform receives only ciphertext.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Reporting as: {currentPersona.name}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Organization: {currentPersona.orgId.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Role Check Warning */}
      {!canFile && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-5 text-sm text-amber-300 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-200">
              Role Limitation: Missing '_tide_evidence.selfencrypt'
            </h4>
            <p className="text-xs text-amber-300/80 mt-1">
              Your persona (<strong>{currentPersona.name}</strong>, Role: {currentPersona.role}) is designated as an approver/operator and does not hold analyst reporting permissions. Switch persona to <strong>Alice Tan (Bank A)</strong> or <strong>Ben Lee (Bank B)</strong> in the top header to file reports.
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Identifier Type
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Suspect Identifier
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5512-3490-8812 or +6012-345-6789"
                value={rawIdentifier}
                onChange={(e) => setRawIdentifier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-4 py-2.5 font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Never sent as plaintext. Converted to HMAC-SHA256 via ineffable key prior to transmission.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Mule Activity Classification (Reason Code)
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                {SYSTEM_CONFIG.REASON_CODES.map(rc => (
                  <option key={rc.code} value={rc.code}>
                    {rc.code} — {rc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical / Immediate Disruption</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                Detailed Investigation Evidence & Audit Narrative
              </label>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Encrypted with Tide Tag: 'evidence'
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Provide transaction hashes, victim details, IP addresses, Telegram handles, and money flow routing..."
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Cryptographic Pipeline Indicator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Client-Side Sealing Pipeline
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500">Tier-1 Metadata: </span>
                <span className="text-cyan-300">doEncrypt(tags: ['tier1'])</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500">Case Evidence: </span>
                <span className="text-indigo-300">doEncrypt(tags: ['evidence'])</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Report encrypted and published to consortium ledger successfully!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !canFile || !rawIdentifier.trim() || !evidenceText.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Encrypting in Web Enclave..." : "Encrypt & File Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
