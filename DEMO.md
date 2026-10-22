# NeutralVault demo guide

## Start the app

From the repository root in PowerShell:

```powershell
cd app
npm.cmd ci
npm.cmd run db:push
npm.cmd run build
npm.cmd start
```

Open [http://localhost:3000](http://localhost:3000), click **View sample workspace**, and leave the terminal open. On macOS/Linux use `npm` instead of `npm.cmd`. For local development, `npm.cmd run dev` replaces the build/start commands.

If the app is already running, simply open the URL. The sample workspace is available while Tide enrolment is incomplete; it needs no personal Tide login. A Tide setup message concerns the live workspace and does not prevent using **View sample workspace**.

## Opening explanation

“NeutralVault lets banks, telcos and e-wallet providers share fraud indicators while controlling access to supporting evidence. Account checks show relevant risk metadata; evidence follows a separate approval process. This walkthrough uses fictional members and sample records.”

The **Sample member** selector at the top changes your presentation perspective. Start as **Bank B · Requester**. All sample changes are local to the current browser page; reloading restores the starting records. Sample actions do not create live Tide identities, permissions or evidence grants.

## 1. Overview — 30 seconds

Show **Overview**. The initial workspace has:

- Five reports.
- Three active member organisations.
- One pending disclosure.
- One open governance proposal.

Explain: “Members can contribute useful indicators without giving every participant unrestricted evidence access.”

## 2. Account Check — 45 seconds

As **Bank B**, open **Account Check** and enter `0189 4420 1173`. Click **Check account**.

Expected: two matching reports, including the critical mule-account indicator from Bank A. Point out the reporting organisation, reason and severity, while evidence remains sealed.

Optional alternatives:

| Sample identifier | Expected result |
| --- | --- |
| `0189 4420 1173` | Two matching reports |
| `6012 9988 7766` | A telco phishing indicator |
| `9999 0000 1111` | No matching reports |

Explain: “A match provides intelligence for an investigation. A missing match does not establish that an account is safe.”

## 3. Disclosure approvals — 60 seconds

Use the prepared request to avoid creating a duplicate:

1. Open **Disclosures** and find pending request `DSC-902`, for report `NV-2048`.
2. Explain that **Bank B** is the requester and **Bank A**, the reporter, has already approved.
3. Change **Sample member** to **Telco C · Independent approver**.
4. Approve `DSC-902`. This adds the independent organisation's decision.
5. Switch back to **Bank B · Requester** and open the now-approved evidence.
6. Point out the 30-minute expiry. Switching away from the requester clears the displayed evidence.

The initially approved request `DSC-901` is a fallback if you want to show evidence immediately. Refresh the page if you need to restore the original requests.

Explain: “The reporting organisation and an independent member participate in the decision. The evidence window belongs to the requesting user.” These are the sample workflow rules; live cryptographic enforcement still requires the signed Tide policy described in the integration docs.

## 4. Membership governance — 45 seconds

1. Choose **Telco C · Independent approver** and open **Governance**.
2. Find `PROP-2026-04`: **Admit E-wallet D — PaySwift Digital**.
3. Bank A already voted Yes. Vote **Yes** as Telco C.
4. Show the proposal passing at two Yes votes out of three active organisations.
5. Return to **Overview**: the sample active-member count is now four.

Explain: “Membership changes require a strict majority of eligible organisations.” Live membership changes additionally require a committed Tide governance ceremony.

## 5. File a report — 45 seconds

As a member such as **Bank B**, open **File Report**. Use only fictional details, for example:

- Account identifier: `7777 8888 9999`.
- Reason: select an available fraud-indicator reason.
- Severity: High.
- Report date: today's date.
- Evidence: `Fictional presentation case: repeated test transfers followed by attempted cash-out. No real customer is represented.`

Submit the report. Show the success message, then look up `7777 8888 9999` to find the new indicator. The sample uses browser AES-GCM encryption and HMAC indexing with temporary local keys; the live workspace uses the separate Tide policy path.

## 6. Audit and operator view — 30 seconds

Open **Audit Trail** and show the lookup, evidence access, approval, vote and report activity created during your walkthrough. Inspect the hash-chain verification result.

Optionally select **Operator**, open **Operator Console**, inspect the ciphertext dump and demonstrate the blocked unilateral-access attempt. Switch back to a member for reporting or voting.

Explain: “The audit chain checks continuity of recorded events. It is not an independently anchored immutable ledger.”

## Reset and troubleshooting

- **Restart the walkthrough:** refresh the page and select **View sample workspace** again. This restores five reports and three members; sample submissions and decisions are cleared.
- **Request is already approved or proposal already passed:** refresh for the initial state.
- **Evidence cannot open:** use Bank B, check that both required organisations approved, and check the 30-minute window. Refresh if the prepared grant expired.
- **Member action unavailable:** change the selector from Operator to a member organisation.
- **Page cannot connect:** start the app from `app/` and keep its terminal running. Check whether another process already occupies port 3000 before starting a second instance.
- **Tide login fails:** return to the app and choose **View sample workspace** for the presentation. Follow [TideCloak setup](docs/TIDECLOAK_SETUP.md) separately for the live integration.

## Current live integration status

The Next.js app, persistent APIs, DPoP verification and local TideCloak server integration are implemented. Personal Tide enrolment, real signed shared policies and custom evidence-quorum enforcement remain pending live verification. The sample workspace demonstrates product journeys without establishing that these live capabilities are complete.

For the architecture and app narrative, see [README.md](README.md), [app summary](docs/NEUTRALVAULT_APP_SUMMARY.md) and [policy integration](docs/TIDE_POLICY_INTEGRATION.md).
