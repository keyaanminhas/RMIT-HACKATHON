import React, { useState } from "react";
import { useVault } from "../useVault";
import { SYSTEM_CONFIG } from "../config";
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  UserX,
  XCircle
} from "lucide-react";

export function DisclosurePanel() {
  const {
    requests,
    approveTier2Disclosure,
    decryptEvidence,
    currentPersona,
    clock
  } = useVault();

  const [decryptedCache, setDecryptedCache] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  async function handleApprove(requestId) {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await approveTier2Disclosure(requestId);
      setSuccessMsg(`Quorum signature recorded for ${currentPersona.orgId.toUpperCase()}!`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleDecrypt(requestId) {
    setErrorMsg(null);
    try {
      const plaintext = await decryptEvidence(requestId);
      setDecryptedCache(prev => ({ ...prev, [requestId]: plaintext }));
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tier-2 Cross-Institutional Disclosure
              </span>
              <span className="text-xs text-slate-400">M-of-N Distributed Authority</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Quorum-Gated Evidence Release & Ephemeral Leases
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Evidence is never released on unilateral authority. Access requires cryptographic approvals from <strong>2 distinct member organizations</strong>. Requesters cannot approve their own cases.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Forseti Rules Engine
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Threshold: 2 of 3 Orgs • 90s Ephemeral TTL
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-800/80 rounded-2xl p-4 text-sm text-red-200 flex items-start gap-3 animate-in fade-in">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Authorization Blocked</span>
            <p className="text-xs text-red-300">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-2xl p-4 text-sm text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Active Disclosure Requests</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Run a Tier-1 check in the <strong>Check Signal</strong> tab and click "Request Tier-2 Evidence" to generate a disclosure request for quorum voting.
            </p>
          </div>
        ) : (
          requests.map(req => {
            const hasSigned = req.approvals.some(a => a.orgId === currentPersona.orgId);
            const isRequester = req.requesterId === currentPersona.id || req.requesterOrg === currentPersona.orgId;
            const isOfficer = currentPersona.role === "officer";

            // Time calculation
            const timeLeft = req.expiresAt ? Math.max(0, Math.floor((req.expiresAt - clock) / 1000)) : null;
            const isExpired = req.expiresAt && timeLeft === 0;

            return (
              <div
                key={req.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {req.id}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs font-semibold text-slate-300">
                        Target: {req.reportId} (Reported by {req.reportingOrg.toUpperCase()})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      Case Reference: {req.caseRef}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === "PENDING" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Quorum Pending ({req.approvals.length}/{SYSTEM_CONFIG.QUORUM_THRESHOLD})
                      </span>
                    )}
                    {req.status === "APPROVED" && !isExpired && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lease Active ({timeLeft}s left)
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Lease Expired (410 Gone)
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="text-slate-400 font-medium">Requester Details</div>
                    <div className="text-white font-semibold flex items-center gap-2">
                      <span>{req.requesterName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {req.requesterOrg}
                      </span>
                    </div>
                    <div className="text-slate-400 pt-1">
                      <span className="font-semibold text-slate-300">Legal Justification: </span>
                      {req.justification}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-slate-400 font-medium">
                      <span>Quorum Signatures</span>
                      <span className="font-mono text-cyan-400">
                        Threshold: {SYSTEM_CONFIG.QUORUM_THRESHOLD} distinct orgs
                      </span>
                    </div>
                    {req.approvals.length === 0 ? (
                      <div className="text-slate-500 italic text-[11px] pt-1">
                        Awaiting compliance officer signatures...
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        {req.approvals.map((appr, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px]"
                          >
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {appr.officerName}
                            </span>
                            <span className="text-slate-400 font-mono uppercase">
                              {appr.orgId}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    {isRequester ? (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> You filed this request. Self-approval is forbidden by policy.
                      </span>
                    ) : hasSigned ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ Your organization has already signed this quorum.
                      </span>
                    ) : isOfficer ? (
                      <span className="text-cyan-400 font-medium">
                        You can sign as compliance officer for {currentPersona.orgId.toUpperCase()}.
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Only officers can approve. (Switch to Olivia or Tom to sign).
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sign Button */}
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          isRequester
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                            : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950"
                        }`}
                      >
                        {isRequester ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Attempt Self-Approval (Demo Failure)</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Sign Quorum as {currentPersona.name}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Decrypt Button */}
                    {req.status === "APPROVED" && !isExpired && (
                      <button
                        onClick={() => handleDecrypt(req.id)}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Decrypt Evidence in Web Enclave</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Decrypted Plaintext Reveal */}
                {decryptedCache[req.id] && !isExpired && (
                  <div className="bg-emerald-950/30 border-2 border-emerald-500/50 rounded-xl p-5 space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Unlock className="w-4 h-4" /> Decrypted Case Evidence (Tide Tag: 'evidence')
                      </span>
                      <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-700">
                        Ephemeral Key Destructs in: {timeLeft}s
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-3.5 rounded-lg border border-emerald-900/50 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                      {decryptedCache[req.id]}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
