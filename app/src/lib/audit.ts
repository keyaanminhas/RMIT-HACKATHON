import {createHash} from 'node:crypto';
import type {Prisma} from '@prisma/client';
import type {Session} from './types';
export function auditHash(event:{ts:Date|string;actorUserId:string;actorOrgId:string;action:string;targetId:string;result:string;previousHash:string}){return createHash('sha256').update(JSON.stringify([new Date(event.ts).toISOString(),event.actorUserId,event.actorOrgId,event.action,event.targetId,event.result,event.previousHash])).digest('hex');}
export async function audit(tx:Prisma.TransactionClient,session:Session,action:string,targetId:string,result:string){
 const last=await tx.auditEvent.findFirst({orderBy:{sequence:'desc'}});
 const event={ts:new Date(),actorUserId:session.userId,actorOrgId:session.orgId,action,targetId,result,previousHash:last?.hash??'GENESIS'};
 return tx.auditEvent.create({data:{...event,hash:auditHash(event)}});
}
export function verifyChain(events:Parameters<typeof auditHash>[0][] & {hash?:string}[]){let previous='GENESIS';for(const event of events){if(event.previousHash!==previous||auditHash(event)!==event.hash)return false;previous=event.hash!;}return true;}
