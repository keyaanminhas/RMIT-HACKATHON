# NeutralVault

NeutralVault is a planned shared scam and mule-account intelligence pool for banks,
telcos, and e-wallets. Its goal is encrypted reporting, metadata-only account checks,
evidence disclosure approved by distinct organisations, member governance, and an
audit trail. See [MVP_SPEC.md](MVP_SPEC.md) for the feature and component contract and
[RESOURCES.md](RESOURCES.md) for the source material.

## Current implementation

`app/` is still the FairEnrol sample: React 19, Vite, and the TideCloak React SDK.
`src/App.jsx` contains the course registration reducer, simulated roles, two-person
exception approvals, panel replacement, blocked override demonstrations, and an
in-memory audit log. `src/seed.json` contains synthetic students and courses.
State resets on reload; there is no application backend or database.

The NeutralVault crypto, report lookup, cross-organisation disclosure, expiry, and
governance modules specified in `MVP_SPEC.md` do not exist yet. The current role
switcher and approvals are local simulations, not security enforcement. TideCloak
login is wired through `src/main.jsx` but needs a running server and an exported
adapter configuration. Encryption is not implemented in this sample.

## Run the app

```powershell
cd app
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5137. The port is fixed in `app/vite.config.js`.
Build with `npm.cmd run build`.

## Run TideCloak locally

Install and start Docker Desktop using its WSL 2 Linux container backend. On
Windows, WSL 2 and hardware virtualization must be available; a Windows restart
may be needed after enabling the required features. If Docker reports virtualization
is disabled, enable it in the computer's BIOS/UEFI before retrying.

Setup check on 22 October 2026: the React SDK is installed and the production build
passes. The local TideCloak server is not running. WSL installation failed because
administrator privileges are required, and Windows reports virtualization as
unavailable or disabled. To prepare WSL, run `wsl --install --no-distribution` in an
administrator PowerShell window, then restart Windows if prompted. Install Docker
Desktop and confirm `docker info` succeeds before starting the Compose service.

From the repository root:

```powershell
docker compose up -d
docker compose logs -f tidecloak
```

The Compose file uses the official development image, keeps its H2 database in a
named volume, and exposes the console only on localhost. Open http://localhost:8080
and sign in using the development credentials `admin` / `password`.

Complete the realm setup for `neutralvault`, link your Tide account, and activate
the development license as directed by the setup wizard. Register a browser app
with these settings:

- App origin / web origin: `http://localhost:5137`
- Valid redirect URI: `http://localhost:5137/*`
- Post-logout redirect URI: `http://localhost:5137/*`

Download the **Tide adapter** from the app's Credentials tab and save it as
`app/public/tidecloak.json`. This file is ignored by Git. The React provider loads
it at `/tidecloak.json`; `public/silent-check-sso.html` already exists, and the app
handles the SDK's `/auth/redirect` callback. Restart or reload the app and verify
login and logout. A successful frontend build does not verify authentication.

Realm activation requires your Tide account enrollment. Do not substitute a
handwritten adapter for the generated configuration. The existing FairEnrol role
display checks `registrar`, `admin`, and `approver`; NeutralVault organisation claims
and analyst/approver roles still need implementation.

```powershell
# Stop the development server while retaining its database:
docker compose stop
# Start it again:
docker compose up -d
```

Official instructions: [TideCloak server setup](https://docs.tide.org/Admin/Quick-deploy-test)
and [React SDK reference](https://docs.tide.org/Languages/React/tidecloak-react-reference).
