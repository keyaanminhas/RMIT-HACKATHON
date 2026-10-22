import {createHash} from 'node:crypto';
import {calculateJwkThumbprint,createLocalJWKSet,decodeProtectedHeader,importJWK,jwtVerify,type JWTPayload} from 'jose';
import {db} from './db';
import {loadTideConfig,type TideConfig} from './config';
import {ApiError} from './errors';
import type {Session} from './types';

// Based on the official pack's tideJWT/verifyDpop helpers. Replay claims persist
// in SQLite, including across restarts; forwarded headers are deliberately ignored.
export async function verifyDpop(request:Request,token:string,claims:JWTPayload,claim:(key:string,expiry:Date)=>Promise<boolean>){
 const binding=(claims.cnf as {jkt?:string}|undefined)?.jkt;
 const proof=request.headers.get('dpop');
 if(!binding||!proof||!/^DPoP /i.test(request.headers.get('authorization')??'')) throw new Error('A sender-constrained token and DPoP proof are required.');
 const header=decodeProtectedHeader(proof);
 if(header.typ!=='dpop+jwt'||header.alg!=='ES256'||!header.jwk||'d' in header.jwk||'k' in header.jwk) throw new Error('Invalid DPoP proof key or algorithm.');
 const key=await importJWK(header.jwk,'ES256');
 const {payload}=await jwtVerify(proof,key,{algorithms:['ES256']});
 if(await calculateJwkThumbprint(header.jwk)!==binding)throw new Error('DPoP key binding mismatch.');
 const url=new URL(request.url);const origin=process.env.APP_ORIGIN??'http://localhost:3000';
 if(payload.htu!==origin+url.pathname||payload.htm!==request.method)throw new Error('DPoP request binding mismatch.');
 if(payload.ath!==createHash('sha256').update(token).digest('base64url'))throw new Error('DPoP token binding mismatch.');
 if(typeof payload.iat!=='number'||Math.abs(Date.now()/1000-payload.iat)>60||typeof payload.jti!=='string'||!payload.jti||payload.jti.length>256)throw new Error('DPoP proof is stale or malformed.');
 if(!await claim(binding+':'+payload.jti,new Date(Date.now()+120000)))throw new Error('DPoP replay rejected.');
}
export function extractSession(claims:JWTPayload,client:string):Session {
 const rr=(claims.realm_access as {roles?:unknown}|undefined)?.roles;
 const cr=(claims.resource_access as Record<string,{roles?:unknown}>|undefined)?.[client]?.roles;
 const roles=[...(Array.isArray(rr)?rr:[]),...(Array.isArray(cr)?cr:[])].filter((v):v is string=>typeof v==='string');
 const org=claims.org_id;
 return {userId:claims.sub!,displayName:typeof claims.preferred_username==='string'?claims.preferred_username:'Member',orgId:typeof org==='string'?org:'',orgName:typeof claims.org_name==='string'?claims.org_name:typeof org==='string'?org:'Not enrolled',roles:[...new Set(roles)],...(typeof claims.tideuserkey==='string'?{tideUserKey:claims.tideuserkey}:{})};
}
export async function verifyAccessToken(token:string,config:TideConfig){
 const {payload}=await jwtVerify(token,createLocalJWKSet(config.jwk),{issuer:config['auth-server-url'].replace(/\/+$/,'')+'/realms/'+config.realm,requiredClaims:['sub','iat','exp'],algorithms:['ES256','EdDSA','RS256']});
 if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>256||payload.azp!==config.resource||typeof payload.iat!=='number'||payload.iat>Date.now()/1000+60||payload.typ==='ID')throw new Error('Wrong token subject, client, type or issue time.');
 return payload;
}
export async function authenticate(request:Request,roles:string[]=[]):Promise<Session>{
 const auth=request.headers.get('authorization');
 if(!auth||!/^DPoP \S+$/.test(auth))throw new ApiError(401,'AUTHENTICATION_REQUIRED','Sign in with TideCloak using a DPoP-bound session.');
 try {
  const config=loadTideConfig();const token=auth.slice(5);
  const payload=await verifyAccessToken(token,config);
  await verifyDpop(request,token,payload,async(id,expiresAt)=>{await db.dpopReplay.deleteMany({where:{expiresAt:{lt:new Date()}}});try{await db.dpopReplay.create({data:{id,expiresAt}});return true;}catch(e){if((e as {code?:string}).code==='P2002')return false;throw e;}});
  const session=extractSession(payload,config.resource);
  if(roles.length&&!roles.some(role=>session.roles.includes(role)))throw new ApiError(403,'ROLE_REQUIRED','Your signed-in identity does not have the required role.');
  return session;
 }catch(error){if(error instanceof ApiError)throw error;throw new ApiError(401,'INVALID_SESSION','The TideCloak session or DPoP proof could not be verified. Sign in again.');}
}
export async function member(session:Session){
 if(!session.orgId)throw new ApiError(403,'NOT_ENROLLED','Your identity has no signed organisation claim. Ask a consortium administrator to complete enrolment.');
 // Membership must be in signed Tide claims. The local mapping is descriptive only.
 if(!session.roles.some(r=>['vault-analyst','vault-approver','vault-admin'].includes(r)))throw new ApiError(403,'NOT_MEMBER','This identity is not an active consortium member.');
 return session;
}
