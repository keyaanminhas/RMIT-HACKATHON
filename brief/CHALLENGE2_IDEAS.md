# RMIT Hackathon 2026 — Challenge 2: Master Ideas & Strategy Guide

> **Theme:** Build Without Blind Trust — Vibe Coding with TideCloak (Unlocked)  
> **Core Question:** *"What could you build if no single party had complete control?"* (No unilateral control by an Administrator, Organisation, or AI System).  
> **Official Deadline:** Thursday, 22 October 2026 at 6:00 PM MYT  
> **Official Sample Repo:** `github.com/truongnguyenxuanvinh/hackathon`  
> **Submission Form:** `forms.gle/HRHYinqB861tLF597`  
> **Target Repo Naming:** `<university>_<campus>_<team>_C2`

---

## 1. Judging & Evaluation Rubric (100% Total)

| Criteria | Weight | What Judges Look For |
|---|:---:|---|
| **1. Vision & Originality** | **25%** | What new product, service, or way of working is proposed? Is it distinctive? |
| **2. Trust Constraint Insight** | **20%** | Clear diagnosis of what is risky/impossible when trust/privacy/custody gets in the way. |
| **3. Value & Impact** | **20%** | Who benefits, how lives/work improve, concrete real-world example. |
| **4. Why TideCloak Matters** | **20%** | How decentralized IAM / keyless custody unlocks the solution (not just a generic login). |
| **5. Prototype & Storytelling** | **15%** | Convincing 2-minute working demo with a clear narrative. |

---

## 2. Technical Deliverables Required by 6:00 PM
A single public GitHub repository containing:
1. `sourcecodes.zip` — Application source code (Vite + React + `@tidecloak/react`)
2. `summary.doc` — 1-page paper addressing the 5 core questions (Problem, Trust Constraint, Innovation, TideCloak Role, Prototype)
3. `video.mp4` — Max 2-minute working demonstration video
4. `README.md` / `Run instructions` — Step-by-step commands to launch and test locally
5. *Explicit note:* Clearly identify all mocked or simulated components.

---

## 3. Top Project Ideas (Detailed Breakdown)

---

### 🏆 Idea 1: ResearchVault (ScholarCloak) — Decentralized Research & IP Escrow
> **Origin:** **Organizers' Explicit Verbal Hint during Challenge 2 Briefing!**  
> **Target Category:** **Organisation & Administrator** (Custody, Authority, Privacy)

