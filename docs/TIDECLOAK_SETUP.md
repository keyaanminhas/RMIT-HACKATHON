# Local TideCloak for NeutralVault

The local server uses Docker Desktop's Linux engine and the official
`tideorg/tidecloak-dev:latest` image. Its H2 database is retained in the
`rmit-hackathon_tidecloak-data` named volume. Port 8080 is bound to localhost.
The one-time volume initialization service fixes the directory ownership for
TideCloak's non-root UID 1000; the server itself does not run as root.

## Private configuration

`.env` contains a generated master-admin password, the licence owner's email,
and their explicit acceptance of Tide's terms. It is ignored by Git.
`.env.example` documents the variables without credentials. Do not commit `.env`
or either generated adapter file.

The master admin username is `admin`; obtain its password from your local `.env`.
This infrastructure account is separate from the BYOiD owner account
`admin` in the `rmithackathon` realm. The latter is a separate BYOiD identity;
the master password is not automatically copied to it.

## Start and prepare

Run these from the repository root in PowerShell:

```powershell
docker desktop start --detach
docker compose up -d tidecloak
node scripts/tidecloak-setup.mjs --bootstrap
```

The bootstrap command imports Tide's canonical realm template with NeutralVault
roles and organisation groups, provisions a licence using the supplied email,
and enables cryptographic IGA. It never deletes an existing realm or database.
An existing, enrolled owner causes bootstrap to stop without reconfiguring the
realm. During the initial FirstAdmin window, only initial setup change requests
are drained. Never use this bootstrap drain as an application's approval service.

Open the private invitation printed by bootstrap and personally link your Tide
account. The invitation grants access to the owner identity; do not publish it.
Then run:

```powershell
node scripts/tidecloak-setup.mjs --prepare-app
node scripts/tidecloak-setup.mjs --finish
node scripts/tidecloak-setup.mjs --status
```

Finish signs the IdP settings and commits the enrolled owner's Tide admin role
last. Subsequent governed changes require the real browser approval ceremony.
One enrolled owner does not provide a two-organisation quorum. Independent
organisation administrators and signed application policies must be enrolled
and verified before the consortium is declared ready.

## Application contract

- Project display name: `RMITHACKATHON`.
- Realm: `rmithackathon` (the wizard normalizes the project name).
- Browser client: `rmithackathon-client`.
- App origin: `http://localhost:3000`.
- Callback: `http://localhost:3000/auth/redirect`.
- Client has DPoP-bound access tokens; the app must verify proofs server-side.
- Roles: `vault-analyst`, `vault-approver`, `vault-admin`.
- Organisation groups: `/bank-a`, `/bank-b`, `/telco-c`, `/ewallet-d`.
- The applicant group does not receive member roles automatically.
- `groups` is included in access tokens through the stock Keycloak mapper.
- Shared E2EE capability roles exist without being granted to every user.
- Public registration is disabled; accounts are invited individually.

`--export` prints the real generated adapter as JSON after validating its `jwk`,
`vendorId`, `homeOrkUrl`, realm and client. Save it privately as
`data/tidecloak.json` for the planned Next.js app. Do not substitute a handwritten
adapter. An exported adapter alone does not prove successful BYOiD authentication,
cross-user encryption, disclosure policy enforcement or multi-party governance.

## Stop and inspect

```powershell
docker compose stop tidecloak
docker compose ps
docker compose logs --tail 50 tidecloak
```

Do not use `docker compose down -v`; that removes the persistent database volume.
The server is a local development deployment and still contacts the live Tide
network for licensing, identity and cryptographic operations.

## Setup result on 22 October 2026

- Docker Desktop's Linux engine and the local TideCloak server are running.
- Master admin authentication was verified through the token endpoint.
- The initial `neutralvault` realm contains the application roles and organisation
  groups, but its vendor-key provisioning was incomplete. It is retained intact.
- The user subsequently created project `RMITHACKATHON` through the setup wizard.
  Its existing `rmithackathon` realm is now the configured target. Its real
  generated adapter exports successfully and is saved in `data/tidecloak.json`.
- Tide MCP is registered in the user's Codex configuration.
- The licence request used the licence owner's supplied email and explicit terms
  acceptance. No paid subscription or checkout was started.
- The original realm's initial request failed in
  `Midgard.FinalizeWallet` with upstream HTTP 500. The documented vendor-key
  lifecycle retry failed with upstream HTTP 403. Tide reports
  `TIDE-IDPEXT-VENDOR-KEYGEN_FAILED`. This concerns the retained original realm;
  the current `rmithackathon` realm exports its real adapter successfully.
- A direct `setUpTideRealm` retry after partial initialization is not safe on this
  build: it attempts to recreate the existing Tide IdP and fails with a duplicate
  resource error. The bootstrap script uses the documented lifecycle endpoint
  when resuming an existing IdP instead.
- The `rmithackathon` realm has QEA enabled with `iga.attestor=tide`. The wizard
  failed while signing its baseline configuration (`AttestationUnit:1`), with
  upstream HTTP 408 and 500 responses. All 255 baseline requests subsequently
  committed successfully. Application roles, groups, DPoP, the localhost:3000
  redirect and the full-path groups mapper also committed successfully.
- The owner invitation has been created. Personal Tide account linking failed
  on `ork1.tideprotocol.com` with `TIDE-TIDEJS-SIG-BLIND_VERIFY_FAILED` and a
  subsequent sign-in attempt returned invalid username or password. The owner
  is not yet linked or granted Tide administrator authority.
- Signed shared application policies and custom evidence quorum enforcement are
  not yet provisioned. Do not describe these capabilities as live-verified.

The immediate blocker is Tide's identity/signature flow. Preserve
the existing realm and database. Do not rotate or delete keys, switch to fake
adapters, disable cryptographic enforcement, or buy a subscription as a workaround.
The Tide team can inspect the failed wallet/signing operations; provide
the error codes and licence owner's address privately, never the master password.

## References

- Tide Agent Pack: <https://mcp.tide.org/mcp>, bootstrap and admin-link playbooks.
- Canonical template: <https://mcp.tide.org/pack/templates.tgz>.
- Tide terms: <https://tide.org/legal>.
- E2EE setup: <https://docs.tide.org/Admin/e2ee>.
