import {ApiError} from './errors';
export function assertDisclosureDecision(requesterOrgId:string,approverOrgId:string,status:string,existing:boolean){
 if(requesterOrgId===approverOrgId) throw new ApiError(403,'SELF_APPROVAL','Your organisation cannot approve its own disclosure request.');
 if(existing) return false;
 if(status!=='pending') throw new ApiError(409,'REQUEST_CLOSED','This request no longer accepts decisions.');
 return true;
}
export function disclosureQuorum(orgIds:string[],reporterOrgId:string){return new Set(orgIds).size>=2&&orgIds.includes(reporterOrgId);}
export function majority(memberCount:number){return Math.floor(memberCount/2)+1;}
export function canReadEvidence(request:{requesterUserId:string;status:string;expiresAt:Date|null},userId:string,now=new Date()){return request.requesterUserId===userId&&request.status==='approved'&&!!request.expiresAt&&request.expiresAt>now;}