#### A. The Problem & Trust Constraint
Academic researchers, pharmaceutical labs, and cross-university teams (e.g., RMIT, Taylor's, Monash) collaborate on breakthrough pre-patent discoveries, unpublished papers, and clinical datasets. 
* **Current Risk:** Uploading drafts or raw datasets to centralized clouds (Google Drive, university intranet, or arXiv) gives the **cloud vendor or university IT administrator unilateral god-mode access**. Admins can snoop, leak, or "scoop" (steal) the research before patent filing.
* **The Constraint:** No single institution or platform administrator should have unilateral custody or authority to view, alter, publish, or retract collaborative research.

#### B. Why TideCloak Matters
* **Zero God-Mode Snooping:** Manuscripts and datasets are encrypted at rest with decentralized custody. The hosting server/admin never possesses the master key.
* **Co-Author Multi-Institution Quorum:** Decryption, public unsealing, or pre-print release requires multi-party quorum signatures across institutions (e.g., Lead Author from RMIT + Co-Author from Taylor's + Independent Ethics Lead) via TideCloak.
* **AI Training Immunity:** Prevents the hosting platform from secretly feeding private research into proprietary AI training pipelines.

#### C. 2-Minute Demo Flow
1. **Research Hub View:** Shows an embargoed breakthrough cancer research paper (*"Novel Targeted Nanoparticles for Oncology"*). Status: **EMBARGOED & ENCRYPTED**.
2. **The Rogue Admin Test:** Switch to SysAdmin role and attempt *"Unilateral Decrypt & Export"* $\rightarrow$ **Blocked by TideCloak!** (*"Error: Platform admins do not possess decryption authority"*).
3. **Quorum Approval:**
   * RMIT Lead Researcher signs in via TideCloak $\rightarrow$ Signs approval (1/2).
   * Taylor's Co-Author signs in via TideCloak $\rightarrow$ Signs approval (2/2 threshold met).
4. **Result:** The research payload unseals, becomes public on the research registry, and an immutable audit hash is created.

---

### 🤖 Idea 2: AgentGuard (GuardianAI / AgentFence) — Dual-Key Quorum for Autonomous AI Agents
> **Origin:** Proposed by @shu2662 and @lucid_eeper  
> **Target Category:** **AI System & Administrator** (Authority & Trust) — *Directly matches Slide 1 box "AI SYSTEM"*

#### A. The Problem & Trust Constraint
In 2026, autonomous AI agents are being granted tool-calling powers to trigger financial transfers, rotate cloud API keys, modify database records, or deploy production code.
* **Current Risk:** API keys sit centrally in server environments. A prompt injection attack, model hallucination, or rogue internal engineer can trigger catastrophic, irreversible actions.
* **The Constraint:** Neither the AI model autonomously nor a lone administrator should have unilateral execution authority over high-stakes, irreversible actions.

#### B. Why TideCloak Matters
* **Decentralized Execution Gate:** High-risk AI actions are automatically routed to an escrow queue and cryptographically locked.
* **Dual-Key Threshold Authorization:** Unlocking the execution key requires a 2-of-2 or 2-of-3 quorum from designated human overseers (e.g., SecOps Lead + FinOps Lead) authenticated via TideCloak.
* **Tamper-Proof Audit:** System logs are cryptographic and cannot be wiped by the AI or a rogue IT admin to hide tracks.

#### C. 2-Minute Demo Flow
1. **Live AI Feed:** AI agent monitors company infrastructure/finances. An anomaly triggers a high-impact proposal (*"Emergency refund of $15,000 to user account"*).
2. **Execution Attempt Blocked:** The AI attempts to auto-execute $\rightarrow$ **Gate holds action in LOCKED state**. A single admin tries unilateral override $\rightarrow$ **Blocked**.
3. **Multi-Party Sign-Off:**
   * SecOps Lead logs in with TideCloak $\rightarrow$ Signs key share 1.
   * Finance Director logs in with TideCloak $\rightarrow$ Signs key share 2.
4. **Execution:** Threshold unlocked $\rightarrow$ Transaction dispatches $\rightarrow$ Live immutable audit record displayed.

---

### 🛡️ Idea 3: TrustVault / ClearSignal — Tamper-Proof Whistleblower Escrow
> **Origin:** Proposed by @shu2662 and @lucid_eeper  
> **Target Category:** **Organisation & Privacy/Custody**

#### A. The Problem & Trust Constraint
Whistleblowers fear reporting executive fraud, corruption, or safety issues because company whistleblower portals run on internal IT infrastructure. Internal sysadmins can inspect server logs, identify IP addresses, or secretly delete reports to protect executives.
* **The Constraint:** The organization under investigation must not have unilateral custody of the whistleblower report or the authority to dismiss it.

#### B. Why TideCloak Matters
* **Keyless Secret Custody:** The whistleblower's report and attachments are encrypted upon upload. 
* **Independent Reviewer Quorum:** Decryption requires quorum consensus from independent reviewers (e.g., External Legal Ombudsman + Independent Ethics Auditor + Staff Union Rep). The company CEO/CTO cannot decrypt or purge the report.

#### C. 2-Minute Demo Flow
1. Whistleblower submits an anonymous report with evidence of accounting fraud. Status: **SEALED**.
2. Internal Company Admin logs into portal and attempts to view or delete the pending case $\rightarrow$ **Access Denied**.
3. Independent Ombudsman and External Auditor authenticate via TideCloak $\rightarrow$ Quorum unlocks the case file for independent investigation.

---

### 🤝 Idea 4: AidGate / MeritGrant — Quorum-Governed Humanitarian Aid & Student Relief
> **Origin:** Proposed by @shu2662 and @lucid_eeper  
> **Target Category:** **Organisation & Administrator** (Authority & Trust)

#### A. The Problem & Trust Constraint
In disaster relief distribution, student emergency hardship funds, or community grants, millions of dollars are lost to internal fraud, nepotism, or compromised admin accounts.
* **The Constraint:** A single clerk or administrator must not be able to unilaterally release funds, alter eligibility criteria, or prioritize friends on the waiting list.

#### B. Why TideCloak Matters
* Payout requests above an emergency threshold require dual-sign-off (e.g., Field Response Lead + Independent Financial Auditor) via TideCloak before funds release.
* Candidate privacy is protected so arbitrary staff members cannot inspect sensitive family financial documents.

#### C. 2-Minute Demo Flow
1. Hardship applicant requests $2,500 emergency bursary.
2. Reviewer A tries to unilaterally disburse $\rightarrow$ System flags *"Pending 2nd Auditor Sign-Off"*.
3. Independent Auditor authenticates via TideCloak and confirms $\rightarrow$ Simulated payout completes.

---

### 🩺 Idea 5: CareShare — Patient-Controlled Health Records & Break-Glass Emergency
> **Origin:** Proposed by @lucid_eeper  
> **Target Category:** **Organisation & Privacy/Custody**

#### A. The Problem & Trust Constraint
Hospital databases centralize electronic health records, leaving them vulnerable to ransomware and nosy hospital staff. However, during an ER emergency, unconscious patients cannot manually give consent.
* **The Constraint:** Hospital IT must not have unilateral god-mode access, yet emergency personnel must be able to access critical records without compromising overall privacy.

#### B. Why TideCloak Matters
* Records are encrypted at rest with decentralized custody. Normal access is strictly patient-authorized.
* **Break-Glass Emergency Protocol:** Emergency access to life-saving telemetry (allergies, blood type) requires a multi-staff TideCloak quorum (e.g., Attending ER Doctor + On-Duty Hospital Chief) with instant audit logging.

---

## 4. Architectural Implementation Blueprint (How to Build It in < 60 mins)

All 5 ideas can be built using the exact pattern in the official sample repository (`FairEnrol`):

```
+-------------------------------------------------------+
|                   Vite + React UI                     |
|  - Dashboard / Proposal Feed                          |
|  - Multi-Party Quorum Panel (Approver 1, Approver 2)  |
|  - Real-time Audit Trail                              |
+-------------------------------------------------------+
                           |
                           v @tidecloak/react
+-------------------------------------------------------+
|                  TideCloak Dev Node                   |
|  Docker: tideorg/tidecloak-dev:latest:8080            |
|  - Decentralized Identity & Quorum Authorization      |
+-------------------------------------------------------+
```

### Docker Quickstart Command:
```bash
docker run -d -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password tideorg/tidecloak-dev:latest
```

---

## 5. Summary Recommendation for the Team

* **If following the Organizers' direct suggestion:** Go with **Idea 1: ResearchVault (ScholarCloak)**. Organizers love seeing their own ideas brought to life, and it perfectly suits RMIT / Taylor's university research context.
* **If aiming for the highest tech/originality score (25%):** Go with **Idea 2: AgentGuard (GuardianAI / AgentFence)**. It tackles the hottest AI safety topic of 2026 and directly hits the **"AI SYSTEM"** prompt from Slide 1.
