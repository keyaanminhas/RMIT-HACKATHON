import {z} from 'zod';
export const envelope=z.object({version:z.literal(1),scheme:z.literal('tide-policy'),tag:z.enum(['tier1','evidence','index-key']),ciphertext:z.string().min(32).max(1500000).regex(/^[A-Za-z0-9+/=_-]+$/),policyId:z.string().min(1).max(200)}).strict();
export const reportBody=z.object({indexHash:z.string().regex(/^[a-f0-9]{64}$/),tier1Ciphertext:envelope.refine(e=>e.tag==='tier1'),evidenceCiphertext:envelope.refine(e=>e.tag==='evidence'),submissionId:z.uuid()}).strict();
export const lookupBody=z.object({indexHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export const disclosureBody=z.object({reportId:z.string().min(1).max(100),caseReference:z.string().min(3).max(80).regex(/^[A-Za-z0-9._/-]+$/)}).strict();
export const proposalBody=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('admit_member'),title:z.string().min(3).max(120),organisationName:z.string().min(2).max(80),organisationKind:z.enum(['bank','telco','ewallet'])}).strict(),
 z.object({kind:z.literal('change_rule'),title:z.string().min(3).max(120),quorum:z.number().int().min(2).max(20)}).strict()
]);
