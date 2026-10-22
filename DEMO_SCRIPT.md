# NeutralVault — 2-Minute Demo Video Script

> **Challenge Requirement:** A 2-minute demonstration video saved as `video.mp4` under 100 MB.
> **Total Duration:** Exactly 120 seconds.

---

### [0:00 – 0:20] Hook & Problem (20 seconds)
- **Speaker:** "Scam syndicates in Malaysia move stolen money through mule accounts in minutes. In 2023, the NSRC disrupted nearly 60,000 mule accounts. Banks, telcos, and e-wallets need to share fraud signals instantly—but under the Financial Services Act Section 133, banks owe strict secrecy. Whoever runs a central pool becomes a massive breach target and holds unilateral power over all data. We built NeutralVault: an operator-blind, member-governed scam signal exchange powered by TideCloak."
- **Screen:** Show NeutralVault landing page, pointing out the Malaysian NSRC context and active Tide Web Enclave status.

---

### [0:20 – 0:50] Tier-1 Check & Blinded Matching (30 seconds)
- **Speaker:** "Here, Alice at Bank A has already filed an encrypted report. Now Ben, an analyst at Bank B, receives a suspicious transfer. He enters the account number in the 'Check Signal' tab and clicks Check."
- **Screen Action:** Click quick-fill `5512-3490-8812`, click **Check**.
- **Speaker:** "Instantly, the browser computes an HMAC hash using an ineffable key split across Tide's fabric. We get a Tier-1 Hit: Reason R02, Rapid Pass-Through Mule. But notice: the detailed bank statements and transaction logs are hermetically sealed. Ben cannot see them, and neither can the server host."

---

### [0:50 – 1:20] Tier-2 Quorum Disclosure & Blocked Self-Approval (30 seconds)
- **Speaker:** "To see the evidence, Ben requests Tier-2 disclosure under an official case reference. Ben attempts to approve his own request—BLOCKED! Our policy strictly forbids self-approval."
- **Screen Action:** Switch to **Tier-2 Quorum**, click **Attempt Self-Approval** as Ben (red alert pops up).
- **Speaker:** "Now, Olivia, Compliance Officer for Bank A, signs. Then Tom, Security Officer for the Telco, signs. Once 2 distinct organizations approve, the quorum is met! Ben can now decrypt the evidence directly in his browser web enclave. A live 90-second ephemeral lease begins. Once expired, the key is destroyed and access returns HTTP 410."
- **Screen Action:** Switch persona to `Olivia` and sign; switch to `Tom` and sign; click **Decrypt Evidence** (green plaintext card appears with active countdown).

---

### [1:20 – 1:45] The Swap Test: Operator Breach Theatre (25 seconds)
- **Speaker:** "Now for the ultimate test: What if the cloud host is hacked? We switch to Malory, the cloud operator. Malory exfiltrates the entire database. Look at the dump: only blind HMAC hashes and AES-256-GCM ciphertexts! Zero plaintext account numbers, zero plaintext evidence. Malory then tries to grant herself the decryption role in Keycloak. BLOCKED! TideCloak's Quorum-Enforced Authorization freezes the change at 1 of 2 signatures. The operator is completely powerless."
- **Screen Action:** Switch to **Operator Breach**, click **Dump Host Database** (show JSON with zero PII), then click **Attempt Unilateral Role Escalation** (show red 412 QUORUM_NOT_MET banner).

---

### [1:45 – 2:00] Governance, Audit & Conclusion (15 seconds)
- **Speaker:** "Finally, in Governance, a 2-of-3 quorum vote admits Touch 'n Go E-Wallet into the consortium live. Every query, report, and vote is cryptographically linked in our tamper-evident SHA-256 audit log. With TideCloak Emergent Authority, we stop blind trust and enable true cross-industry defense. Thank you!"
- **Screen Action:** Show **Governance** vote pass, then flash the **Audit Trail** and click **Verify Hash Chain** (green 100% verified badge).

---

### Recording Tips for the Team
- Use Chrome or Edge in full screen (F11 or maximize).
- Keep the Persona dropdown clearly visible in the top right as you switch actors.
- Record audio using OBS Studio, Loom, or Windows Xbox Game Bar (`Win + G`).
- Save output as `video.mp4` (ensure file size is under 100 MB).
