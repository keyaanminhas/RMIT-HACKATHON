# NeutralVault — RMITHACKATHON

A consortium workspace for banks, telcos and e-wallets to file encrypted scam intelligence, check account metadata, request controlled evidence disclosure, admit members and inspect an audit trail. The interface follows the supplied final green-and-paper HTML design.

## Application

`app/` now uses Next.js, React, Prisma/SQLite and TideCloak. The old FairEnrol application has been removed. Real API routes verify access tokens and DPoP proofs; reports store ciphertext and keyed lookup tokens. Browser encryption uses the Tide SDK and authentic signed policy bytes. Evidence reads remain blocked until the required distinct-organisation policy is available.

The sample workspace contains synthetic data for presentations and is separate from authenticated API data. It does not establish that live Tide account linking or cryptographic disclosure has succeeded.

## Run locally

```powershell
docker compose up -d tidecloak
cd app
npm.cmd install
npx.cmd prisma db push
npm.cmd run build
npm.cmd start
```

Open http://localhost:3000. See [app setup](app/README.md) for application configuration and checks. The local database persists between application restarts.

## TideCloak

The local server runs on http://localhost:8080 with persistent Docker storage. The project is `RMITHACKATHON`, realm `rmithackathon`, client `rmithackathon-client`. The infrastructure administrator is `admin`; its generated password is in the private root `.env`. Personal Tide credentials are separate.

The real adapter is stored privately at `data/tidecloak.json`. Never commit credentials or replace the adapter with invented keys. Account linking is currently blocked by Tide identity/signature failures. Application shared policies and the custom evidence quorum policy still require provisioning and live verification.

Read [TideCloak setup](docs/TIDECLOAK_SETUP.md), [policy integration](docs/TIDE_POLICY_INTEGRATION.md), [MVP requirements](MVP_SPEC.md), and [app summary](docs/NEUTRALVAULT_APP_SUMMARY.md).

```powershell
node scripts/tidecloak-setup.mjs --status
```

Stop services with `docker compose stop`; retain the database volume.
