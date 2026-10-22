import {PrismaClient} from '@prisma/client';
const globalDb=globalThis as unknown as {neutralvaultDb?:PrismaClient};
export const db=globalDb.neutralvaultDb??new PrismaClient();
if(process.env.NODE_ENV!=='production') globalDb.neutralvaultDb=db;
