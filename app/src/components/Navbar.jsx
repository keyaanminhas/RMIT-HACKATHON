import React from "react";
import { useVault } from "../useVault";
import { SYSTEM_CONFIG } from "../config";
import { Shield, Lock, UserCheck, AlertTriangle, Cpu } from "lucide-react";

export function Navbar({ activeTab, setActiveTab }) {
  const { currentPersona, setCurrentPersona } = useVault();

  const navItems = [
    { id: "check", label: "🚨 Check Signal", tag: "Tier 1" },
    { id: "report", label: "📝 Report Mule", tag: "E2EE" },
    { id: "disclosure", label: "🔐 Tier-2 Quorum", tag: "M-of-N" },
    { id: "governance", label: "🏛️ Governance", tag: "QEA" },
    { id: "operator", label: "🎭 Operator Breach", tag: "Swap Test" },
    { id: "audit", label: "📜 Audit Trail", tag: "SHA-256" },
    { id: "overview", label: "ℹ️ Challenge Spec", tag: "Judges" }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-xl sticky top-0 z-50">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            RMIT UNLOCKED 2026
          </span>
          <span>Challenge 2: Build Without Blind Trust (TideCloak)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tide Secure Web Enclave Active</span>
          </div>
          <div className="text-slate-500 hidden sm:inline">|</div>
          <div className="text-slate-400">
            Jurisdiction: <span className="text-slate-200">Malaysia NSRC & FSA 2013 s.133</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                {SYSTEM_CONFIG.APP_NAME}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Operator-Blind
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mule Account Signal Exchange without Unilateral Custody
            </p>
          </div>
        </div>

        {/* Persona Switcher */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-1.5 px-3 rounded-xl border border-slate-700/80">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Current Persona:</span>
          </div>
          <select
            value={currentPersona.id}
            onChange={(e) => {
              const selected = SYSTEM_CONFIG.PERSONAS.find(p => p.id === e.target.value);
              if (selected) setCurrentPersona(selected);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
          >
            {SYSTEM_CONFIG.PERSONAS.map(p => (
              <option key={p.id} value={p.id}>
                {p.avatar} {p.name} ({p.description})
              </option>
            ))}
          </select>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-1 rounded">
            <span>Role: {currentPersona.role}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1 border-t border-slate-800/80">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? "border-cyan-400 text-cyan-400 bg-slate-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500"
              }`}>
                {item.tag}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
