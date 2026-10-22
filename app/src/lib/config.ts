import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {JSONWebKeySet} from 'jose';
export interface TideConfig {realm:string;'auth-server-url':string;resource:string;jwk:JSONWebKeySet;[key:string]:unknown}
export function loadTideConfig():TideConfig {
 const config=JSON.parse(readFileSync(process.env.TIDECLOAK_ADAPTER_PATH??resolve(process.cwd(),'../data/tidecloak.json'),'utf8')) as TideConfig;
 if(!config.realm||!config.resource||!config['auth-server-url']||!config.jwk?.keys?.length) throw new Error('Export a real TideCloak adapter with its pinned public signing key.');
 if(config.jwk.keys.some(k=>k.d||k.k)) throw new Error('Private signing keys must never be included in an app adapter.');
 return config;
}
export function publicConfig(){const c=loadTideConfig();return Object.fromEntries(Object.entries(c).filter(([k])=>['realm','auth-server-url','resource','public-client','ssl-required','confidential-port','jwk','vendorId','homeOrkUrl'].includes(k)));}
