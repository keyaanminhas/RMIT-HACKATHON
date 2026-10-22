import {NextRequest} from 'next/server';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {db} from '@/lib/db';
import {authenticate,member} from '@/lib/auth';
import {publicConfig} from '@/lib/config';
import {capabilities} from '@/lib/capabilities';
import {ApiError,unavailable} from '@/lib/errors';
import {audit,verifyChain} from '@/lib/audit';
import {assertDisclosureDecision,disclosureQuorum,majority,canReadEvidence} from '@/lib/rules';
import {reportBody,lookupBody,disclosureBody,proposalBody} from '@/lib/validation';
import {loadPolicyConfig} from '@/lib/policy-config';
import type {Session} from '@/lib/types';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MEMBER=['vault-analyst','vault-approver','vault-admin'];
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function body(request:Request){if(Number(request.headers.get('content-length')??0)>2100000)throw new ApiError(413,'BODY_TOO_LARGE','Request is too large.');const text=await request.text();if(text.length>2100000)throw new ApiError(413,'BODY_TOO_LARGE','Request is too large.');try{return JSON.parse(text);}catch{throw new ApiError(400,'INVALID_JSON','Provide a JSON request body.');}}
async function transact<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){return db.$transaction(work);}
function parsedReport<T extends {tier1Ciphertext:string;authorId:string;submissionId:string;evidenceCiphertext:string}>(r:T){const {evidenceCiphertext,authorId,submissionId,...safe}=r;void evidenceCiphertext;void authorId;void submissionId;return {...safe,tier1Ciphertext:JSON.parse(r.tier1Ciphertext)};}

