# NeutralVault Tide policy integration

## Current boundary

`app/src/lib/tide/shared-crypto.ts` implements real browser calls to the Tide SDK with signed policy bytes. It does not enable shared-encryption, disclosure or governance capability flags. The running realm, signed policy issuance and cross-user network tests must succeed before those capabilities can be reported as available.

The helper includes a policy constructor, the official admin-enclave signing sequence, policy-envelope consistency checks, policy-controlled encryption/decryption and HMAC indexing. Parsing a policy and finding a nonempty signature **does not verify the signature**. The Tide network verifies signatures, subjects, capabilities, tags and expiry. A fabricated signature must fail there.

Evidence can be sealed using a signed **write-only User** `RelationshipAttestation:1` policy naming the submitting identity and evidence record. This grants encryption only: it must never contain `_tide_decryptor`, and a role/group/read-write policy is rejected for evidence filing. Evidence decryption intentionally throws because `RelationshipAttestation:1` alone cannot enforce NeutralVault's distinct-organisation approval rules. A UI guard is not cryptographic enforcement. Do not issue a built-in relationship read policy for evidence or use metadata/role policies to make a demo work.

## Supported relationship configuration

Use the realm's actual exported adapter vendorId. Confirm with Tide that its ORKs support `RelationshipAttestation:1` revision 3 and expiry-bearing policy version 4. Installed `@tideorg/js` 0.14.29 has `Models.Policy.latestVersion === "4"`; never hard-code the older documentation's version 3.

1. Enable IGA and enrol an actual Tide identity with `tide-realm-admin`. A bootstrap Keycloak username/password alone is not an enclave signing identity.
2. Add the `tideUserKey` mapper to the application client. For group subjects, map full-path groups into the access-token claim named exactly `groups`.
3. Create realm capability roles `_tide_encryptor` and `_tide_decryptor`. Explicitly grant only required capabilities to participating identities; never place them in default roles. Application roles such as `vault-analyst` do not replace these capabilities. Sign in again after role/group changes.
4. For consortium metadata and the shared index key, use a subject realm role whose members are eligible readers. Use read-only grants for readers and write grants for creators. Every policy applies to a single `recordId`; the actual encrypted item's only SDK tag must equal that recordId. Allocate **different crypto record IDs** for each report's Tier-1 metadata and evidence, and for the consortium index key. Never issue a metadata/index read policy for an evidence record ID.
5. Store only signed policies and ciphertext server-side. An authenticated policy endpoint must verify token, DPoP, organisation membership and policy applicability. Record user subjects from the verified `tideuserkey` claim; group IDs must match the full `groups` path, and role subjects must distinguish realm and client roles.

### Admin grant issuance

Fetch the existing signed realm admin policy server-side, using the authenticated admin's token:

`GET {auth-server-url}/admin/realms/{realm}/iga/role-policies/name/tide-realm-admin`

The response's `policy` field is base64. Restrict any application proxy to verified realm admins; do not supply bootstrap/service-account credentials to the browser. Decode the policy field into bytes and pass it to `signRelationshipPolicy(grant, adminPolicyBytes)` from a direct user click. Allow the enclave popup. The helper follows the vendored relationship template:

- Build a PRIVATE, IMPLICIT relationship policy for both `PolicyEnabledEncryption:1` and `PolicyEnabledDecryption:1`, using `Policy.latestVersion`.
- Set string parameters `subjectType`, `subjectId`, `assignmentId` and `roles`. The roles parameter is a JSON **string** containing `_tide_encryptor`, `_tide_decryptor`, or both. Only client-role subjects include `clientId`.
- Create `PolicySignRequest.New(policy)`, initialise with `createTideRequest`, request operator approval, attach the admin policy to the approved request and execute its signing request.
- Store the returned signed base64 only after server-side metadata checks. Never accept arbitrary browser claims of granted roles or signed-policy validity.

The signing bridge uses `IAMService._tc`, as the official template does; this is an internal API. Recheck its implementation and run a live issuance test on every SDK update. Add explicit direct dependencies on `@tideorg/js`, `@tidecloak/js` and `heimdall-tide` when maintaining the application package.

### Browser helper interfaces

