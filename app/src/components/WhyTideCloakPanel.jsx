import React from "react";
import {
  Shield,
  Lock,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Sparkles
} from "lucide-react";

export function WhyTideCloakPanel() {
  const criteria = [
    {
      title: "1. Vision & Originality (25% Weight)",
      desc: "An operator-blind, member-governed scam signal exchange that complements Bank Negara Malaysia's National Fraud Portal. Instead of requiring financial institutions to trust a central cloud vendor or rival bank with customer secrets, authority over sensitive data emerges strictly when multi-party quorums align.",
      badge: "25% Evaluation Weight"
    },
    {
      title: "2. Trust Constraint Insight (20% Weight)",
      desc: "Financial Services Act 2013 s.133 mandates strict bank customer secrecy. Whoever pools scam reports becomes an immense single breach target, and whoever runs the pool has unilateral authority to read everything. NeutralVault solves this custody, authority, and privacy trilemma by eliminating unilateral access.",
      badge: "20% Evaluation Weight"
    },
    {
      title: "3. Value & Impact (20% Weight)",
      desc: "Malaysia's NSRC handled 66,997 calls and disrupted 59,684 mule accounts in 2023. By enabling banks, telcos, and e-wallets to cross-verify suspect accounts in real-time without disclosing customer dossiers, fraudulent cash-out funnels are intercepted within minutes rather than weeks.",
      badge: "20% Evaluation Weight"
    },
    {
      title: "4. Why TideCloak Matters (20% Weight)",
      desc: "Passing the 'Swap Test': With Auth0 or AWS KMS, the server host holds the master key and can dump the database in plaintext. With TideCloak's Ineffable Cryptography and Hermetic E2EE, keys exist in fragments across independent ORK nodes. The host cannot decrypt evidence, and QEA prevents unilateral admin privilege escalation.",
      badge: "20% Evaluation Weight"
    },
    {
      title: "5. Prototype & Storytelling (15% Weight)",
      desc: "A high-fidelity working prototype demonstrating: 1) Client-side blinded HMAC signal check; 2) Hermetic E2EE report filing; 3) Multi-party Tier-2 evidence disclosure with blocked self-approval; 4) Live 90s lease countdown; 5) QEA consortium governance vote; and 6) Operator breach theatre with zero plaintext leak.",
      badge: "15% Evaluation Weight"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Judging Criteria & Submission Spec
              </span>
              <span className="text-xs text-slate-400">RMIT Hackathon Challenge 2</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              NeutralVault: Architecture & Judging Alignment
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              How our prototype directly solves the challenge: "What could you build if no single party had complete control?"
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> 100% Evaluation Coverage
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Aligned with Official Rubric
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Rubric Cards */}
      <div className="space-y-4">
        {criteria.map((c, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>{c.title}</span>
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {c.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Explicit Disclosure of Simulated vs Real Components */}
      <div className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Judges' Disclosure: Identification of Simulated vs Native Components</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Per challenge rules (<em>"Clearly identify all mocked or simulated components"</em>), we openly document the technical boundaries of this MVP prototype:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Fully Implemented & Cryptographically Real
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li><strong>Hermetic E2EE Cryptography:</strong> Real browser WebCrypto AES-GCM-256 and PBKDF2 encryption. Plaintext never leaves client memory.</li>
              <li><strong>Blinded Signal Lookups:</strong> Real HMAC-SHA256 account blinding preventing cleartext database lookups.</li>
              <li><strong>Audit Hash-Chain:</strong> Real SHA-256 block linking with cryptographic verification of tamper immunity.</li>
              <li><strong>Ephemeral Lease Expiry:</strong> Active in-memory key destruction and HTTP 410 enforcement.</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Simulated / Roadmap Extensions
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li><strong>Forseti C# Contract:</strong> Multi-party approval rules (ForbidSelfApproval, RequireDistinctOrgs) run at the application gate. Production roadmap compiles these into C# contracts executed directly inside ORK VMHost nodes.</li>
              <li><strong>Tide ORK Swarm:</strong> When TideCloak Docker container is absent, keys simulate threshold interpolation in the browser Secure Web Enclave.</li>
              <li><strong>Banking Rails:</strong> Malaysian NSRC and bank account numbers are synthetic to respect customer privacy.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
