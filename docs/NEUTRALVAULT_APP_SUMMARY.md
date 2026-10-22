# NeutralVault — Consortium Intelligence Workspace

## Purpose

NeutralVault helps participating banks, e-wallet providers and telecommunications organisations share account-risk intelligence while controlling access to supporting evidence. Members can contribute a report, check whether an account has already been reported, and request a justified disclosure without placing account identifiers or evidence in the application's plaintext database.

The project is being developed for RMITHACKATHON. Its goal is a persistent, multi-user application backed by real TideCloak authentication and browser cryptography. It does not claim regulatory endorsement, guaranteed legal compliance, hardware isolation or blockchain-backed audit storage.

## Users and experience

Analysts file reports and perform account lookups. Approvers review disclosure requests on behalf of their organisation. Consortium administrators coordinate membership and rule changes. Operators inspect infrastructure, ciphertext and operational records without receiving an application feature that decrypts members' evidence.

The interface follows the supplied consortium MVP HTML design: a green and warm paper/brown palette, clear navigation, readable tables and focused forms. It brings reporting, disclosures, governance and operational visibility into one workspace. A sample-data workspace supports reviewing the journeys and presentation; sample records are clearly distinguished from live consortium activity.

## Seven core workflows

1. **Sign in and open the organisation workspace.** TideCloak identifies the user; their organisation and granted roles determine available actions. The home view presents relevant reports, requests and governance activity.
2. **Submit a risk report.** An analyst supplies an account identifier, reason, severity, report date and supporting evidence. The browser computes the shared HMAC lookup index and encrypts protected content before submission. Evidence must be sealed under a signed, write-only policy naming the submitting Tide identity.
3. **Look up an account.** The browser computes the same index from a consistently normalised identifier. The service returns matching reports, rather than exposing raw identifiers. Eligible members can access the permitted Tier-1 metadata; evidence remains sealed.
4. **Request disclosure.** A requester provides a case reference. Intended release requires the reporting organisation and an independent, nonrequester organisation to approve. Distinct-organisation and no-self-approval rules must be enforced by the cryptographic policy, not only the database. Access is intended to expire 30 minutes after commitment.
5. **Govern the consortium.** Members propose organisation admission or rule changes and vote by organisation. Changes require a strict majority of the eligible, committed membership. A stored vote or application administrator action alone must not grant membership or decrypt capability.
6. **Review the audit trail.** Users inspect recorded activity and verify the application's hash chain. This can expose broken record continuity; it is not an independently anchored immutable ledger.
7. **Inspect operations.** Operators view actual service status, stored ciphertext and sanitised operational information. Permission failures and unavailable integrations must appear as real states rather than successful actions.

## Architecture and data protection

The application uses Next.js App Router, TypeScript, React, Prisma and SQLite for a persistent local deployment. Server handlers validate authenticated requests, DPoP proofs, roles and organisation membership. The database stores encrypted payloads, account-index hashes, workflow records and audit events.

TideCloak supplies authentication and the connection to Tide's policy-controlled cryptographic operations. Browser helpers forward actual signed policy bytes to the SDK, bind requests to the correct vendor, subject and record, and keep plaintext and raw index keys out of server-side processing. The HMAC key is imported into the browser as nonextractable. A local policy parser checks consistency; the Tide network remains responsible for authenticating signatures and enforcing cryptographic authority.

## Implementation status and remaining integration

The application foundation, seven-screen interface, persistent APIs and browser cryptographic helpers are implemented. A separate sample workspace includes account matches, reports, disclosure requests, member voting, audit events and browser encryption for presentation. Production builds and 19 backend/security tests have passed. Local TideCloak provisioning and the exported app adapter provide the integration base; they do not by themselves prove live consortium encryption or approval enforcement.

Live operation still requires completing Tide identity enrolment, assigning capabilities, issuing real signed policies and verifying cross-user access on the deployed network. Evidence decryption stays unavailable until a Tide-reviewed policy/contract enforces the required organisation quorum, requester binding and expiry. Governance also requires a verified committed-membership flow. These capabilities must remain visibly unavailable until their live integration tests pass. Expiry prevents future authorised decrypt operations; it cannot erase plaintext already received by a user.
