import React, { useState } from "react";
import { useVault } from "../useVault";
import {
  Skull,
  Database,
  ShieldOff,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  Terminal,
  FileCode2,
  RefreshCw
} from "lucide-react";

export function OperatorBreachPanel() {
  const { dumpOperatorDatabase, operatorAttemptSelfGrant, currentPersona } = useVault();
  const [dbDump, setDbDump] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [isDumping, setIsDumping] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);

  function handleDump() {
    setIsDumping(true);
    setTimeout(() => {
      const data = dumpOperatorDatabase();
      setDbDump(data);
      setIsDumping(false);
    }, 400);
  }

  async function handleAttack() {
    setIsAttacking(true);
    setTimeout(async () => {
      const res = await operatorAttemptSelfGrant();
      setAttackResult(res);
      setIsAttacking(false);
    }, 600);
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-red-950/70 border border-red-900/60 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                Breach Theatre • The Swap Test
              </span>
              <span className="text-xs text-slate-400">Host Compromise Simulation</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-400" />
              <span>Adversarial Host Operator Perspective</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Demonstrating the core premise of UNLOCKED: Even if the hosting cloud server, database admin, or rogue insider turns completely malicious, TideCloak prevents unilateral breach or privilege escalation.
            </p>
          </div>
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-red-900/60 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-red-400 flex items-center gap-1.5">
              <ShieldOff className="w-4 h-4" /> Zero Host Trust
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              The Swap Test: Why Centralized IdPs Fail
            </div>
          </div>
        </div>
      </div>

      {/* The Two Attack Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attack 1: Dump Raw DB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Attack 1: Exfiltrate Database / Storage Dump</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In a conventional system, the cloud operator or a SQL-injection hacker extracts the central database and decrypts PII using server keys stored in environment variables.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
              Target: <code className="text-cyan-400">SELECT * FROM reports</code>
            </div>
          </div>

          <button
            onClick={handleDump}
            disabled={isDumping}
            className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>{isDumping ? "Dumping Host Tables..." : "Dump Host Database (Expose Zero PII)"}</span>
          </button>
        </div>

        {/* Attack 2: Admin Self-Grant */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldOff className="w-4 h-4 text-red-400" />
              <span>Attack 2: Rogue Admin Self-Grant Privilege</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The host admin tries to grant their own account the <code className="text-red-400 font-mono text-[11px]">_tide_evidence.selfdecrypt</code> role in the management console to view evidence without bank officer approval.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
              Action: <code className="text-red-400">admin.assignRole("_tide_evidence.selfdecrypt")</code>
            </div>
          </div>

          <button
            onClick={handleAttack}
            disabled={isAttacking}
            className="w-full bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold py-2.5 rounded-xl border border-red-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{isAttacking ? "Sending Request..." : "Attempt Unilateral Role Escalation"}</span>
          </button>
        </div>
      </div>

      {/* Result Display: Attack 2 Blocked */}
      {attackResult && (
        <div className="bg-slate-950 border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <XCircle className="w-5 h-5" />
            <span>TideCloak Quorum-Enforced Authorization Trap: ESCALATION BLOCKED</span>
          </div>
          <div className="bg-red-950/30 p-4 rounded-xl border border-red-900/50 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-red-400 font-bold">{attackResult.error}</span>
              <span className="text-slate-400">HTTP Status: 412 Precondition Failed</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {attackResult.detail}
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            <strong>Judging Takeaway:</strong> With standard Keycloak or Auth0, a database or realm admin can grant themselves any role unilaterally. With TideCloak QEA, role modifications generate change requests that freeze at 1/2 signatures and mathematically cannot commit without independent consortium approvals.
          </div>
        </div>
      )}

      {/* Result Display: Database Dump */}
      {dbDump && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Raw Database Dump (Exfiltrated by Host)
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              Zero Plaintext PII Leak
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Notice that the database stores strictly <strong>blinded HMAC-SHA256 identifiers</strong> and <strong>AES-256-GCM ciphertexts</strong>. The master decryption key is ineffable (split across independent Tide ORK nodes), so a complete cloud server compromise yields no actionable banking intelligence.
          </p>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto">
            <pre className="text-[11px] font-mono text-cyan-300/90 leading-relaxed">
              {JSON.stringify(dbDump, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Swap Test Theoretical Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>The Swap Test: Why TideCloak Is Central to This Solution</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">System Dimension</th>
                <th className="py-2.5 px-3">Conventional Architecture (Auth0 / DB Keys)</th>
                <th className="py-2.5 px-3 text-cyan-300">NeutralVault (TideCloak Architecture)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Host Database Breach</td>
                <td className="py-2.5 px-3 text-red-400">Operator holds key in memory; all victim & mule accounts exposed.</td>
                <td className="py-2.5 px-3 text-emerald-400">Operator holds only ciphertext; ineffable keys never exist on server.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Admin Privilege Escalation</td>
                <td className="py-2.5 px-3 text-red-400">Rogue admin grants themselves permission with single click.</td>
                <td className="py-2.5 px-3 text-emerald-400">QEA traps role change as change request; blocked without quorum.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Cross-Bank Secrecy (FSA 2013)</td>
                <td className="py-2.5 px-3 text-red-400">Banks must trust 3rd party vendor with confidential accounts.</td>
                <td className="py-2.5 px-3 text-emerald-400">Banks trust mathematical quorum; operator is blind.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Evidence Expiry</td>
                <td className="py-2.5 px-3 text-red-400">Soft DB flag; malicious party retains cached server copies.</td>
                <td className="py-2.5 px-3 text-emerald-400">Ephemeral session keys destroyed; 410 Gone enforced at edge.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
