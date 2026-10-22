import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PrismaClient} from '@prisma/client';
test('SQLite records survive a client restart and enforce one decision per organisation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'neutralvault-persistence-'));const datasourceUrl='file:'+join(dir,'test.db').replaceAll('\\','/');
 const first=new PrismaClient({datasourceUrl});let second:PrismaClient|undefined;
 try{
  await first.$executeRawUnsafe('CREATE TABLE Organisation (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'pending\')');
  await first.$executeRawUnsafe('CREATE TABLE Decision (id TEXT PRIMARY KEY, disclosureId TEXT NOT NULL, orgId TEXT NOT NULL, userId TEXT NOT NULL, decision TEXT NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(disclosureId, orgId))');
  await first.organisation.create({data:{id:'synthetic-bank-a',name:'Synthetic Bank A',kind:'bank',status:'active'}});
  await first.$disconnect();
  second=new PrismaClient({datasourceUrl});
  assert.equal((await second.organisation.findUniqueOrThrow({where:{id:'synthetic-bank-a'}})).name,'Synthetic Bank A');
  await second.decision.create({data:{disclosureId:'synthetic-request',orgId:'synthetic-bank-a',userId:'officer-one',decision:'approve'}});
  await assert.rejects(()=>second!.decision.create({data:{disclosureId:'synthetic-request',orgId:'synthetic-bank-a',userId:'officer-two',decision:'approve'}}),(error:unknown)=>(error as {code?:string}).code==='P2002');
  assert.equal(await second.decision.count(),1);
 }finally{await first.$disconnect();await second?.$disconnect();await rm(dir,{recursive:true,force:true});}
});
