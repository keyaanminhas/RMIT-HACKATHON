export type Role = 'vault-analyst'|'vault-approver'|'vault-admin'|'vault-operator';
export interface Session { userId:string; displayName:string; orgId:string; orgName:string; roles:string[];tideUserKey?:string }
export interface Capabilities { authentication:boolean; sharedEncryption:boolean; disclosurePolicy:boolean; governancePolicy:boolean; reasons:string[] }
export interface CipherEnvelope { version:1; scheme:'tide-policy'; tag:'tier1'|'evidence'|'index-key'; ciphertext:string; policyId:string }
export interface Report { id:string; reportingOrgId:string; reportingOrgName?:string; indexHash:string; tier1Ciphertext:CipherEnvelope; createdAt:string }
export interface LookupReport extends Report { reasonCode:string; severity:string; reportDate:string }
export interface Decision {orgId:string;userId:string;decision:'approve'|'deny';createdAt:string}
export interface Disclosure { id:string;reportId:string;requesterUserId:string;requesterOrgId:string;caseReference:string;status:'pending'|'approved'|'denied'|'expired';createdAt:string;expiresAt:string|null;decisions:Decision[] }
export interface Proposal {id:string;kind:'admit_member'|'change_rule';title:string;status:string;createdAt:string;threshold:number;votes:{orgId:string;userId:string;choice:'yes'|'no'}[];payload:string}
export interface AuditEvent {id:string;ts:string;actorUserId:string;actorOrgId:string;action:string;targetId:string;result:string;previousHash:string;hash:string}
export const REASON_CODES=['MULE_ACCOUNT','SCAM_PAYEE','PHISHING_SENDER','MONEY_LAUNDERING','SYNTHETIC_ID'] as const;
export const SEVERITIES=['LOW','MEDIUM','HIGH','CRITICAL'] as const;
