import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {GET,POST} from '../src/app/api/[...path]/route';
test('API rejects unauthenticated storage, lookup, disclosures and governance',async()=>{
 for(const path of ['reports','lookup','disclosures','proposals','operator/dump','operator/attempt']){
  const response=await POST(new NextRequest('http://localhost:3000/api/'+path,{method:'POST',body:JSON.stringify({account:'never-accepted',evidence:'never-accepted'})}));
  assert.equal(response.status,401,path);const data=await response.json();assert.equal(data.error.code,'AUTHENTICATION_REQUIRED');assert.equal(JSON.stringify(data).includes('never-accepted'),false);
 }
});
test('bound tokens replayed as Bearer fail before protected route handlers',async()=>{
 const response=await GET(new NextRequest('http://localhost:3000/api/reports',{headers:{authorization:'Bearer captured-token'}}));assert.equal(response.status,401);
});
test('forged DPoP access token never reaches protected report storage',async()=>{
 const response=await GET(new NextRequest('http://localhost:3000/api/reports',{headers:{authorization:'DPoP forged.jwt.token',dpop:'forged.proof.token'}}));assert.equal(response.status,401);assert.equal((await response.json()).error.code,'INVALID_SESSION');
});
test('public capability status never advertises unconfigured cryptographic release',async()=>{
 const response=await GET(new NextRequest('http://localhost:3000/api/capabilities'));assert.equal(response.status,200);const data=await response.json();assert.equal(data.sharedEncryption,false);assert.equal(data.disclosurePolicy,false);assert.equal(data.governancePolicy,false);assert.ok(data.reasons.length>=3);
});
