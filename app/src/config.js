// System Configuration for KongsiGuard / NeutralVault
export const SYSTEM_CONFIG = {
  APP_NAME: "NeutralVault",
  TAGLINE: "Operator-Blind Mule Account Signal Exchange",
  CHALLENGE: "RMIT Hackathon 2026 — Challenge 2 (UNLOCKED with TideCloak)",
  VERSION: "1.0.0-mvp",
  DISCLOSURE_TTL_SECONDS: 90, // Fast 90s countdown for live demo (30 mins in production)
  QUORUM_THRESHOLD: 2, // 2-of-3 distinct organizations needed
  
  REASON_CODES: [
    { code: "R01", label: "Mule Recruiter / Social Media Syndicate", severity: "HIGH" },
    { code: "R02", label: "Rapid Pass-Through / High Velocity Mule", severity: "CRITICAL" },
    { code: "R03", label: "Layered Cash-Out / Structured Withdrawals", severity: "HIGH" },
    { code: "R04", label: "Phishing Deposit Hub / Compromised Credentials", severity: "MEDIUM" },
    { code: "R05", label: "Cryptocurrency P2P Off-Ramp Funnel", severity: "CRITICAL" }
  ],

  ORGANIZATIONS: [
    { id: "bank-a", name: "Maybank (Synthetic Bank A)", type: "bank", isMember: true, badgeColor: "bg-amber-100 text-amber-800 border-amber-300" },
    { id: "bank-b", name: "CIMB (Synthetic Bank B)", type: "bank", isMember: true, badgeColor: "bg-red-100 text-red-800 border-red-300" },
    { id: "telco", name: "CelcomDigi (Synthetic Telco)", type: "telco", isMember: true, badgeColor: "bg-blue-100 text-blue-800 border-blue-300" },
    { id: "ewallet", name: "Touch 'n Go (Synthetic E-Wallet)", type: "ewallet", isMember: false, badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { id: "operator", name: "Cloud Infrastructure Host", type: "operator", isMember: false, badgeColor: "bg-gray-100 text-gray-800 border-gray-400" }
  ],

  PERSONAS: [
    {
      id: "alice",
      name: "Alice Tan",
      orgId: "bank-a",
      role: "analyst",
      tideRoles: ["org-bank-a", "analyst", "_tide_tier1.selfencrypt", "_tide_tier1.selfdecrypt", "_tide_evidence.selfencrypt", "_tide_hashkey.selfdecrypt"],
      avatar: "👩‍💼",
      description: "Bank A Fraud Analyst (Files reports, checks signals)"
    },
    {
      id: "olivia",
      name: "Olivia Chen",
      orgId: "bank-a",
      role: "officer",
      tideRoles: ["org-bank-a", "officer", "tide-realm-admin", "_tide_tier1.selfdecrypt", "_tide_hashkey.selfdecrypt"],
      avatar: "🏛️",
      description: "Bank A Compliance Officer (QEA Admin & Tier-2 Approver)"
    },
    {
      id: "ben",
      name: "Ben Lee",
      orgId: "bank-b",
      role: "analyst",
      tideRoles: ["org-bank-b", "analyst", "_tide_tier1.selfencrypt", "_tide_tier1.selfdecrypt", "_tide_evidence.selfdecrypt", "_tide_hashkey.selfdecrypt"],
      avatar: "👨‍💻",
      description: "Bank B Fraud Analyst (Queries signals, requests Tier-2 evidence)"
    },
    {
      id: "tom",
      name: "Tom Wong",
      orgId: "telco",
      role: "officer",
      tideRoles: ["org-telco", "officer", "tide-realm-admin", "_tide_tier1.selfdecrypt", "_tide_hashkey.selfdecrypt"],
      avatar: "📡",
      description: "Telco Security Officer (Neutral 3rd-Party QEA Approver)"
    },
    {
      id: "eve",
      name: "Eve Lim",
      orgId: "ewallet",
      role: "analyst",
      tideRoles: ["org-ewallet", "analyst"],
      avatar: "📱",
      description: "E-Wallet Candidate (Admitted live via QEA Governance vote)"
    },
    {
      id: "operator",
      name: "Malory Host",
      orgId: "operator",
      role: "operator",
      tideRoles: ["tide-realm-admin"],
      avatar: "🦹",
      description: "Cloud Database Operator (Attempts DB dump and privilege escalation)"
    }
  ]
};
