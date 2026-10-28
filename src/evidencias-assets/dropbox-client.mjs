const SESSION='visionaria-dropbox-token';
const parse=s=>{try{return JSON.parse(s)}catch{return null}};
function cached(){const s=parse(sessionStorage.getItem(SESSION));return s&&s.expiresAt>Date.now()+60000?s:null;}
async function ensureToken(){
  const s=cached();if(s)return s;
  const res=await fetch('/api/evidencias/dropbox-token');
  const data=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===401)throw new Error('Tu sesión expiró. Vuelve a iniciar sesión en la Intranet.');throw new Error(data.error??'No se pudo conectar con Dropbox.');}
  sessionStorage.setItem(SESSION,JSON.stringify(data));
  return data;
}
export function session(){return cached();}
export class DropboxError extends Error{constructor(message,status,detail){super(message);this.status=status;this.detail=detail;}}
function asciiJson(value){return JSON.stringify(value).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));}
export async function api(route,body,{root=true,binary=null,args=null,retried=false}={}){
  const s=await ensureToken();
  const headers={Authorization:'Bearer '+s.token,'Content-Type':binary?'application/octet-stream':'application/json'};
  if(root&&s.pathRoot)headers['Dropbox-API-Path-Root']=asciiJson({'.tag':'root',root:s.pathRoot});
  if(args)headers['Dropbox-API-Arg']=asciiJson(args);
  const response=await fetch((binary?'https://content.dropboxapi.com/2/':'https://api.dropboxapi.com/2/')+route,{method:'POST',headers,body:binary??JSON.stringify(body),signal:AbortSignal.timeout(90000)});
  if(response.status===401&&!retried){sessionStorage.removeItem(SESSION);return api(route,body,{root,binary,args,retried:true});}
  // Dropbox sends some errors (notably 400s) as plain text, not JSON -- keep the raw text so the
  // real cause reaches the technician instead of a generic message.
  const text=await response.text();let data={};try{data=JSON.parse(text)}catch{}
  if(!response.ok){throw new DropboxError(response.status===429?'Dropbox pide esperar. Reintenta más tarde.':data.error_summary??`Dropbox respondió ${response.status}: ${text.slice(0,300)||'sin detalle'}`,response.status,data);}
  return data;
}
export async function verifyFolder(path){const d=await api('files/get_metadata',{path});if(d['.tag']!=='folder')throw new Error('El destino no es una carpeta.');return d;}
export async function contentHash(blob){
  const chunks=[];for(let start=0;start<blob.size;start+=4194304)chunks.push(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.slice(start,start+4194304).arrayBuffer())));
  const concat=new Uint8Array(chunks.length*32);chunks.forEach((c,i)=>concat.set(c,i*32));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',concat))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function upload(photo){return api('files/upload',null,{binary:photo.blob,args:{path:photo.folder+'/'+photo.name,mode:'add',autorename:false,strict_conflict:true,content_hash:photo.contentHash}});}
export async function metadata(path){return api('files/get_metadata',{path});}