- `buildRelationshipPolicy(grant)` returns an **unsigned** SDK policy draft.
- `signRelationshipPolicy(grant, adminPolicyBytes)` returns the network-signed policy base64 after real admin approval.
- `SignedPolicyEnvelope`: `id`, `policyB64`, `vendorId`, `recordId`, `subject`, `access`, optional `expiresAt` in Unix seconds. The envelope must exactly match the signed bytes; it does not create or extend authority.
- `encryptShared(sdk, {tag, data, policy, submittingUserKey?})` returns the backend's `CipherEnvelope` (`version`, `scheme`, `tag`, `ciphertext`, `policyId`). `tag` is a UI/storage classification; only `policy.recordId` is forwarded as the single Tide SDK tag. For `evidence`, `submittingUserKey` is required, must match the signed User subject, and policy access must be `write`. Read the current identity key from its actual `tideuserkey` claim, never a role switch or mock profile. The Tide network independently checks the executor against the signed subject; the string supplied here is only a local consistency check.
- `decryptShared(sdk, envelope, policy)` checks binding and forwards the actual signed bytes. It currently supports index-key and Tier-1 relationships only. It never decrypts on the server.
- `importIndexKey(raw32Bytes)` creates a nonextractable HMAC-SHA256 browser CryptoKey. Clear the decrypted raw byte buffer after importing. Do not persist it, send it to an API or log it.
- `hashAccountIdentifier(account, key)` returns lowercase SHA256 HMAC hex. Normalisation trims whitespace, removes whitespace/hyphen separators, uppercases alphanumerics and preserves leading zeroes; 4–64 characters are accepted. Domain separation is `NeutralVault:account:v1:`. All members must use the identical normalisation and same signed-policy-protected shared key.

Tier-1 plaintext must include reason, severity and report date inside the encrypted payload. Encryption must complete in the browser before submission; no plaintext key, account identifier or evidence enters the report API. Do not introduce a server decoder or identity self-encryption fallback.

The current ciphertext interface stores a `policyId` without a separate authenticated record binding. The helper therefore requires the same policy ID on encryption and decryption: a shared role's read-write policy supports cross-user access for that role. Distinct writer/reader policies need a policy store that authenticates both grants' common vendor/record relationship before extending this interface. Do not rewrite a ciphertext envelope's policy ID to bypass the check. Keep a separate index-key read-write policy available only to the initial authorised key creator; supply a durable read policy through the future authenticated binding workflow before exposing the shared index service.

## Disclosure and membership enforcement still required

The built-in relationship contract authorises a named user, group or role for a record. It does not prove two approvals came from different organisations, require the reporter, forbid the requester, or commit consortium membership by strict majority. Local database votes cannot authorise network key release.

Arrange Tide-reviewed deployment of an appropriate custom Forseti contract and signed membership-state flow. The network must bind report/ciphertext identity, requester user key and organisation, reporting organisation, case/request identity, distinct approver organisations and the committed policy version. Require reporter approval plus an unrelated nonrequester organisation, reject duplicate organisations and requester approval, and enforce a signed expiry 30 minutes after commitment. Admission/rule changes require a strict majority of the eligible committed membership snapshot, with replay protection and exact proposal payload binding. A numeric threshold role policy alone cannot establish organisation diversity.

The exact deployed contract/model IDs, signed commitment representation and request-building interface are integration prerequisites, not placeholders to invent. Custom deployment is experimental and performed by the Tide team; do not fabricate a contract ID or bypass this step with an application flag. Previously released plaintext cannot be retroactively erased at expiry.

## Verification gates

Before enabling shared capability, run against independent browser profiles and identities:

1. A granted author encrypts; a different eligible member decrypts using its applicable signed relationship policy.
2. Wrong record tag, two tags, fabricated signature, wrong vendor, wrong user subject and expired policy all fail. Do not retry policy refusals as connectivity failures.
3. Nonmember group/role subjects fail. Removing `_tide_decryptor` and signing in again prevents decryption. A read-only policy cannot encrypt.
4. Confirm SDK requests include the signed bytes and exactly one tag. Inspect persisted records/logs/network calls for plaintext leakage.
5. For disclosure, direct SDK calls with copied ciphertext must fail for the requester before commitment, another user after commitment, and the requester after the signed 30-minute expiry. Test duplicate-organisation and missing-reporter approvals at the network boundary.
6. For governance, bypass application routes and show that under-quorum, stale/replayed and self-grant requests cannot change committed membership or issuance authority.

## Sources and limits

- Official local `.tide-pack/templates/relationship-attestation/README.md` and `relationship.ts`: subject mapping, realm capabilities, single-tag rules, admin-policy endpoint and signing sequence. The pack states the helper itself typechecks but was not executed; live tests remain necessary here.
- Installed application SDK declarations/source: `@tideorg/js` 0.14.29 `Models/Policy` and `@tidecloak/react` context declarations verify policy version 4, optional signed expiry and `doEncrypt`/`doDecrypt` policy-byte forwarding.
- [Tide MCP](https://mcp.tide.org/mcp), `tide_canon(name="custom-contracts", section="Deploying a Contract")`, consulted 2026-10-22: deployment is performed by Tide; built-in contracts are not organisation-quorum logic. Older examples hard-code policy version 3; installed SDK takes precedence.
- [Official encryption setup](https://docs.tide.org/Admin/e2ee) and [licensing setup](https://docs.tide.org/Admin/license): realm prerequisites. These links provide navigation; the local template and current SDK are the implementation evidence used above.
