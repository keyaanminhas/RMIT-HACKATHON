import test from 'node:test';
import assert from 'node:assert/strict';
import {createDpopRoute} from '@tidecloak/js/dpop-route';
test('SDK DPoP relay carries enclave CSP and rejects mismatched issuer/client',async()=>{
 const routes=createDpopRoute({config:{'auth-server-url':'http://localhost:8080',realm:'test-realm',resource:'test-client'}});
 const hex=(v:string)=>Buffer.from(v).toString('hex');
 const path=(issuer='http://localhost:8080/realms/test-realm',client='test-client')=>'http://localhost:3000/tide_dpop/iss/'+hex(issuer)+'/aud/'+hex(client)+'/tide_dpop_auth.html';
 const response=routes.HEAD(new Request(path(),{method:'HEAD'}));assert.equal(response.status,200);assert.ok(response.headers.get('Content-Security-Policy'));assert.equal(response.headers.get('Allow-CSP-From'),'*');assert.equal(response.headers.get('Cache-Control'),'no-store');
 assert.equal(routes.GET(new Request(path(undefined,'another-client'))).status,403);
 assert.equal(routes.GET(new Request(path('http://attacker.test/realms/test-realm'))).status,403);
 assert.equal(routes.GET(new Request('http://localhost:3000/not-the-relay')).status,404);
 const page=await routes.GET(new Request(path())).text();assert.ok(page.includes('dpopState'));assert.equal(await response.text(),'');
});
