import React, { useState } from "react";
import { VaultProvider, useVault } from "./useVault";
import { Navbar } from "./components/Navbar";
import { CheckPanel } from "./components/CheckPanel";
import { ReportPanel } from "./components/ReportPanel";
import { DisclosurePanel } from "./components/DisclosurePanel";
import { GovernancePanel } from "./components/GovernancePanel";
import { OperatorBreachPanel } from "./components/OperatorBreachPanel";
import { AuditPanel } from "./components/AuditPanel";
import { WhyTideCloakPanel } from "./components/WhyTideCloakPanel";
import { Shield, Lock, ExternalLink, Heart } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("check");
  const { isInitialized } = useVault();

  if (!isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center animate-spin text-cyan-400">
          <Shield className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white">Initializing Tide Secure Web Enclave</h2>
          <p className="text-xs text-slate-400 font-mono">
            Deriving ineffable key fragments & generating cryptographic genesis block...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeTab === "check" && <CheckPanel onNavigateToDisclosure={() => setActiveTab("disclosure")} />}
        {activeTab === "report" && <ReportPanel onReportSubmitted={() => setActiveTab("check")} />}
        {activeTab === "disclosure" && <DisclosurePanel />}
        {activeTab === "governance" && <GovernancePanel />}
        {activeTab === "operator" && <OperatorBreachPanel />}
        {activeTab === "audit" && <AuditPanel />}
        {activeTab === "overview" && <WhyTideCloakPanel />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">NeutralVault</span>
            <span>• Built for RMIT Hackathon 2026 Challenge 2 (Tide UNLOCKED)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://tide.org/unlocked/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>Challenge Brief</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.tide.org"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>TideCloak Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <MainContent />
    </VaultProvider>
  );
}
