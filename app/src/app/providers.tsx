'use client';
import {useCallback,useEffect,useState} from 'react';
import {TideCloakProvider,useTideCloak} from '@tidecloak/nextjs';
import {VaultContext} from '@/lib/vault-context';
import {api,setTransport,setCryptoSdk} from '@/lib/client';
import type {Capabilities,Session} from '@/lib/types';
export {useVault} from '@/lib/vault-context';

function SessionBridge({children,initialCapabilities}:{children:React.ReactNode;initialCapabilities:Capabilities}){
 const tide=useTideCloak();const [session,setSession]=useState<Session|null>(null);const [caps,setCaps]=useState(initialCapabilities);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
  if(!tide.authenticated){setSession(null);setTransport(null);setCryptoSdk(null);setLoading(false);return;}
  setLoading(true);setTransport(async(url,init)=>{const token=await tide.getToken();if(!token)throw new Error('Your TideCloak session has expired. Sign in again.');const headers=new Headers(init?.headers);headers.set('Authorization','Bearer '+token);return tide.secureFetch(url,{...init,headers});});setCryptoSdk(tide);
  try{const result=await api<{session:Session;capabilities:Capabilities}>('/api/session');setSession(result.session);setCryptoSdk(tide,result.session.tideUserKey);setCaps(result.capabilities);setError(null);}catch(e){setSession(null);setCryptoSdk(null);setError(e instanceof Error?e.message:'Unable to verify session.');}finally{setLoading(false);}
 },[tide.authenticated,tide.secureFetch]);
 useEffect(()=>{if(!tide.isInitializing)void refresh();},[tide.isInitializing,refresh]);
 useEffect(()=>()=>{setTransport(null);setCryptoSdk(null);},[]);
 return <VaultContext.Provider value={{session,capabilities:caps,loading:loading||tide.isInitializing,error:error??tide.initError?.message??null,login:tide.login,logout:async()=>{setSession(null);setTransport(null);setCryptoSdk(null);await tide.logout();},refresh}}>{children}</VaultContext.Provider>;
}

export function Providers({children}:{children:React.ReactNode}){
 const [setup,setSetup]=useState<{config:Record<string,unknown>;capabilities:Capabilities}|null>(null);const [error,setError]=useState<string|null>(null);
 const load=useCallback(async()=>{setError(null);try{const response=await fetch('/api/config',{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error?.message??'TideCloak adapter is unavailable.');setSetup(data);}catch(e){setError(e instanceof Error?e.message:'TideCloak is unavailable.');}},[]);
 useEffect(()=>{void load();},[load]);
 if(!setup)return <VaultContext.Provider value={{session:null,capabilities:null,loading:!error,error,login:load,logout:async()=>{},refresh:load}}>{children}</VaultContext.Provider>;
 return <TideCloakProvider config={{...setup.config,useDPoP:{mode:'strict',alg:'ES256'},checkLoginIframe:false,onLoad:'check-sso',silentCheckSsoRedirectUri:typeof window!=='undefined'?window.location.origin+'/silent-check-sso.html':undefined}}><SessionBridge initialCapabilities={setup.capabilities}>{children}</SessionBridge></TideCloakProvider>;
}
