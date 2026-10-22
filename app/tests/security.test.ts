import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SignJWT,calculateJwkThumbprint,exportJWK,generateKeyPair} from 'jose';
import {verifyDpop,extractSession,verifyAccessToken} from '../src/lib/auth';
import {assertDisclosureDecision,disclosureQuorum,majority,canReadEvidence} from '../src/lib/rules';
import {auditHash,verifyChain} from '../src/lib/audit';
import {reportBody} from '../src/lib/validation';
import {capabilities} from '../src/lib/capabilities';
test('disclosure excludes requester organisation and counts organisations once',()=>{
 assert.throws(()=>assertDisclosureDecision('bank-b','bank-b','pending',false));
 assert.equal(assertDisclosureDecision('bank-b','bank-a','pending',true),false);
 assert.equal(disclosureQuorum(['bank-a','bank-a'],'bank-a'),false);
 assert.equal(disclosureQuorum(['bank-c','telco'],'bank-a'),false);
 assert.equal(disclosureQuorum(['bank-a','telco'],'bank-a'),true);
 assert.throws(()=>assertDisclosureDecision('bank-b','bank-a','denied',false));
});
test('strict majority uses full electorate; evidence expires at the boundary',()=>{
 assert.equal(majority(3),2);assert.equal(majority(4),3);
 const grant={requesterUserId:'requester',status:'approved',expiresAt:new Date('2026-10-22T10:30:00Z')};
 assert.equal(canReadEvidence(grant,'other',new Date('2026-10-22T10:00:00Z')),false);
 assert.equal(canReadEvidence(grant,'requester',new Date('2026-10-22T10:29:59Z')),true);
 assert.equal(canReadEvidence(grant,'requester',grant.expiresAt),false);
});
test('client roles are restricted to this adapter client and organisation is signed',()=>{
 const session=extractSession({sub:'u',org_id:'bank-a',resource_access:{other:{roles:['vault-admin']},app:{roles:['vault-analyst']}},realm_access:{roles:['basic']},preferred_username:'Analyst'},'app');
 assert.deepEqual(session.roles,['basic','vault-analyst']);assert.equal(session.orgId,'bank-a');
 assert.equal(extractSession({sub:'u'},'app').orgId,'');
});
test('audit detects modified records, removed links and reordered history',()=>{
 const base={ts:new Date('2026-10-22T10:00:00Z'),actorUserId:'u',actorOrgId:'bank-a',action:'report_filed',targetId:'r',result:'stored_ciphertext',previousHash:'GENESIS'};
 const first={...base,hash:auditHash(base)};const secondData={...base,action:'tier1_check',previousHash:first.hash};const second={...secondData,hash:auditHash(secondData)};
 assert.equal(verifyChain([first,second]),true);assert.equal(verifyChain([{...first,result:'tampered'},second]),false);assert.equal(verifyChain([second]),false);assert.equal(verifyChain([second,first]),false);
});
test('report API schema rejects plaintext fields and wrong encrypted tier tags',()=>{
 const env={version:1,scheme:'tide-policy',tag:'tier1',ciphertext:'a'.repeat(64),policyId:'signed-policy'};
 const input={submissionId:'8957f54b-5730-4f09-898f-d383ad58946d',indexHash:'a'.repeat(64),tier1Ciphertext:env,evidenceCiphertext:{...env,tag:'evidence'}};
 assert.equal(reportBody.safeParse(input).success,true);
 assert.equal(reportBody.safeParse({...input,account:'123456'}).success,false);
 assert.equal(reportBody.safeParse({...input,evidenceCiphertext:env}).success,false);
});
test('security capabilities cannot be enabled by an environment flag',()=>{
 process.env.TIDE_SHARED_ENCRYPTION='true';process.env.TIDE_DISCLOSURE_POLICY='true';
 assert.equal(capabilities().sharedEncryption,false);assert.equal(capabilities().disclosurePolicy,false);assert.equal(capabilities().governancePolicy,false);
});
test('DPoP validates cryptographic binding and rejects replay, wrong method and Bearer downgrade',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('ES256');const jwk=await exportJWK(publicKey);const token='signed-access-token';const jkt=await calculateJwkThumbprint(jwk);const used=new Set<string>();
 const claim=async(key:string)=>{if(used.has(key))return false;used.add(key);return true;};
 const proof=await new SignJWT({htm:'POST',htu:'http://localhost:3000/api/lookup',ath:createHash('sha256').update(token).digest('base64url')}).setProtectedHeader({typ:'dpop+jwt',alg:'ES256',jwk}).setIssuedAt().setJti('unique-proof').sign(privateKey);
 const request=new Request('http://localhost:3000/api/lookup',{method:'POST',headers:{authorization:'DPoP '+token,dpop:proof}});
 await verifyDpop(request,token,{cnf:{jkt}},claim);
 await assert.rejects(()=>verifyDpop(request,token,{cnf:{jkt}},claim),/replay/);
 await assert.rejects(()=>verifyDpop(new Request(request.url,{headers:{authorization:'Bearer '+token,dpop:proof}}),token,{cnf:{jkt}},claim),/sender-constrained/);
 await assert.rejects(()=>verifyDpop(new Request(request.url,{headers:{authorization:'DPoP '+token,dpop:proof}}),token,{cnf:{jkt}},claim),/binding/);
 await assert.rejects(()=>verifyDpop(request,'different-token',{cnf:{jkt}},claim),/token binding/);
 await assert.rejects(()=>verifyDpop(request,token,{cnf:{jkt:'wrong'}},claim),/key binding/);
});
test('access token verification pins the adapter key, issuer, client and expiry',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('ES256');const {privateKey:rogue}=await generateKeyPair('ES256');
 const config={realm:'test-realm','auth-server-url':'https://issuer.test',resource:'test-client',jwk:{keys:[{...await exportJWK(publicKey),alg:'ES256',use:'sig'}]}};
 const claims={sub:'member-user',azp:'test-client',typ:'Bearer'};
 const mint=(changes:Record<string,unknown>={},key=privateKey)=>new SignJWT({...claims,...changes}).setProtectedHeader({alg:'ES256'}).setIssuer('https://issuer.test/realms/test-realm').setIssuedAt().setExpirationTime('5m').sign(key);
 assert.equal((await verifyAccessToken(await mint(),config)).sub,'member-user');
 await assert.rejects(()=>mint({},rogue).then(token=>verifyAccessToken(token,config)));
 await assert.rejects(()=>mint({azp:'wrong-client'}).then(token=>verifyAccessToken(token,config)));
 await assert.rejects(()=>mint({typ:'ID'}).then(token=>verifyAccessToken(token,config)));
 await assert.rejects(()=>mint().then(token=>verifyAccessToken(token,{...config,realm:'wrong-realm'})));
 const expired=await new SignJWT(claims).setProtectedHeader({alg:'ES256'}).setIssuer('https://issuer.test/realms/test-realm').setIssuedAt(Math.floor(Date.now()/1000)-600).setExpirationTime(Math.floor(Date.now()/1000)-60).sign(privateKey);await assert.rejects(()=>verifyAccessToken(expired,config));
 const missingExpiry=await new SignJWT(claims).setProtectedHeader({alg:'ES256'}).setIssuer('https://issuer.test/realms/test-realm').setIssuedAt().sign(privateKey);await assert.rejects(()=>verifyAccessToken(missingExpiry,config));
});
