# NeutralVault — RMITHACKATHON

A consortium workspace for banks, telcos and e-wallets to file encrypted scam intelligence, check account metadata, request controlled evidence disclosure, admit members and inspect an audit trail. The interface follows the supplied final green-and-paper HTML design.

## What you can demonstrate

- Account checks with matching risk indicators and sealed evidence.
- Browser-encrypted report submission.
- Disclosure requests with reporter and independent-member approvals.
- A requester-only, 30-minute evidence window.
- Organisation membership voting, operator inspection and a hash-linked audit trail.

Open the **Sample workspace** for the presentation walkthrough. Its fictional members and records are isolated from the live Tide-connected workspace. See [DEMO.md](DEMO.md) for exact accounts, member selections and expected results.

## Application

`app/` now uses Next.js, React, Prisma/SQLite and TideCloak. The old FairEnrol application has been removed. Real API routes verify access tokens and DPoP proofs; reports store ciphertext and keyed lookup tokens. Browser encryption uses the Tide SDK and authentic signed policy bytes. Evidence reads remain blocked until the required distinct-organisation policy is available.

The sample workspace contains synthetic data for presentations and is separate from authenticated API data. It does not establish that live Tide account linking or cryptographic disclosure has succeeded.

## Run locally

```powershell
cd app
npm.cmd ci
npm.cmd run db:push
npm.cmd run build
npm.cmd start
```

Open [http://localhost:3000/?sample=bank-b](http://localhost:3000/?sample=bank-b) to enter directly as the sample Bank B requester, with no account or password. Alternatively select a sample user on the sign-in screen and click **Continue as sample user**. Keep the terminal running. On macOS/Linux, use `npm` in place of `npm.cmd`. For development, use `npm.cmd run dev` instead of building and starting.

The sample workspace can be explored without completing Tide enrolment. A missing adapter may display a setup message; choose **Continue as sample user** to continue. Sample changes live in browser memory and reset on page reload; the selected sample member stays in the URL. **Exit sample** returns to the real sign-in screen. Authenticated API data persists in the local SQLite database.

See [app setup](app/README.md) for application configuration and checks.

## Demo in 3–5 minutes

[Watch or download the project video](docs/media/neutralvault-demo.mp4) — 720p MP4 with audio, compressed below 25 MB.

1. Open **Continue as sample user** and show the overview: five reports and three members.
2. In **Account Check**, search `0189 4420 1173` to show two matching reports with sealed evidence.
3. Select **Telco C** using **Sample member**, open **Disclosures**, and approve `DSC-902`. Switch back to **Bank B** to open its evidence.
4. As **Telco C**, vote Yes on the E-wallet admission proposal in **Governance**. The proposal passes and membership increases to four.
5. Submit fictional details in **File Report**, then show the resulting activity in **Audit Trail**. Optionally inspect the **Operator Console** as the sample Operator.

The complete [demo guide](DEMO.md) includes a presentation script, reset steps and troubleshooting.

## Validation

```powershell
cd app
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

The implementation passed 19 automated tests, a production build and browser checks of the sample workflows. Live multi-user Tide acceptance remains pending the integration steps below.

## TideCloak

The local server runs on http://localhost:8080 with persistent Docker storage. The project is `RMITHACKATHON`, realm `rmithackathon`, client `rmithackathon-client`. The infrastructure administrator is `admin`; its generated password is in the private root `.env`. Personal Tide credentials are separate.

The real adapter is stored privately at `data/tidecloak.json`. Never commit credentials or replace the adapter with invented keys. Account linking is currently blocked by Tide identity/signature failures. Application shared policies and the custom evidence quorum policy still require provisioning and live verification.

For the live identity server, configure a private root `.env` using `.env.example`, then run `docker compose up -d tidecloak` from the repository root. Docker Desktop must be running. Follow the setup guide for licensing, personal account linking and genuine adapter export. The Node.js app and Docker-based identity server are separate components.

Read [TideCloak setup](docs/TIDECLOAK_SETUP.md), [policy integration](docs/TIDE_POLICY_INTEGRATION.md), [MVP requirements](MVP_SPEC.md), and [app summary](docs/NEUTRALVAULT_APP_SUMMARY.md).

```powershell
node scripts/tidecloak-setup.mjs --status
```

Stop services with `docker compose stop`; retain the database volume.
