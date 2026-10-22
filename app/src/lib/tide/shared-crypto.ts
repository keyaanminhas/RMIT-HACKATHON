'use client';

import { Models } from '@tideorg/js';
import type { CipherEnvelope } from '../types';

export const RELATIONSHIP_CONTRACT_ID = 'RelationshipAttestation:1';
export const ENCRYPT_ROLE = '_tide_encryptor';
export const DECRYPT_ROLE = '_tide_decryptor';

/** A structural subset of useTideCloak(), so no credential ever leaves its enclave. */
export interface TideCryptoSdk {
  doEncrypt(data: { data: string; tags: string[] }[], policy?: Uint8Array): Promise<unknown>;
  doDecrypt(data: { encrypted: string; tags: string[] }[], policy?: Uint8Array): Promise<unknown>;
}

export type RelationshipSubject =
  | { type: 'User'; id: string }
  | { type: 'Group'; id: string }
  | { type: 'Role'; id: string; clientId?: string };

/** expiresAt is Unix seconds, copied from the signed policy, never a local TTL. */
export interface SignedPolicyEnvelope {
  id: string;
  policyB64: string;
  vendorId: string;
  recordId: string;
  subject: RelationshipSubject;
  access: 'read' | 'write' | 'read-write';
  expiresAt?: number;
}

export type RelationshipGrant = Omit<SignedPolicyEnvelope, 'id' | 'policyB64'>;

/** Unsigned policy draft; the admin's enclave and Tide network must approve/sign it. */
export function buildRelationshipPolicy(grant: RelationshipGrant) {
  browserCrypto();
  if (!grant.vendorId || !grant.recordId || !grant.subject.id ||
      !['User', 'Group', 'Role'].includes(grant.subject.type)) throw new Error('Invalid relationship grant.');
  const roles = grant.access === 'read' ? [DECRYPT_ROLE] : grant.access === 'write' ? [ENCRYPT_ROLE]
    : grant.access === 'read-write' ? [ENCRYPT_ROLE, DECRYPT_ROLE] : [];
  if (!roles.length) throw new Error('Invalid relationship access.');
  if (grant.expiresAt !== undefined && (!Number.isSafeInteger(grant.expiresAt) ||
      grant.expiresAt <= Math.floor(Date.now() / 1000))) throw new Error('Grant expiry must be in the future (Unix seconds).');
  return new Models.Policy({
    version: Models.Policy.latestVersion,
    contractId: RELATIONSHIP_CONTRACT_ID,
    modelId: ['PolicyEnabledEncryption:1', 'PolicyEnabledDecryption:1'],
    keyId: grant.vendorId,
    approvalType: Models.ApprovalType.IMPLICIT,
    executionType: Models.ExecutionType.PRIVATE,
    params: new Map<string, string>([
      ['subjectType', grant.subject.type], ['subjectId', grant.subject.id],
      ['assignmentId', grant.recordId], ['roles', JSON.stringify(roles)],
      ...(grant.subject.type === 'Role' && grant.subject.clientId
        ? [['clientId', grant.subject.clientId] as [string, string]] : []),
    ]),
    ...(grant.expiresAt !== undefined ? { expiry: grant.expiresAt } : {}),
  });
}

/**
 * Call directly from an admin click (requires an enclave popup).
 * Uses the official relationship template's internal-client bridge; verify on SDK upgrades.
 * This grants one relationship, NOT NeutralVault's disclosure or governance quorum.
 */
export async function signRelationshipPolicy(grant: RelationshipGrant, adminPolicy: Uint8Array): Promise<string> {
  const policy = buildRelationshipPolicy(grant);
  if (!adminPolicy.length) throw new Error('The signed realm-admin policy is required.');
  const [{ IAMService }, { PolicySignRequest }] = await Promise.all([import('@tidecloak/js'), import('heimdall-tide')]);
  interface SigningClient {
    createTideRequest(request: Uint8Array): Promise<Uint8Array>;
    requestTideOperatorApproval(requests: { id: string; request: Uint8Array }[]): Promise<{
      id: string; request: Uint8Array; status: 'approved' | 'denied' | 'pending';
    }[]>;
    executeSignRequest(request: Uint8Array, waitForAll?: boolean): Promise<Uint8Array[]>;
  }
  const client = (IAMService as unknown as { _tc: SigningClient | null })._tc;
  if (!client) throw new Error('Sign in with TideCloak before requesting a policy grant.');
  const request = PolicySignRequest.New(policy);
  request.setCustomExpiry(604800);
  const initialized = await client.createTideRequest(request.encode());
  const id = Models.BaseTideRequest.decode(initialized).getUniqueId();
  const approvals = await client.requestTideOperatorApproval([{ id, request: initialized }]);
  const approval = approvals.find(item => item.id === id);
  if (!approval || approval.status !== 'approved') throw new Error(`Tide grant is ${approval?.status ?? 'not approved'}.`);
  const approved = Models.BaseTideRequest.decode(approval.request);
  approved.addPolicy(adminPolicy);
  const signatures = await client.executeSignRequest(approved.encode(), true);
  if (!signatures[0]?.length) throw new Error('Tide returned no policy signature.');
  policy.signature = signatures[0];
  return encodeBase64(policy.toBytes());
}

