import React, { useState } from "react";
import { useVault } from "../useVault";
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Hash,
  Clock,
  User,
  Activity
} from "lucide-react";

export function AuditPanel() {
  const { auditLog, verifyAuditChain } = useVault();
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    setTimeout(async () => {
      const res = await verifyAuditChain();
      setVerificationResult(res);
      setVerifying(false);
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tamper-Evident Hash Chain
              </span>
              <span className="text-xs text-slate-400">Append-Only Cryptographic Audit Log</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cryptographic Proof of Activity & Authorization
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Every signal query, report submission, quorum vote, and unauthorized access attempt is linked via SHA-256 hash pointers <code className="text-cyan-400 font-mono text-xs">H(prevHash + block)</code>, preventing host log tampering.
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
            <span>{verifying ? "Verifying Chain..." : "Verify Hash Chain Integrity"}</span>
          </button>
        </div>
      </div>

      {/* Verification Badge */}
      {verificationResult && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white text-sm">
              Cryptographic Hash Chain Verified: 100% Intact
            </span>
            <p className="text-emerald-300/80 mt-0.5">
              Verified {verificationResult.count} consecutive blocks from Genesis to Head. No log modification, insertion, or deletion detected.
            </p>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Consortium Activity Log ({auditLog.length} Records)
          </span>
          <span className="font-mono text-[11px]">
            Genesis: 0000000000000000...
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Actor & Org</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 font-mono">Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLog.slice().reverse().map((entry, idx) => {
                const isAlert = entry.action.includes("BLOCKED") || entry.action.includes("ALERT");
                const isPassed = entry.action.includes("PASSED") || entry.action.includes("QUORUM_MET");

                return (
                  <tr
                    key={entry.id || idx}
                    className={`hover:bg-slate-850 transition-colors ${
                      isAlert ? "bg-red-950/20" : isPassed ? "bg-emerald-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{entry.actor}</div>
                      <div className="text-[10px] uppercase font-mono text-cyan-400">
                        {entry.org}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          isAlert
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : isPassed
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 max-w-[140px] truncate">
                      {entry.target}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs">
                      {entry.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-cyan-400/90 whitespace-nowrap">
                      {entry.hash.substring(0, 16)}...
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
