import {createDpopRoute} from '@tidecloak/js/dpop-route';
import {loadTideConfig} from '@/lib/config';
export const dynamic='force-dynamic';
// Use the SDK-owned relay asset and CSP. Pin issuer and client instead of serving
// a cross-origin credential relay for arbitrary realm/client pairs.
function handle(request:Request){try{const handler=createDpopRoute({config:loadTideConfig()});return request.method==='HEAD'?handler.HEAD(request):handler.GET(request);}catch{return new Response('TideCloak adapter unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}}
export {handle as GET,handle as HEAD};
