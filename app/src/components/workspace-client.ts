'use client';

import { useSyncExternalStore } from 'react';
import * as live from '@/lib/client';
import type { Session } from '@/lib/types';

let active = false;
let actor = 'bank-b';
let version = 0;
const listeners = new Set<() => void>();
const emit = () => { version++; for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const orgNames: Record<string, string> = { 'bank-a': 'Bank A', 'bank-b': 'Bank B', 'telco-c': 'Telco C', operator: 'Sample operator' };
export function useSampleWorkspace() {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return { active, actor, start: () => { active = true; actor = 'bank-b'; emit(); }, exit: () => { active = false; emit(); }, setActor: (value: string) => { actor = value; emit(); } };
}
export function useVault() {
  const real = live.useVault();
  const sample = useSampleWorkspace();
  const session: Session = { userId: `sample-${actor}`, displayName: actor === 'operator' ? 'Sample operator' : 'Sample analyst', orgId: actor, orgName: orgNames[actor], roles: actor === 'operator' ? ['vault-operator'] : ['vault-analyst', 'vault-approver', 'vault-admin'] };
  return sample.active ? { session, capabilities: { authentication: false, sharedEncryption: true, disclosurePolicy: true, governancePolicy: true, reasons: [] }, loading: false, error: null, login: async () => { sample.exit(); }, logout: async () => { sample.exit(); }, refresh: async () => { emit(); } } : real;
}

type SampleReport = { id: string; reportingOrgId: string; reportingOrgName: string; indexHash: string; tier1Ciphertext: unknown; evidenceCiphertext: unknown; createdAt: string; reasonCode: string; severity: string; reportDate: string; account: string; evidence: string };
type SampleDisclosure = { id: string; reportId: string; requesterUserId: string; requesterOrgId: string; caseReference: string; status: string; createdAt: string; expiresAt: string | null; decisions: { orgId: string; userId: string; decision: string; createdAt: string }[] };
type SampleProposal = { id: string; kind: string; title: string; status: string; createdAt: string; threshold: number; votes: { orgId: string; userId: string; choice: string }[]; payload: string };
type SampleAudit = { id: string; ts: string; actorUserId: string; actorOrgId: string; action: string; targetId: string; result: string; previousHash: string; hash: string };
let reports: SampleReport[] = [];
let disclosures: SampleDisclosure[] = [];
let proposals: SampleProposal[] = [];
let events: SampleAudit[] = [];
let members = 3;
let key: CryptoKey;
let hashKey: CryptoKey;
let boot: Promise<void> | null = null;
const text = new TextEncoder();
const normalise = (value: string) => value.replace(/\s+/g, '').toUpperCase();
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
const base64 = (buffer: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
async function index(account: string) { return hex(await crypto.subtle.sign('HMAC', hashKey, text.encode(normalise(account)))); }
async function encrypt(value: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); return { scheme: 'browser-aes-gcm', iv: base64(iv), ciphertext: base64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, text.encode(value))) }; }
async function record(action: string, targetId: string, result: string) {
  const previousHash = events[0]?.hash || '0'.repeat(64);
  const event = { id: `SAMPLE-EVT-${events.length + 1}`, ts: new Date().toISOString(), actorUserId: `sample-${actor}`, actorOrgId: actor, action, targetId, result, previousHash };
  const hash = hex(await crypto.subtle.digest('SHA-256', text.encode(JSON.stringify(event))));
  events.unshift({ ...event, hash });
}
function initialise() {
  if (!boot) boot = (async () => {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    hashKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const seeds = [
      ['0189 4420 1173', 'bank-a', 'MULE_ACCOUNT', 'CRITICAL', 'Synthetic case NV-66997-A: six rapid pass-through transfers from three test accounts, followed by attempted cash-out. This is fictional evidence for the sample workspace.'],
      ['6012 9988 7766', 'telco-c', 'PHISHING_SENDER', 'HIGH', 'Synthetic telco review: a test SIM sent a burst of fake banking verification links. No real phone subscriber or customer is represented.'],
      ['7731 8800 2219', 'bank-a', 'SCAM_PAYEE', 'MEDIUM', 'Synthetic e-commerce deposit case. Multiple test deposits were collected into a secondary account.'],
      ['8829 1044 9921', 'bank-b', 'MONEY_LAUNDERING', 'HIGH', 'Synthetic transaction pattern: repeated transfers across a small set of test accounts.'],
      ['0189 4420 1173', 'telco-c', 'SYNTHETIC_ID', 'LOW', 'A second fictional indicator for the same test identifier, demonstrating multiple matches.'],
    ];
    for (let i = 0; i < seeds.length; i++) {
      const [account, org, reasonCode, severity, evidence] = seeds[i];
      const createdAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      reports.push({ id: `NV-${2048 - i}`, reportingOrgId: org, reportingOrgName: orgNames[org], indexHash: await index(account), tier1Ciphertext: await encrypt(JSON.stringify({ reasonCode, severity, createdAt })), evidenceCiphertext: await encrypt(evidence), createdAt, reasonCode, severity, reportDate: createdAt, account, evidence });
    }
    const now = new Date().toISOString();
    disclosures = [{ id: 'DSC-902', reportId: 'NV-2048', requesterUserId: 'sample-bank-b', requesterOrgId: 'bank-b', caseReference: 'SAMPLE-BNKB-114', status: 'pending', createdAt: now, expiresAt: null, decisions: [{ orgId: 'bank-a', userId: 'sample-bank-a', decision: 'approve', createdAt: now }] }, { id: 'DSC-901', reportId: 'NV-2047', requesterUserId: 'sample-bank-b', requesterOrgId: 'bank-b', caseReference: 'SAMPLE-BNKB-098', status: 'approved', createdAt: now, expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), decisions: [{ orgId: 'telco-c', userId: 'sample-telco-c', decision: 'approve', createdAt: now }, { orgId: 'bank-a', userId: 'sample-bank-a', decision: 'approve', createdAt: now }] }];
    proposals = [{ id: 'PROP-2026-04', kind: 'admit_member', title: 'Admit E-wallet D — PaySwift Digital', status: 'open', createdAt: now, threshold: 2, votes: [{ orgId: 'bank-a', userId: 'sample-bank-a', choice: 'yes' }], payload: JSON.stringify({ organisationName: 'E-wallet D', organisationKind: 'ewallet' }) }];
    for (const report of reports) await record('report_filed', report.id, 'Created');
    await record('disclosure_requested', 'DSC-902', 'Pending approvals');
  })();
  return boot;
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 180));
const requireMember = () => { if (actor === 'operator') throw new Error('The sample operator does not have member permissions.'); };
function storedReports() { return reports.map(({ account: _a, evidence: _e, reasonCode: _r, severity: _s, reportDate: _d, ...stored }) => stored); }
export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (!active) return live.api<T>(path, options);
  await initialise(); await pause();
  let response: unknown;
  if (path === '/api/dashboard') response = { reports: reports.length, organisations: members, pendingDisclosures: disclosures.filter((d) => d.status === 'pending').length, openProposals: proposals.filter((p) => p.status === 'open').length };
  else if (path === '/api/reports') response = { reports: storedReports() };
  else if (path === '/api/disclosures') response = { disclosures };
  else if (path === '/api/proposals') response = { proposals };
  else if (path === '/api/audit') {
    let previous = '0'.repeat(64); let chainValid = true;
    for (const event of [...events].reverse()) {
      const { hash, ...body } = event;
      const computed = hex(await crypto.subtle.digest('SHA-256', text.encode(JSON.stringify(body))));
      if (event.previousHash !== previous || computed !== hash) chainValid = false;
      previous = hash;
    }
    response = { events, chainValid };
  }
  else if (path === '/api/operator/dump') { await record('operator_dump', 'reports', 'Read'); response = { workspace: 'sample', keyLocation: 'browser memory only', reports: storedReports() }; }
  else if (path === '/api/operator/attempt') { await record('self_grant_blocked', 'sample-operator', 'Denied'); throw new Error('403 Forbidden — this sample workspace does not permit unilateral role grants or evidence approval.'); }
  else throw new Error('This action is not available in the sample workspace.');
  return response as T;
}
export async function lookup(account: string) {
  if (!active) return live.lookup(account);
  await initialise(); requireMember(); await pause();
  const hash = await index(account); const found = reports.filter((r) => r.indexHash === hash);
  await record('lookup', `hash:${hash.slice(0, 12)}`, found.length ? `${found.length} matches` : 'No match');
  return { reports: found.map(({ account: _account, evidence: _evidence, ...report }) => report) as unknown as Awaited<ReturnType<typeof live.lookup>>['reports'] };
}
export async function fileReport(input: Parameters<typeof live.fileReport>[0]) {
  if (!active) return live.fileReport(input);
  await initialise(); requireMember();
  const createdAt = new Date().toISOString(); const id = `NV-${2049 + reports.length - 5}`;
  reports.unshift({ id, reportingOrgId: actor, reportingOrgName: orgNames[actor], indexHash: await index(input.account), tier1Ciphertext: await encrypt(JSON.stringify({ reasonCode: input.reasonCode, severity: input.severity, createdAt })), evidenceCiphertext: await encrypt(input.evidence), createdAt, reasonCode: input.reasonCode, severity: input.severity, reportDate: createdAt, account: input.account, evidence: input.evidence });
  await record('report_filed', id, 'Created'); emit();
}
export async function requestDisclosure(reportId: string, caseReference: string) {
  if (!active) return live.requestDisclosure(reportId, caseReference);
  await initialise(); requireMember();
  if (disclosures.some((d) => d.reportId === reportId && d.requesterUserId === `sample-${actor}` && d.status === 'pending')) throw new Error('A pending request already exists for this report. Open Disclosures to review it.');
  const id = `DSC-${903 + disclosures.length - 2}`;
  disclosures.unshift({ id, reportId, requesterUserId: `sample-${actor}`, requesterOrgId: actor, caseReference, status: 'pending', createdAt: new Date().toISOString(), expiresAt: null, decisions: [] });
  await record('disclosure_requested', id, 'Pending approvals'); emit();
}
export async function decideDisclosure(id: string, decision: 'approve' | 'deny') {
  if (!active) return live.decideDisclosure(id, decision);
  await initialise(); requireMember(); const d = disclosures.find((v) => v.id === id);
  if (!d || d.status !== 'pending') throw new Error('This request is not awaiting a decision.');
  if (d.requesterOrgId === actor) throw new Error('The requesting organisation cannot approve or deny its own request.');
  if (d.decisions.some((v) => v.orgId === actor)) throw new Error('Your organisation already decided this request.');
  d.decisions.push({ orgId: actor, userId: `sample-${actor}`, decision, createdAt: new Date().toISOString() });
  if (decision === 'deny') d.status = 'denied';
  else if (d.decisions.filter((v) => v.decision === 'approve').length >= 2 && d.decisions.some((v) => v.orgId === reports.find((r) => r.id === d.reportId)?.reportingOrgId && v.decision === 'approve')) { d.status = 'approved'; d.expiresAt = new Date(Date.now() + 30 * 60000).toISOString(); }
  await record('disclosure_decided', id, humanDecision(decision)); emit();
}
const humanDecision = (value: string) => value === 'approve' ? 'Approved' : 'Denied';
export async function createProposal(input: Parameters<typeof live.createProposal>[0]) {
  if (!active) return live.createProposal(input);
  await initialise(); requireMember(); const id = `PROP-${proposals.length + 5}`;
  proposals.unshift({ id, kind: input.kind, title: input.title, status: 'open', createdAt: new Date().toISOString(), threshold: Math.floor(members / 2) + 1, votes: [], payload: JSON.stringify(input) });
  await record('proposal_opened', id, 'Open'); emit();
}
export async function voteProposal(id: string, choice: 'yes' | 'no') {
  if (!active) return live.voteProposal(id, choice);
  await initialise(); requireMember(); const p = proposals.find((v) => v.id === id);
  if (!p || p.status !== 'open') throw new Error('This proposal is no longer open.');
  if (p.votes.some((v) => v.orgId === actor)) throw new Error('Your organisation has already voted.');
  p.votes.push({ orgId: actor, userId: `sample-${actor}`, choice });
  if (p.votes.filter((v) => v.choice === 'yes').length >= p.threshold) { p.status = 'passed'; if (p.kind === 'admit_member') members++; }
  if (p.votes.filter((v) => v.choice === 'no').length >= p.threshold) p.status = 'rejected';
  await record('vote_cast', id, p.status === 'passed' ? 'Quorum met' : 'Recorded'); emit();
}
export async function readEvidence(id: string) {
  if (!active) return live.readEvidence(id);
  await initialise(); const d = disclosures.find((v) => v.id === id);
  if (!d || d.requesterUserId !== `sample-${actor}` || d.status !== 'approved' || !d.expiresAt || Date.now() >= new Date(d.expiresAt).valueOf()) throw new Error('Evidence access is not available for this sample member.');
  const report = reports.find((r) => r.id === d.reportId)!;
  const envelope = report.evidenceCiphertext as { iv: string; ciphertext: string };
  const decode = (v: string) => Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
  const evidence = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.ciphertext)));
  await record('evidence_viewed', id, 'Opened');
  return { evidence, expiresAt: d.expiresAt };
}