async function handle(request:NextRequest){
 const parts=request.nextUrl.pathname.replace(/^\/api\//,'').split('/');const path=parts.join('/');const method=request.method;
 // The adapter includes public verification material, never bootstrap credentials.
 if(method==='GET'&&path==='config')return json({config:publicConfig(),capabilities:capabilities()});
 if(method==='GET'&&path==='capabilities')return json(capabilities());
 const roles=path.startsWith('operator/')?['vault-operator']:path.startsWith('proposals')?['vault-admin']:MEMBER;
 const session=await authenticate(request,path==='session'?[]:roles);
 if(path==='session'&&method==='GET'){await transact(tx=>audit(tx,session,'session_verified','session','signed_token_verified'));return json({session,capabilities:capabilities()});}
 if(!path.startsWith('operator/'))await member(session);
 if(path==='crypto-config'&&method==='GET')return json(loadPolicyConfig());

 if(path==='dashboard'&&method==='GET'){
  const [reports,organisations,pendingDisclosures,openProposals]=await Promise.all([db.report.count(),db.organisation.count({where:{status:'active'}}),db.disclosure.count({where:{status:'pending',OR:[{requesterUserId:session.userId},{requesterOrgId:{not:session.orgId}}]}}),db.proposal.count({where:{status:'open'}})]);
  return json({reports,organisations,pendingDisclosures,openProposals});
 }
 if(path==='organisations'&&method==='GET')return json({organisations:await db.organisation.findMany({orderBy:{name:'asc'}})});
 if(path==='reports'&&method==='GET')return json({reports:(await db.report.findMany({orderBy:{createdAt:'desc'},take:200})).map(parsedReport)});
 if(path==='reports'&&method==='POST'){
  requireRole(session,'vault-analyst');const input=reportBody.parse(await body(request));
  if(!capabilities().sharedEncryption)unavailable('Shared Tide encryption has not been verified. Reports cannot be filed with identity-only encryption.');
  const report=await transact(async tx=>{
   const existing=await tx.report.findUnique({where:{submissionId:input.submissionId}});
   if(existing){if(existing.authorId!==session.userId)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Submission identifier is already used.');return existing;}
   const created=await tx.report.create({data:{indexHash:input.indexHash,reportingOrgId:session.orgId,authorId:session.userId,submissionId:input.submissionId,tier1Ciphertext:JSON.stringify(input.tier1Ciphertext),evidenceCiphertext:JSON.stringify(input.evidenceCiphertext)}});
   await audit(tx,session,'report_filed',created.id,'stored_ciphertext');return created;
  });return json({report:parsedReport(report)},201);
 }
 if(path==='index-key'&&method==='GET'){
  if(!capabilities().sharedEncryption)unavailable('The shared consortium index-key policy is not provisioned.');
  const key=await db.indexKey.findUnique({where:{id:'consortium'}});if(!key)unavailable('The encrypted consortium index key is not provisioned.');return json({ciphertext:JSON.parse(key.ciphertext)});
 }
 if(path==='lookup'&&method==='POST'){
  requireRole(session,'vault-analyst');const {indexHash}=lookupBody.parse(await body(request));
  const reports=await transact(async tx=>{const rows=await tx.report.findMany({where:{indexHash},orderBy:{createdAt:'desc'}});await audit(tx,session,'tier1_check','lookup',rows.length?'hit':'miss');return rows;});
  return json({reports:reports.map(parsedReport)});
 }
 if(path==='disclosures'&&method==='GET'){
  const rows=await db.disclosure.findMany({where:{OR:[{requesterUserId:session.userId},...(session.roles.includes('vault-approver')?[{requesterOrgId:{not:session.orgId}}]:[])]},include:{decisions:true},orderBy:{createdAt:'desc'},take:200});
  return json({disclosures:rows.map(r=>({...r,status:r.expiresAt&&r.expiresAt<=new Date()?'expired':r.status}))});
 }
 if(path==='disclosures'&&method==='POST'){
  requireRole(session,'vault-analyst');const input=disclosureBody.parse(await body(request));
  const result=await transact(async tx=>{
   const report=await tx.report.findUnique({where:{id:input.reportId}});if(!report)throw new ApiError(404,'NOT_FOUND','Report not found.');
   if(report.reportingOrgId===session.orgId)throw new ApiError(409,'REPORTER_REQUEST','A reporting organisation cannot request its own evidence through a quorum requiring its approval.');
   const old=await tx.disclosure.findUnique({where:{reportId_requesterUserId_caseReference:{reportId:input.reportId,requesterUserId:session.userId,caseReference:input.caseReference}},include:{decisions:true}});if(old)return old;
   const created=await tx.disclosure.create({data:{...input,requesterUserId:session.userId,requesterOrgId:session.orgId},include:{decisions:true}});await audit(tx,session,'tier2_requested',created.id,'pending');return created;
  });return json({disclosure:result},201);
 }
 if(parts[0]==='disclosures'&&parts.length===3&&parts[2]==='decision'&&method==='POST'){
  requireRole(session,'vault-approver');const {decision}=z.object({decision:z.enum(['approve','deny'])}).strict().parse(await body(request));
  const result=await transact(async tx=>{
   const d=await tx.disclosure.findUnique({where:{id:parts[1]},include:{decisions:true}});if(!d)throw new ApiError(404,'NOT_FOUND','Disclosure not found.');
   if(!assertDisclosureDecision(d.requesterOrgId,session.orgId,d.status,d.decisions.some(x=>x.orgId===session.orgId)))return d;
   await tx.decision.create({data:{disclosureId:d.id,orgId:session.orgId,userId:session.userId,decision}});
   await audit(tx,session,decision==='approve'?'tier2_approval_recorded':'tier2_denied',d.id,decision==='approve'?'awaiting_signed_policy':'denied');
   if(decision==='deny')await tx.disclosure.update({where:{id:d.id},data:{status:'denied'}});
   else {
    const report=await tx.report.findUniqueOrThrow({where:{id:d.reportId}});
    const orgs=[...d.decisions.filter(x=>x.decision==='approve').map(x=>x.orgId),session.orgId];
    if(disclosureQuorum(orgs,report.reportingOrgId))await audit(tx,session,'tier2_quorum_recorded',d.id,'blocked_pending_tide_policy');
    // Never turn database approvals into a cryptographic grant. Only a verified
    // Tide commitment can set approved/expiresAt; that adapter is not deployed.
   }
   return tx.disclosure.findUniqueOrThrow({where:{id:d.id},include:{decisions:true}});
  });return json({disclosure:result,capabilities:capabilities()});
 }
 if(parts[0]==='disclosures'&&parts.length===3&&parts[2]==='evidence'&&method==='GET'){
  const d=await db.disclosure.findUnique({where:{id:parts[1]}});if(!d||d.requesterUserId!==session.userId)throw new ApiError(404,'NOT_FOUND','Disclosure not found.');
  if(!capabilities().disclosurePolicy)unavailable('Evidence remains sealed until a signed Tide quorum and expiring requester grant are verified.');
  if(!canReadEvidence(d,session.userId))throw new ApiError(403,'EVIDENCE_SEALED','Evidence is not approved or access has expired.');
  // Deliberately unavailable until a Fabric commitment is independently verified;
  // the operator can edit these database fields and they cannot authorize release.
  unavailable('No verified Tide policy commitment is associated with this request.');
 }
 if(path==='proposals'&&method==='GET')return json({proposals:await db.proposal.findMany({include:{votes:true},orderBy:{createdAt:'desc'},take:200})});
 if(path==='proposals'&&method==='POST'){
  const input=proposalBody.parse(await body(request));const proposal=await transact(async tx=>{
   const orgs=await tx.organisation.findMany({where:{status:'active'}});const electorate=orgs.map(o=>o.id);
   if(!electorate.includes(session.orgId))throw new ApiError(403,'NOT_ELECTORATE','Your organisation is not in the active consortium electorate.');
   const created=await tx.proposal.create({data:{kind:input.kind,title:input.title,payload:JSON.stringify(input),authorId:session.userId,electorate:JSON.stringify(electorate),threshold:majority(electorate.length)},include:{votes:true}});await audit(tx,session,'proposal_opened',created.id,'open');return created;
  });return json({proposal},201);
 }
 if(parts[0]==='proposals'&&parts.length===3&&parts[2]==='vote'&&method==='POST'){
  const {choice}=z.object({choice:z.enum(['yes','no'])}).strict().parse(await body(request));
  const proposal=await transact(async tx=>{
   const p=await tx.proposal.findUnique({where:{id:parts[1]},include:{votes:true}});if(!p)throw new ApiError(404,'NOT_FOUND','Proposal not found.');
   const electorate=JSON.parse(p.electorate) as string[];if(!electorate.includes(session.orgId))throw new ApiError(403,'NOT_ELECTORATE','Your organisation cannot vote on this proposal.');
   if(p.votes.some(v=>v.orgId===session.orgId))return p;
   if(p.status!=='open')throw new ApiError(409,'PROPOSAL_CLOSED','This proposal no longer accepts votes.');
   await tx.vote.create({data:{proposalId:p.id,orgId:session.orgId,userId:session.userId,choice}});await audit(tx,session,'vote_cast',p.id,choice);
   const votes=[...p.votes,{choice}];const yes=votes.filter(v=>v.choice==='yes').length;const no=votes.length-yes;
   if(yes>=p.threshold){await tx.proposal.update({where:{id:p.id},data:{status:'awaiting_tide_commitment'}});await audit(tx,session,'governance_quorum_recorded',p.id,'blocked_pending_tide_policy');}
   else if(no>electorate.length-p.threshold){await tx.proposal.update({where:{id:p.id},data:{status:'rejected'}});await audit(tx,session,'proposal_rejected',p.id,'rejected');}
   return tx.proposal.findUniqueOrThrow({where:{id:p.id},include:{votes:true}});
  });return json({proposal,capabilities:capabilities()});
 }
 if(path==='audit'&&method==='GET'){const events=await db.auditEvent.findMany({orderBy:{sequence:'asc'}});return json({events:[...events].reverse(),chainValid:verifyChain(events)});}
 if(path==='operator/dump'&&method==='GET'){
  await transact(tx=>audit(tx,session,'operator_dump','database','ciphertext_only'));
  const [organisations,reports,indexKey,disclosures,proposals,events]=await Promise.all([db.organisation.findMany(),db.report.findMany({take:200}),db.indexKey.findMany(),db.disclosure.findMany({include:{decisions:true},take:200}),db.proposal.findMany({include:{votes:true},take:200}),db.auditEvent.findMany({orderBy:{sequence:'desc'},take:100})]);
  return json({organisations,reports,indexKey,disclosures,proposals,events,notice:'Actual stored records. No raw request bodies, tokens, account identifiers or plaintext evidence are logged.'});
 }
 if(path==='operator/attempt'&&method==='POST'){
  const input=z.object({action:z.enum(['self-grant','self-approve']),disclosureId:z.string().optional()}).strict().parse(await body(request));
  await transact(tx=>audit(tx,session,input.action==='self-grant'?'self_grant_blocked':'operator_approval_blocked',input.disclosureId??'roles','denied'));
  throw new ApiError(403,'OPERATOR_UNAUTHORIZED',input.action==='self-grant'?'The application exposes no role-grant API. Role changes require Tide governance.':'An operator role cannot cast a member organisation decision.');
 }
 if(path==='demo/reset')throw new ApiError(403,'RESET_DISABLED','Reset is disabled. Synthetic reports must be encrypted by enrolled members; no server-side plaintext seed is installed.');
 throw new ApiError(404,'NOT_FOUND','API route not found.');
}
function requireRole(s:Session,role:string){if(!s.roles.includes(role))throw new ApiError(403,'ROLE_REQUIRED','This action requires '+role+'.');}
async function route(request:NextRequest){try{return await handle(request);}catch(error){if(error instanceof ApiError)return json({error:{code:error.code,message:error.message}},error.status);if(error instanceof z.ZodError)return json({error:{code:'INVALID_INPUT',message:'Request fields do not match the required format.'}},400);if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return json({error:{code:'CONFLICT',message:'This organisation has already submitted a decision.'}},409);return json({error:{code:'SERVICE_UNAVAILABLE',message:'The service is unavailable. Check database provisioning and the TideCloak adapter.'}},503);}}
export {route as GET,route as POST};
