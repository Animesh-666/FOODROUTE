/** Trusted API transport. Never expose Firebase Admin credentials to the browser. */
import {firebaseAuth} from './firebase';
export type TrustedApiMode='local'|'cloudrun'|'functions';
export function apiMode():TrustedApiMode{
 const mode=import.meta.env.VITE_ORDER_API_MODE;
 return mode==='local'||mode==='cloudrun'?mode:'functions';
}
export function trustedApiBase(mode:TrustedApiMode=apiMode()):string{
 if(mode==='local'){
  if(!import.meta.env.DEV)throw new Error('Local API mode is not available in production.');
  return 'http://127.0.0.1:8787';
 }
 if(mode!=='cloudrun')throw new Error('No remote API is configured for this action.');
 const candidate=String(import.meta.env.VITE_ORDER_API_BASE_URL||'').trim();
 let url:URL;try{url=new URL(candidate)}catch{throw new Error('Set a valid VITE_ORDER_API_BASE_URL for the hosted API.');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/' || !url.hostname||candidate.includes('*')){
  throw new Error('The hosted API must use an HTTPS origin without a path, credentials, or wildcard.');
 }
 return url.origin;
}
export async function callTrustedApi<T>(endpoint:string,body:unknown):Promise<T>{
 if(!/^[a-z][a-z0-9/-]{0,90}$/.test(endpoint))throw new Error('Invalid endpoint.');
 const user=firebaseAuth?.currentUser;if(!user)throw new Error('Sign in to continue.');
 const mode=apiMode(),base=trustedApiBase(mode);
 const token=await user.getIdToken();let response:Response;
 try{response=await fetch(`${base}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body),cache:'no-store'});}
 catch{throw new Error(mode==='local'?'Local API is unavailable; check services/functions.':'Hosted FOODROUTE API is unavailable. Please try later.');}
 let result:unknown;try{result=await response.json()}catch{throw new Error('The API did not return valid JSON.');}
 if(!response.ok){const message=typeof result==='object'&&result!==null&&'error' in result&&typeof result.error==='string'?result.error:'Request failed.';throw new Error(message);}
 return result as T;
}
