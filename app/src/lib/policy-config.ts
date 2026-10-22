import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {z} from 'zod';
import {envelope} from './validation';
import {unavailable} from './errors';
const policy=z.object({id:z.string().min(1),policyB64:z.string().min(16).max(1500000),vendorId:z.string().min(1),recordId:z.string().min(1),subject:z.discriminatedUnion('type',[z.object({type:z.literal('User'),id:z.string().min(1)}).strict(),z.object({type:z.literal('Group'),id:z.string().min(1)}).strict(),z.object({type:z.literal('Role'),id:z.string().min(1),clientId:z.string().optional()}).strict()]),access:z.enum(['read','write','read-write']),expiresAt:z.number().int().positive().optional()}).strict();
const setup=z.object({indexKey:z.object({envelope:envelope.refine(v=>v.tag==='index-key'),policy}).strict(),tier1Policy:policy,evidencePolicy:policy.optional()}).strict();
/** Policy bytes are public signed authorizations, not symmetric key material.
 * The encrypted index-key envelope belongs in this deployment-managed file.
 * Browser helpers validate metadata and the Fabric authenticates signatures.
 * This file cannot enable unavailable disclosure/governance capabilities.
 */
export function loadPolicyConfig(){
 try{return setup.parse(JSON.parse(readFileSync(process.env.TIDE_POLICY_CONFIG_PATH??resolve(process.cwd(),'../data/neutralvault-policies.json'),'utf8')));}
 catch{unavailable('Shared consortium policies are not provisioned. Configure genuine signed Tide policies and an encrypted index key; account identifiers and plaintext evidence are never accepted by this endpoint.');}
}
