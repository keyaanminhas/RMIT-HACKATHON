# NeutralVault — Operator-Blind Scam Signal Exchange

> **RMIT Hackathon 2026 — Challenge 2 (UNLOCKED with TideCloak)**  
> *What could you build if no single party had complete control?*

[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

---

## Project Overview

NeutralVault enables competing banks, telcos, and e-wallets to pool scam and mule-account intelligence in real time without granting any single party, platform operator, or cloud vendor custody over customer data.

### 1. What are you proposing?
A decentralized, operator-blind mule account signal exchange that complements Bank Negara Malaysia's National Fraud Portal. Members verify suspected mule accounts instantly through blinded HMAC lookups. Detailed investigation evidence is hermetically sealed and can only be unlocked via a multi-party quorum of distinct member organizations.

### 2. What trust constraint does it remove?
Under the Financial Services Act 2013 (s.133), banks owe strict duties of customer secrecy. Pooling fraud intelligence conventionally creates a single massive honeypot where the cloud hosting provider has unilateral power to view and leak confidential account dossiers. NeutralVault eliminates the trusted middleman: data is unreadable to the operator and authority emerges only when independent parties align.

### 3. Who benefits and how?
Fraud analysts intercept rapid mule cash-out funnels within minutes rather than days. Smaller players like e-wallets join without risking sensitive customer lists to banking rivals. Victims have stolen funds frozen before exit. In 2023, Malaysia's NSRC disrupted 59,684 suspected mule accounts; NeutralVault turns this into automated, operator-blind cross-industry collaboration.

### 4. How does TideCloak enable it?
TideCloak provides BYOiD login, Hermetic End-to-End Encryption (`doEncrypt`/`doDecrypt` with tags), and Quorum-Enforced Authorization (QEA). Keys are ineffable—fragmented across independent ORK nodes. The host cannot decrypt data alone, and rogue admins cannot unilaterally grant themselves access.

### 5. What does the prototype demonstrate?
Blinded signal lookups, client-side encrypted reporting, M-of-N evidence disclosure with blocked self-approvals, live 90-second lease expiry, live QEA governance voting to admit an e-wallet, and an adversarial "Operator Breach" demonstrating zero plaintext leakage.

---

## Prototype Features

| Feature | Description | TideCloak Mechanism |
|---|---|---|
| **🚨 Tier-1 Blinded Check** | Look up bank accounts / phone numbers without revealing customer databases. | Ineffable HMAC-SHA256 & `_tide_tier1.selfdecrypt` |
| **📝 Client-Side Encrypted Report** | File scam reports with evidence sealed in browser memory before sending. | Web Enclave AES-256-GCM (`tier1`, `evidence` tags) |
| **🔐 Tier-2 Quorum Disclosure** | Release evidence only with signatures from 2 distinct organizations; blocks self-approval. | Multi-Party Quorum & Forseti Policy Engine |
| **⏳ Ephemeral Access Leases** | Approved evidence access automatically expires and wipes after 90 seconds (HTTP 410). | Session-bound ephemeral key shredding |
| **🏛️ Collective Governance** | Admit new members or change sharing rules via cryptographic majority voting. | Tide Quorum-Enforced Authorization (QEA) |
| **🎭 Operator Breach Theatre** | Proves the "Swap Test": Database dump shows zero plaintext PII; admin self-grant fails. | Ineffable Cryptography & QEA Trap |
| **📜 Tamper-Evident Audit Trail** | Verifiable hash-chained log linking all activity. | SHA-256 Block Chain `H(prevHash + entry)` |

---

## Simulated vs Native Disclosure (Hackathon Rubric Requirement)

Per UNLOCKED rules, we openly identify simulated components:
- **Real & Native:** Client-side WebCrypto AES-GCM-256 encryption, HMAC-SHA256 account blinding, ephemeral lease destruction, and SHA-256 cryptographic audit chain.
- **Application Gated / Roadmap:** Multi-party approval rules (`ForbidSelfApproval`, `RequireDistinctOrgs`) run at the client/API gate. In production, these compile to C# Forseti contracts executed directly inside distributed ORK VMHost nodes.
- **Data:** Malaysian banking accounts, names, and phone numbers are synthetic to protect privacy.

---

## Setup & Run Instructions

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm or yarn

### 1. Clone & Enter Project
```bash
git clone https://github.com/keyaanminhas/RMIT-HACKATHON.git
cd RMIT-HACKATHON
git checkout aungzayhtet
```

### 2. Install & Start Development Server
```bash
cd app
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Testing the Key Demo Flows
1. **Tier-1 Signal Check:** Select persona `Ben Lee (Bank B)`. Go to **Check Signal**, click quick-fill `5512-3490-8812`, and click **Check**. You will see a Tier-1 Hit with sealed evidence.
2. **Request Disclosure:** Click **Request Tier-2 Evidence**, submit the request.
3. **Blocked Self-Approval:** In **Tier-2 Quorum**, notice Ben's attempt to self-approve is strictly blocked by policy.
4. **Quorum Approval:** Switch persona to `Olivia Chen (Bank A Officer)` in the header and sign. Then switch to `Tom Wong (Telco Officer)` and sign. Notice the status turns to **APPROVED** and the 90s countdown starts!
5. **Decrypt Evidence:** Click **Decrypt Evidence in Web Enclave** to see the decrypted bank statements.
6. **Swap Test (Operator Breach):** Switch persona to `Malory Host`. Go to **Operator Breach**, click **Dump Host Database** to verify zero plaintext, then click **Attempt Unilateral Role Escalation** to see TideCloak block the rogue admin!
7. **Governance Vote:** Switch to `Tom Wong`, go to **Governance**, vote YES on Touch 'n Go E-Wallet to admit them to the consortium live!
