'use client';
import type {Disclosure,Proposal,LookupReport,Report,CipherEnvelope} from './types';
import {REASON_CODES,SEVERITIES} from './types';
import {decryptShared,encryptShared,hashAccountIdentifier,importIndexKey,type SignedPolicyEnvelope,type TideCryptoSdk} from './tide/shared-crypto';
export {useVault} from './vault-context';
export class VaultApiError extends Error {constructor(public code:string,message:string,public status:number){super(message);}}
let secureTransport:((url:string,init?:RequestInit)=>Promise<Response>)|null=null;
let cryptoSdk:TideCryptoSdk|null=null;
let submittingUserKey:string|undefined;
export function setTransport(transport:typeof secureTransport){secureTransport=transport;}
export function setCryptoSdk(sdk:TideCryptoSdk|null,userKey?:string){cryptoSdk=sdk;submittingUserKey=sdk?userKey:undefined;}
export async function api<T=unknown>(path:string,options:RequestInit={}):Promise<T>{
 if(!path.startsWith('/api/')||path.startsWith('//'))throw new Error('Only local API routes are allowed.');
 if(!secureTransport)throw new VaultApiError('AUTHENTICATION_REQUIRED','Sign in with TideCloak before continuing.',401);
 const response=await secureTransport(new URL(path,window.location.origin).href,{...options,cache:'no-store',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 const data=await response.json().catch(()=>{throw new VaultApiError('INVALID_RESPONSE','The service returned an unreadable response. Please retry.',response.status);});if(!response.ok)throw new VaultApiError(data.error?.code??'REQUEST_FAILED',data.error?.message??'Request failed.',response.status);return data as T;
}
const post=<T>(path:string,value:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(value)});
interface CryptoSetup {indexKey:{envelope:CipherEnvelope;policy:SignedPolicyEnvelope};tier1Policy:SignedPolicyEnvelope;evidencePolicy?:SignedPolicyEnvelope}
async function cryptoSetup(){if(!cryptoSdk)throw new VaultApiError('AUTHENTICATION_REQUIRED','Sign in before using cryptography.',401);return {sdk:cryptoSdk,setup:await api<CryptoSetup>('/api/crypto-config')};}
async function accountHash(account:string,sdk:TideCryptoSdk,setup:CryptoSetup){
 const plaintext=await decryptShared(sdk,setup.indexKey.envelope,setup.indexKey.policy);
 if(!/^[A-Za-z0-9+/]{43}=$/.test(plaintext))throw new Error('The decrypted consortium index key has an invalid format.');
 const raw=Uint8Array.from(atob(plaintext),v=>v.charCodeAt(0));try{return await hashAccountIdentifier(account,await importIndexKey(raw));}finally{raw.fill(0);}
}
export async function fileReport(input:{account:string;reasonCode:string;severity:string;evidence:string}){
 if(!REASON_CODES.some(v=>v===input.reasonCode)||!SEVERITIES.some(v=>v===input.severity)||!input.evidence.trim()||input.evidence.length>100000)throw new Error('Choose a valid reason and severity and enter evidence of at most 100,000 characters.');
 const {sdk,setup}=await cryptoSetup();
 if(!setup.evidencePolicy)throw new VaultApiError('CAPABILITY_UNAVAILABLE','A signed write-only Tide policy for this report and submitting identity is required. No report data was sent.',503);
 // Evidence must use a distinct record assignment and a write-only policy;
 // granting the writer a decrypt role would weaken future disclosure controls.
 const evidenceCiphertext=await encryptShared(sdk,{tag:'evidence',data:input.evidence,policy:setup.evidencePolicy,submittingUserKey});
 const indexHash=await accountHash(input.account,sdk,setup);
 const tier1Ciphertext=await encryptShared(sdk,{tag:'tier1',data:JSON.stringify({reasonCode:input.reasonCode,severity:input.severity,reportDate:new Date().toISOString()}),policy:setup.tier1Policy});
 return post<{report:Report}>('/api/reports',{indexHash,tier1Ciphertext,evidenceCiphertext,submissionId:crypto.randomUUID()});
}
export async function lookup(account:string):Promise<{reports:LookupReport[]}>{
 const {sdk,setup}=await cryptoSetup();const indexHash=await accountHash(account,sdk,setup);const {reports}=await post<{reports:Report[]}>('/api/lookup',{indexHash});
 return {reports:await Promise.all(reports.map(async report=>{
  const payload:unknown=JSON.parse(await decryptShared(sdk,report.tier1Ciphertext,setup.tier1Policy));
  if(!payload||typeof payload!=='object')throw new Error('Decrypted report metadata is invalid.');const data=payload as Record<string,unknown>;
  if(typeof data.reasonCode!=='string'||!REASON_CODES.some(v=>v===data.reasonCode)||typeof data.severity!=='string'||!SEVERITIES.some(v=>v===data.severity)||typeof data.reportDate!=='string'||Number.isNaN(Date.parse(data.reportDate)))throw new Error('Decrypted report metadata is invalid.');
  return {...report,reasonCode:data.reasonCode,severity:data.severity,reportDate:data.reportDate};
 }))};
}
export const requestDisclosure=(reportId:string,caseReference:string)=>post<{disclosure:Disclosure}>('/api/disclosures',{reportId,caseReference});
export const decideDisclosure=(id:string,decision:'approve'|'deny')=>post<{disclosure:Disclosure}>('/api/disclosures/'+encodeURIComponent(id)+'/decision',{decision});
export const createProposal=(input:{kind:'admit_member'|'change_rule';title:string;organisationName?:string;organisationKind?:string;quorum?:number})=>post<{proposal:Proposal}>('/api/proposals',input);
export const voteProposal=(id:string,choice:'yes'|'no')=>post<{proposal:Proposal}>('/api/proposals/'+encodeURIComponent(id)+'/vote',{choice});
export async function readEvidence(id:string):Promise<{evidence:string;expiresAt:string}>{
 if(!cryptoSdk)throw new VaultApiError('AUTHENTICATION_REQUIRED','Sign in to request evidence.',401);
 const grant=await api<{evidenceCiphertext:CipherEnvelope;policy:SignedPolicyEnvelope;expiresAt:string}>('/api/disclosures/'+encodeURIComponent(id)+'/evidence');
 if(Date.parse(grant.expiresAt)<=Date.now())throw new VaultApiError('ACCESS_EXPIRED','Evidence access has expired.',403);
 return {evidence:await decryptShared(cryptoSdk,grant.evidenceCiphertext,grant.policy),expiresAt:grant.expiresAt};
}
