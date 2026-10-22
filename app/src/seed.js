// Initial Seed Data for NeutralVault
// Uses synthetic Malaysian banking & telco identifiers to reflect real-world NSRC context

export const INITIAL_SEEDS = {
  rawReports: [
    {
      id: "REP-2026-001",
      identifierType: "BANK",
      rawIdentifier: "5512-3490-8812",
      reasonCode: "R02",
      severity: "CRITICAL",
      reportingOrg: "bank-a",
      reporterName: "Alice Tan (Bank A)",
      evidenceText: "Received RM 48,500 from victim Chong on 2026-10-21 09:12 MYT. Layered across 6 rapid inter-bank transfers within 4 minutes. IP trace: 175.143.22.10 (Residential VPN exit node). Matched Malaysian NSRC mule criteria.",
      createdAt: "2026-10-21T09:18:00Z"
    },
    {
      id: "REP-2026-002",
      identifierType: "PHONE",
      rawIdentifier: "+6012-8899-102",
      reasonCode: "R01",
      severity: "HIGH",
      reportingOrg: "telco",
      reporterName: "Tom Wong (Telco)",
      evidenceText: "SIM card used to broadcast 3,200 SMS phishing lures masquerading as bank security alerts with fake domain 'my-secure-cimb-update.net'. High churn prepaid SIM registered with falsified foreign passport.",
      createdAt: "2026-10-21T14:45:00Z"
    },
    {
      id: "REP-2026-003",
      identifierType: "BANK",
      rawIdentifier: "7041-9920-1134",
      reasonCode: "R03",
      severity: "HIGH",
      reportingOrg: "bank-b",
      reporterName: "Ben Lee (Bank B)",
      evidenceText: "Account opened 3 days ago. Multiple structured cash withdrawals totaling RM 29,800 conducted at 4 separate ATMs in Subang Jaya within 45 minutes of fund credits. Account holder unable to explain fund sources.",
      createdAt: "2026-10-22T08:30:00Z"
    }
  ],

  initialProposals: [
    {
      id: "PROP-001",
      title: "Admit Touch 'n Go E-Wallet to the Exchange",
      description: "Touch 'n Go requests read-write access to the signal pool to intercept mule cash-out funnels before funds exit to merchant QR networks.",
      candidateOrg: "ewallet",
      proposerOrg: "bank-a",
      requiredThreshold: 2, // 2-of-3 quorum
      status: "OPEN",
      votes: [
        { orgId: "bank-a", officerName: "Olivia Chen", vote: "YES", timestamp: "2026-10-22T10:00:00Z" }
      ],
      createdAt: "2026-10-22T09:45:00Z"
    }
  ]
};
