'use client';
import {createContext,useContext} from 'react';
import type {Session,Capabilities} from './types';
export interface VaultContextValue {session:Session|null;capabilities:Capabilities|null;loading:boolean;error:string|null;login:()=>Promise<void>;logout:()=>Promise<void>;refresh:()=>Promise<void>}
export const VaultContext=createContext<VaultContextValue>({session:null,capabilities:null,loading:true,error:null,login:async()=>{},logout:async()=>{},refresh:async()=>{}});
export const useVault=()=>useContext(VaultContext);
