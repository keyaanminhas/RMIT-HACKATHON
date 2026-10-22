# NeutralVault — RMIT Hackathon 2026, Challenge 2

> **Theme:** Build Without Blind Trust — Vibe Coding with TideCloak (Unlocked)
> **Core question:** *What could you build if no single party had complete control?*
> **Deadline:** Thursday 22 October 2026, 6:00 PM MYT
> **Team naming:** `<university>_<campus>_<team>_C2`
> **Submission form:** https://forms.gle/HRHYinqB861tLF597
> **Official sample repo:** https://github.com/truongnguyenxuanvinh/hackathon

This folder is self-contained so any tool (Kiro or GPT) can pick it up cold. Read this file first.

---

## The idea we are building: Neutral Vault

A shared **scam / mule-account intelligence pool** for banks, telcos and e-wallets where
**the operator is removed as a trusted party**. Even the company running the server cannot
read the data or decide who joins. Encryption + collective governance replace the middleman.

Authoritative source: `brief/neutral-vault-idea.pdf` (the researched version — real Malaysian
stats, legal framing, tiered access design, TideCloak feature map, 5-min demo script).

### Trust constraint addressed (all four lenses from the brief)
- **Privacy** — reports are encrypted; no snooping.
- **Custody** — the host stores data but holds only ciphertext.
- **Authority** — no single admin can grant access or change rules.
- **Trust** — the system works even if you do NOT trust the operator.

### How the app works (from the idea PDF)
1. **Report** — a Bank A analyst files a mule report (account id, reason code, evidence); encrypted in the browser.
2. **Check (tier 1)** — a Bank B analyst looks up an account, sees a hit + reason code + reporting org, but NOT the evidence.
3. **Disclose (tier 2)** — to see evidence, Bank B files a request; needs approval from Bank A **and** a third, unrelated org; no self-approval; access expires (~30 min).
4. **Govern** — admitting a new member or changing who-sees-what needs a **majority vote** of member orgs.
5. **Audit** — one page lists every lookup, request, approval and vote.

Matching design: store account ids as **keyed hashes**; the hash key is itself encrypted so only
member roles can decrypt it → a DB dump reveals nothing useful. Known limit: a member insider with
the key could brute low-entropy account numbers → state this openly, name **private set intersection**
as the roadmap.

### Why TideCloak is central (swap test)
With a normal IdP + a DB-held key, the operator holds the key, so the "operator dumps the database"
moment fails. TideCloak keeps the key unreadable to the host — that is what makes the demo true.

| Need | TideCloak feature |
|---|---|
| No shared password DB to steal | BYOiD login per analyst |
| Evidence + hash key unreadable to host | `doEncrypt`/`doDecrypt` with tags + role permissions |
| Tier-2 release needs distinct-org approvers, with expiry | Forseti policy (M-of-N, no self-approval, time-locks) |
| No admin self-grant | Quorum-approved role/permission changes |
| Forged requests rejected | Server-side `verifyTideCloakToken` / Next.js middleware |

### 5-minute demo script
1. **Problem (30s)** — MY scam/mule numbers; "even with a national portal, one operator still sees everything."
2. **Report + check (60s)** — Bank A files, Bank B gets a hit.
3. **Tier-2 request (60s)** — two teammates play approvers; self-approval fails; access expires.
4. **Breach theatre (60s)** — operator dumps DB → ciphertext; admin tries self-grant → blocked.
5. **Governance (45s)** — live vote admits the e-wallet as a new member.
6. **Audit + close (30s)** — show the log, state what is simulated.

### Build tiers (from the PDF)
- **Must have:** BYOiD login, encrypted report, tier-1 lookup, operator-dump demo.
- **Should have:** tier-2 approval flow + audit page.
- **Could have:** the live vote.

### Verify in the first hour
1. Cross-user decrypt — can a Bank B role decrypt data a Bank A user encrypted? (SDK docs hint "self" only.)
2. Quorum API — no app-facing change-request API found; may demo governance via the TideCloak admin console.
3. User approval — whether approvers can be org officers in the policy setup.
- TideCloak was in beta; Fabric is a dependency → **record a backup video**.

---

## Folder layout

```
NeutralVault-C2/
├── RESOURCES.md                     ← this file
├── brief/
│   ├── neutral-vault-idea.pdf       ← friend's researched idea (AUTHORITATIVE)
│   ├── challenge2-briefing.pdf      ← official Challenge 2 infographic
│   ├── CHALLENGE2_IDEAS.md          ← ideas/strategy guide (5 project options + rubric)
│   └── slides/                      ← 8 photos of the live briefing slides (1:05 & 1:09 PM)
└── app/                             ← FairEnrol working skeleton to reskin into Neutral Vault
    ├── package.json                 ← Vite + React 19 + @tidecloak/react@0.14.33
    ├── src/App.jsx                  ← the whole app (reducer + roles + quorum + audit log)
    ├── src/seed.json                ← demo data (reskin: orgs + mule reports, not courses)
    └── public/                      ← tidecloak.json goes here after creating the app in the TideCloak node
```

The `app/` skeleton is the official FairEnrol sample (Vite + React + `@tidecloak/react`), which is
structurally the same app: resource list → protected request → M-of-N quorum vote → audit log →
"rogue admin blocked" moment. We reskin it rather than build from zero.

### Mapping FairEnrol → Neutral Vault
| FairEnrol | Neutral Vault |
|---|---|
| Courses / enrolment | Mule-account reports (account id → keyed hash, reason code, evidence) |
| Student / Registrar / Approver roles | Bank A / Bank B / Telco / E-wallet analysts + operator |
| "Force enrol" exception request | Tier-2 evidence-disclosure request |
| 2-of-3 approver panel vote | M-of-N approval from **distinct** organisations, no self-approval, expiry |
| Change approver panel (quorum) | Govern: admit new member / change sharing rules by majority vote |
| Blocked registrar override | Operator dump → ciphertext; admin self-grant → blocked |
| Public audit log | Audit page: every lookup, request, approval, vote |

---

## Rubric (what judges score, 100%)
Vision & originality **25%** · Trust-constraint insight **20%** · Value & impact **20%** ·
Why TideCloak matters **20%** · Prototype & storytelling **15%**.

## Required submission (one public GitHub repo)
`sourcecodes.zip` · `summary.doc` (1-page, 5 questions) · `video.mp4` (≤2-min demo) · Run instructions ·
clearly label all mocked/simulated components.

## TideCloak dev node (local)
```bash
docker run -d -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password tideorg/tidecloak-dev:latest
```
Create the app in the console, set URIs, download `tidecloak.json` into `app/public/`.
