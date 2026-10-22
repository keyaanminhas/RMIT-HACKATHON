# NeutralVault

Next.js App Router, TypeScript, Prisma and SQLite. The final consortium HTML is the visual reference. The real workspace uses authenticated APIs. A separately labelled sample workspace is available for the user-requested UI demonstration while Tide enrolment is blocked.

## Sample workspace

Open `http://localhost:3000/?sample=bank-b` directly, or choose a sample user and click **Continue as sample user**, to explore isolated, in-memory fictional records without a password. The sample uses browser AES-GCM encryption and HMAC indexing with temporary local keys. Its member selector, approvals and evidence windows belong only to that workspace: they do not authenticate a Tide user, call protected APIs or issue live Tide grants. Reloading restores the initial records and retains the selected member through the URL. **Exit sample** removes that parameter. Follow the [demo guide](../DEMO.md) for exact accounts, requests, member selections and expected results.

## Run and verify

From `app`: `npm install`, `npm run db:push`, `npm run dev`. App origin is `http://localhost:3000`. Validate with `npm test`, `npm run typecheck`, and `npm run build`.

The server reads the real public Tide adapter from `../data/tidecloak.json` or `TIDECLOAK_ADAPTER_PATH`. `APP_ORIGIN` defaults to `http://localhost:3000`; configure it explicitly behind a proxy. Never include bootstrap credentials or private keys in the adapter. SQLite is `prisma/neutralvault.db`; keep it out of source control and back it up before schema changes.

## Authentication

API handlers verify the adapter-pinned signing key, issuer, required expiry, authorised client and DPoP proof. The ES256 proof key, token hash, method, origin/path, freshness and persistent replay claim must match. Bearer replay is rejected. Forwarded host headers cannot change the expected origin.

Enrolled users need signed `org_id`, optional `org_name`, and the relevant realm/client role: `vault-analyst`, `vault-approver`, `vault-admin` or `vault-operator`. Unrelated client roles are ignored. Organisations need genuine governed provisioning; no local actor switch or unauthenticated seed endpoint exists.

## Current security boundary

Durable workflow/audit APIs and login integration are implemented. **Shared encryption, disclosure release and governance commitment remain unavailable** until actual signed Tide policies are deployed and verified across independent users. Identity self-encryption is deliberately not used as consortium encryption. Environment flags cannot enable these capabilities. Account identifiers, index keys and plaintext report contents are never sent to the server by the browser actions.

Recorded approvals do not become decrypt grants. Recorded governance majorities become `awaiting_tide_commitment`; they never modify membership or roles locally. Evidence endpoints stay sealed even if approval fields are edited directly in SQLite. A signed custom contract must enforce reporter participation, unrelated organisations, requester binding and expiry before release is enabled. See `docs/TIDE_POLICY_INTEGRATION.md` in the repository root for the actual SDK contract.

The API provides configuration/capability status, verified session, dashboard, organisations, ciphertext reports, POST lookup, disclosure requests/decisions, proposals/votes, hash-chain audit and operator inspection/denied attempts. Failures use `{error:{code,message}}`. Decisions are transactionally unique per organisation. Report idempotency uses a caller-generated UUID.

Audit events contain identifiers and outcome labels. The chain detects partial edits; it is not immutable and cannot prevent a database operator rewriting the entire chain. Operator inspection returns actual stored ciphertext/workflow records. No request bodies, tokens, plaintext evidence or account identifiers are intentionally logged. Timing, report counts, organisations and opaque lookup correlations remain visible to the operator.

The live workspace requires reports to be encrypted by enrolled browser members. Its server has no plaintext seed keys or sample-member override. The separate sample workspace never grants access to live data. Full multi-user acceptance requires Tide availability, independent enrolled identities and verified policies; local tests alone do not satisfy these external gates.
