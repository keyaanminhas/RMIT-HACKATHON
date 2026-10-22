import test from 'node:test';
import assert from 'node:assert/strict';
import {Models} from '@tideorg/js';
import {buildRelationshipPolicy,describeRelationshipPolicy,encryptShared,decryptShared,hashAccountIdentifier,importIndexKey,normalizeAccountIdentifier,validateRelationshipPolicy,type SignedPolicyEnvelope} from '../src/lib/tide/shared-crypto';
// A browser-shaped test environment supplies WebCrypto without a live Tide SDK.
Object.defineProperty(globalThis,'window',{value:{},configurable:true});
test('account normalization preserves leading zeros and stable HMAC',async()=>{
 assert.equal(normalizeAccountIdentifier(' 00-1234 ab '),'001234AB');
 assert.throws(()=>normalizeAccountIdentifier('1234/5678'));
 const raw=new Uint8Array(32).fill(7);const key=await importIndexKey(raw);assert.equal(key.extractable,false);
 assert.equal(await hashAccountIdentifier('00-1234 ab',key),await hashAccountIdentifier('001234AB',key));
 assert.notEqual(await hashAccountIdentifier('001234AB',key),await hashAccountIdentifier('1234AB',key));
 await assert.rejects(()=>crypto.subtle.exportKey('raw',key));
});
function policyEnvelope(){
 const grant={vendorId:'test-vendor',recordId:'test-record',subject:{type:'Role' as const,id:'vault-analyst',clientId:'test-client'},access:'read-write' as const};
 const policy=buildRelationshipPolicy(grant);policy.signature=new Uint8Array([1,2,3]);
 return {id:'test-policy',policyB64:Buffer.from(policy.toBytes()).toString('base64'),...grant} satisfies SignedPolicyEnvelope;
}
test('shared helper forwards signed bytes and sole record assignment tag',async()=>{
 const policy=policyEnvelope();let calls=0;
 const sdk={doEncrypt:async(data:unknown,bytes?:Uint8Array)=>{calls++;assert.deepEqual(data,[{data:'synthetic metadata',tags:['test-record']}]);assert.ok(bytes?.length);return ['ciphertext'];},doDecrypt:async(data:unknown,bytes?:Uint8Array)=>{calls++;assert.deepEqual(data,[{encrypted:'ciphertext',tags:['test-record']}]);assert.ok(bytes?.length);return ['synthetic metadata'];}};
 const encrypted=await encryptShared(sdk,{tag:'tier1',data:'synthetic metadata',policy});
 assert.equal(await decryptShared(sdk,encrypted,policy),'synthetic metadata');assert.equal(calls,2);
 // This checks forwarding only; fabricated signatures are NOT authenticated locally.
 assert.equal(describeRelationshipPolicy(policy.policyB64).hasSignature,true);
});
test('metadata drift, unsigned grants and expiry fail before a Tide call',()=>{
 const envelope=policyEnvelope();assert.throws(()=>validateRelationshipPolicy({...envelope,recordId:'other'},'encrypt'));
 assert.throws(()=>validateRelationshipPolicy({...envelope,subject:{type:'User',id:'someone'}},'decrypt'));
 const policy=Models.Policy.from(Buffer.from(envelope.policyB64,'base64'));policy.signature=new Uint8Array();assert.throws(()=>validateRelationshipPolicy({...envelope,policyB64:Buffer.from(policy.toBytes()).toString('base64')},'encrypt'));
});
test('weaker relationship grants cannot encrypt or disclose evidence',async()=>{
 let called=false;const sdk={doEncrypt:async()=>{called=true;return ['cipher'];},doDecrypt:async()=>{called=true;return ['plain'];}};const policy=policyEnvelope();
 await assert.rejects(()=>encryptShared(sdk,{tag:'evidence',data:'sensitive',policy}),/write-only Tide policy/);
 await assert.rejects(()=>decryptShared(sdk,{version:1,scheme:'tide-policy',tag:'evidence',ciphertext:'cipher',policyId:policy.id},policy),/verified Tide disclosure/);assert.equal(called,false);
});
test('sealed evidence encrypts only under a signed write-only policy for the current Tide user',async()=>{
 const grant={vendorId:'test-vendor',recordId:'unique-report:evidence',subject:{type:'User' as const,id:'actual-tide-user-key'},access:'write' as const};const signed=buildRelationshipPolicy(grant);signed.signature=new Uint8Array([1,2,3]);
 const policy={id:'report-evidence-policy',policyB64:Buffer.from(signed.toBytes()).toString('base64'),...grant};let calls=0;
 const sdk={doEncrypt:async(data:unknown)=>{calls++;assert.deepEqual(data,[{data:'synthetic evidence',tags:['unique-report:evidence']}]);return ['cipher'];},doDecrypt:async()=>{throw new Error('Evidence must remain sealed.');}};
 await assert.rejects(()=>encryptShared(sdk,{tag:'evidence',data:'synthetic evidence',policy,submittingUserKey:'other-user'}),/write-only/);
 await encryptShared(sdk,{tag:'evidence',data:'synthetic evidence',policy,submittingUserKey:'actual-tide-user-key'});assert.equal(calls,1);
});