function browserCrypto(): Crypto {
  if (typeof window === 'undefined' || !globalThis.crypto?.subtle) {
    throw new Error('Tide cryptography must run in a secure browser context.');
  }
  return globalThis.crypto;
}

function decodeBase64(value: string): Uint8Array {
  if (!value || value.length > 1_500_000 || value.length % 4 !== 0 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error('Expected canonical base64 signed Tide policy bytes.');
  }
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

/** Structural inspection ONLY. Signature authentication is performed by the Tide network. */
export function describeRelationshipPolicy(policyB64: string) {
  const policy = Models.Policy.from(decodeBase64(policyB64));
  const stringParam = (name: string) => {
    const value: unknown = policy.params.entries.get(name);
    if (typeof value !== 'string') throw new Error(`Missing string policy parameter: ${name}.`);
    return value;
  };
  const subjectType = stringParam('subjectType');
  if (!['User', 'Group', 'Role'].includes(subjectType)) throw new Error('Unsupported policy subject.');
  const roles: unknown = JSON.parse(stringParam('roles'));
  if (!Array.isArray(roles) || roles.length === 0 ||
      roles.some(role => role !== ENCRYPT_ROLE && role !== DECRYPT_ROLE) ||
      new Set(roles).size !== roles.length) throw new Error('Invalid relationship policy operations.');
  const rawClientId: unknown = policy.params.entries.get('clientId');
  if (rawClientId !== undefined && (subjectType !== 'Role' || typeof rawClientId !== 'string')) {
    throw new Error('Invalid relationship client role binding.');
  }
  const expiry = policy.expiry === undefined ? undefined : Number(policy.expiry);
  if (expiry !== undefined && (!Number.isSafeInteger(expiry) || expiry <= 0)) {
    throw new Error('Invalid signed policy expiry.');
  }
  return {
    contractId: policy.contractId,
    modelIds: [...policy.modelIds],
    vendorId: policy.keyId,
    subjectType,
    subjectId: stringParam('subjectId'),
    clientId: rawClientId as string | undefined,
    recordId: stringParam('assignmentId'),
    roles: roles as string[],
    expiresAt: expiry,
    hasSignature: !!policy.signature?.length,
    isPrivate: policy.executionType === Models.ExecutionType.PRIVATE,
    isImplicit: policy.approvalType === Models.ApprovalType.IMPLICIT,
  };
}

/** Rejects metadata drift; does NOT establish that a signature is genuine or a contract is live. */
export function validateRelationshipPolicy(envelope: SignedPolicyEnvelope, operation: 'encrypt' | 'decrypt'): Uint8Array {
  browserCrypto();
  if (!envelope.id || !envelope.vendorId || !envelope.recordId || !envelope.subject.id) {
    throw new Error('Policy identity, vendor, record and subject are required.');
  }
  const policy = describeRelationshipPolicy(envelope.policyB64);
  const expectedRoles = envelope.access === 'read' ? [DECRYPT_ROLE]
    : envelope.access === 'write' ? [ENCRYPT_ROLE]
    : envelope.access === 'read-write' ? [ENCRYPT_ROLE, DECRYPT_ROLE] : [];
  const expectedClientId = envelope.subject.type === 'Role' ? envelope.subject.clientId : undefined;
  if (!policy.hasSignature || policy.contractId !== RELATIONSHIP_CONTRACT_ID ||
      !policy.isPrivate || !policy.isImplicit || policy.vendorId !== envelope.vendorId ||
      policy.recordId !== envelope.recordId || policy.subjectType !== envelope.subject.type ||
      policy.subjectId !== envelope.subject.id || policy.clientId !== expectedClientId ||
      policy.expiresAt !== envelope.expiresAt || expectedRoles.length !== policy.roles.length ||
      policy.roles.some(role => !expectedRoles.includes(role)) ||
      !policy.modelIds.includes(operation === 'encrypt' ? 'PolicyEnabledEncryption:1' : 'PolicyEnabledDecryption:1')) {
    throw new Error('Signed Tide policy does not match the expected relationship grant.');
  }
  if (policy.expiresAt !== undefined && policy.expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('Tide policy has expired.');
  }
  if (!policy.roles.includes(operation === 'encrypt' ? ENCRYPT_ROLE : DECRYPT_ROLE)) {
    throw new Error(`Policy does not permit ${operation}.`);
  }
  return decodeBase64(envelope.policyB64);
}

function singleSdkResult(result: unknown): string | Uint8Array {
  if (!Array.isArray(result) || result.length !== 1 ||
      (typeof result[0] !== 'string' && !(result[0] instanceof Uint8Array))) {
    throw new Error('Tide returned an unexpected cryptographic response.');
  }
  return result[0] as string | Uint8Array;
}

/** The sole SDK tag is assignmentId, not the UI's tier1/evidence/index-key classification. */
export async function encryptShared(sdk: TideCryptoSdk, input: {
  tag: CipherEnvelope['tag']; data: string; policy: SignedPolicyEnvelope;
  /** Current identity's tideuserkey claim, required for sealed evidence submission. */
  submittingUserKey?: string;
}): Promise<CipherEnvelope> {
  if (input.tag === 'evidence' && (input.policy.access !== 'write' ||
      input.policy.subject.type !== 'User' || !input.submittingUserKey ||
      input.policy.subject.id !== input.submittingUserKey)) {
    throw new Error('Evidence must use a write-only Tide policy bound to the submitting user.');
  }
  const policy = validateRelationshipPolicy(input.policy, 'encrypt');
  const result = singleSdkResult(await sdk.doEncrypt([{ data: input.data, tags: [input.policy.recordId] }], policy));
  return { version: 1, scheme: 'tide-policy', tag: input.tag,
    ciphertext: typeof result === 'string' ? result : encodeBase64(result), policyId: input.policy.id };
}

export async function decryptShared(sdk: TideCryptoSdk, envelope: CipherEnvelope, policy: SignedPolicyEnvelope): Promise<string> {
  // RelationshipAttestation proves subject access, not NeutralVault's distinct-organisation quorum.
  // Never silently release evidence under a weaker policy, even after a database says approved.
  if (envelope.tag === 'evidence') {
    throw new Error('Evidence release requires a verified Tide disclosure quorum contract; integration is not available.');
  }
  if (envelope.version !== 1 || envelope.scheme !== 'tide-policy' || envelope.policyId !== policy.id || !envelope.ciphertext) {
    throw new Error('Ciphertext does not match its Tide policy.');
  }
  const bytes = validateRelationshipPolicy(policy, 'decrypt');
  const result = singleSdkResult(await sdk.doDecrypt([{ encrypted: envelope.ciphertext, tags: [policy.recordId] }], bytes));
  return typeof result === 'string' ? result : new TextDecoder('utf-8', { fatal: true }).decode(result);
}

/** Preserve leading zeroes; permit visual whitespace/hyphen separators only. */
export function normalizeAccountIdentifier(account: string): string {
  const value = account.trim().replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{4,64}$/.test(value)) throw new Error('Enter a valid 4–64 character account identifier.');
  return value;
}

/** Import only a browser-decrypted shared key. Never persist or transmit the raw bytes. */
export async function importIndexKey(raw: Uint8Array): Promise<CryptoKey> {
  if (raw.byteLength !== 32) throw new Error('The consortium index key must contain 32 bytes.');
  return browserCrypto().subtle.importKey('raw', Uint8Array.from(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function hashAccountIdentifier(account: string, key: CryptoKey): Promise<string> {
  const crypto = browserCrypto();
  const algorithm = key.algorithm as HmacKeyAlgorithm;
  if (key.type !== 'secret' || key.extractable || algorithm.name !== 'HMAC' ||
      algorithm.hash?.name !== 'SHA-256' || algorithm.length !== 256 || !key.usages.includes('sign')) {
    throw new Error('Use a non-extractable 256-bit HMAC-SHA256 consortium index key.');
  }
  const input = new TextEncoder().encode(`NeutralVault:account:v1:${normalizeAccountIdentifier(account)}`);
  const digest = await crypto.subtle.sign('HMAC', key, input);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
