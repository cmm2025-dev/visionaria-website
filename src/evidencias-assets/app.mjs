import {ACTIVITIES,chileDate,baseName,filename,extensionFor,folderFor,validateCapture,csv,makeZip,randomId} from './core.mjs';
import {getAll,putMany,removeMany,database} from './storage.mjs';
import * as dropbox from './dropbox-client.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='visionaria-evidence-settings-v1';
// This is a verification control, not forensic photography -- resolution past this is never needed,
// and shrinking every photo keeps uploads fast on weak field signal.
const MAX_DIMENSION=1600,JPEG_QUALITY=0.8;
const chileDateTime=iso=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
// Gallery photos get the phone's position when they are added, not where they were shot -- say so.
function gpsLabel(gps,source){if(!gps)return 'Sin GPS';return `${source==='gallery'?'Ubicación al registrar':'GPS'} ${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)} ±${gps.accuracy} m`;}
// Resize, burn in the visible stamp and re-encode in a single pass, so there is only one generation of JPEG loss.
function processImage(file,lines){
  return new Promise(resolve=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
      try{
        const scale=Math.min(1,MAX_DIMENSION/Math.max(img.naturalWidth,img.naturalHeight));
        const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        const size=Math.max(12,Math.round(Math.max(w,h)*0.016)),line=Math.round(size*1.35),pad=Math.round(size*0.6),band=lines.length*line+pad*2;
        ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,h-band,w,band);
        ctx.fillStyle='#fff';ctx.font=`600 ${size}px sans-serif`;ctx.textBaseline='top';
        lines.forEach((text,i)=>ctx.fillText(text,pad,h-band+pad+i*line,w-pad*2));
        canvas.toBlob(blob=>{URL.revokeObjectURL(url);resolve(blob);},'image/jpeg',JPEG_QUALITY);
      }catch{URL.revokeObjectURL(url);resolve(null);}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};
    img.src=url;
  });
}
// Minimal EXIF APP1 segment with only GPS tags, so Dropbox and photo viewers can place the photo on a map.
function exifGps(gps){
  const b=new Uint8Array(170),v=new DataView(b.buffer),t=10;
  const u16=(o,x)=>v.setUint16(t+o,x),u32=(o,x)=>v.setUint32(t+o,x);
  v.setUint16(0,0xFFE1);v.setUint16(2,168);b.set([69,120,105,102,0,0],4);
  b.set([77,77],t);u16(2,42);u32(4,8);
  u16(8,1);u16(10,0x8825);u16(12,4);u32(14,1);u32(18,26);u32(22,0);
  const entries=[[0,1,4,0,[2,3,0,0]],[1,2,2,0,[gps.lat<0?83:78,0]],[2,5,3,104],[3,2,2,0,[gps.lon<0?87:69,0]],[4,5,3,128],[31,5,1,152]];
  u16(26,entries.length);
  entries.forEach(([tag,type,count,offset,inline],i)=>{const o=28+i*12;u16(o,tag);u16(o+2,type);u32(o+4,count);if(inline)b.set(inline,t+o+8);else u32(o+8,offset);});
  u32(28+entries.length*12,0);
  const dms=(o,value)=>{const a=Math.abs(value),d=Math.floor(a),mf=(a-d)*60,mi=Math.floor(mf),s=Math.round((mf-mi)*60000);[[d,1],[mi,1],[s,1000]].forEach(([n,den],i)=>{u32(o+i*8,n);u32(o+i*8+4,den);});};
  dms(104,gps.lat);dms(128,gps.lon);u32(152,Math.max(1,Math.round(gps.accuracy)));u32(156,1);
  return b;
}
async function withExif(blob,gps){
  const bytes=new Uint8Array(await blob.arrayBuffer());if(bytes[0]!==0xFF||bytes[1]!==0xD8)return blob;
  const at=bytes[2]===0xFF&&bytes[3]===0xE0?4+((bytes[4]<<8)|bytes[5]):2;
  return new Blob([bytes.slice(0,at),exifGps(gps),bytes.slice(at)],{type:'image/jpeg'});
}
let pendingFix=null,gpsDeniedWarned=false;
function requestFix(){
  if(!navigator.geolocation)return Promise.resolve(null);
  return new Promise(resolve=>navigator.geolocation.getCurrentPosition(
    p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:Math.round(p.coords.accuracy),at:new Date().toISOString()}),
    error=>{if(error.code===1&&!gpsDeniedWarned){gpsDeniedWarned=true;toast('Ubicación desactivada: las fotos se guardarán marcadas "Sin GPS".');}resolve(null);},
    {enableHighAccuracy:true,timeout:15000,maximumAge:30000}));
}
let config={root:'/2026-DPR-ANF_OPERACIONES',pilot:true,email:'',slugs:{}};
try{config={...config,slugs:(JSON.parse(localStorage.getItem(KEY)||'{}').slugs)||{}}}catch{}
let points=[],photos=[],draft=[],filter='all',busy=false,toastTimer,previewURLs=[],recordURLs=[],largeURL,storageReady=false;
const locks=(key,fn)=>navigator.locks?navigator.locks.request(key,fn):fn();
const slugFor=activity=>config.slugs[activity.label]||activity.slug;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function formError(message){$('form-error').textContent=message;$('form-error').hidden=!message;}
function meta(){return{commune:$('commune').value,point:$('point').value,date:$('date').value,activity:$('activity').value,author:$('author').value.trim(),note:$('note').value.trim()};}
function currentFolder(){return folderFor(config.root,$('commune').value)+(config.pilot?'/_PILOTO_CAPTURA':'');}
function currentBase(){const m=meta(),a=ACTIVITIES.find(a=>a.label===m.activity);return m.point&&a?baseName(m.point,m.date,slugFor(a)):null;}
function loadPoints(){
  const previous=$('point').value,query=$('point-search').value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,''),commune=$('commune').value;
  const matches=points.filter(p=>p.commune===commune&&(!query||(p.code+' '+p.address).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query)));
  $('point').innerHTML='<option value="">Selecciona un punto</option>'+matches.map(p=>`<option value="${esc(p.code)}">${esc(p.code)} · ${esc(p.address||p.type)}</option>`).join('')+'<option value="GENERAL">GENERAL · Novedad sin punto específico</option>';
  if(matches.some(p=>p.code===previous)||previous==='GENERAL')$('point').value=previous;
  if(query&&matches.length===1)$('point').value=matches[0].code;
  renderContext();
}
function renderContext(){
  const m=meta(),p=points.find(p=>p.code===m.point),act=ACTIVITIES.find(a=>a.label===m.activity);
  $('point-address').querySelector('span').textContent=p?(p.address||p.situation):m.point==='GENERAL'?'Novedad de la comuna sin un punto específico.':'Selecciona un punto del catálogo del proyecto.';
  $('folder-commune').textContent=m.commune;
  $('destination-description').textContent=config.pilot?'Prueba protegida: se usará Fotos/_PILOTO_CAPTURA.':'La comuna determina dónde se guardan tus fotografías.';
  document.querySelector('.path-root').textContent=config.root.replace(/^\//,'');
  let base;try{base=currentBase()}catch{}
  $('name-example').textContent=base?base+'.jpg':'PUNTO_fecha_actividad.jpg';
  $('note-optional').textContent=act?.type==='Novedad'?'obligatoria para novedades':'opcional para etapas';
  $('note').required=act?.type==='Novedad';
  renderDraft();
}
function nextIndex(base,folder,local=photos){let index=1;while(local.some(p=>p.base===base&&p.folder===folder&&p.index===index))index++;return index;}
function renderDraft(){
  previewURLs.forEach(URL.revokeObjectURL);previewURLs=[];
  $('photo-count').textContent=draft.length+' foto'+(draft.length===1?'':'s');$('photo-empty').hidden=draft.length>0;$('discard').hidden=!draft.length;
  let base;try{base=currentBase()}catch{};let index=base?nextIndex(base,currentFolder()):1;
  $('photo-previews').innerHTML=draft.map((item,i)=>{const url=URL.createObjectURL(item.blob);previewURLs.push(url);return `<div class="photo-tile"><img src="${url}" alt="Fotografía ${i+1}" data-draft-preview="${i}"><button type="button" class="remove-photo" data-remove="${i}" aria-label="Quitar fotografía ${i+1}">×</button><code>${esc(base?filename(base,index+i,item.extension):'Nombre automático al seleccionar punto')}</code></div>`}).join('');
  $('save-capture').disabled=!draft.length||busy||!storageReady;
  $('save-capture').innerHTML=(busy?'Guardando…':'Guardar y enviar')+'<svg><use href="#i-arrow"/></svg>';
  $('submit-detail').textContent='Primero se guarda aquí; luego se confirma la recepción en Dropbox.';
}
function renderConnection(){$('connection').querySelector('span').textContent='Dropbox conectado';$('cloud-state').innerHTML='<span class="dot"></span>Conectado · cuenta de la empresa';renderDraft();}
function showView(view){$('capture-view').hidden=view!=='capture';$('records-view').hidden=view!=='records';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='records')renderRecords();window.scrollTo({top:0,behavior:'instant'});}
async function refresh(){photos=await getAll();$('nav-count').textContent=photos.length;renderRecords();renderDraft();}
async function addFiles(list,source){formError('');
  const slow=setTimeout(()=>toast('Obteniendo ubicación GPS…'),1500);const fix=await(pendingFix??requestFix());clearTimeout(slow);pendingFix=null;
  const accepted=[];for(const file of list){try{
    if(file.size===0||file.size>25*1024*1024)throw new Error('Cada foto debe pesar entre 1 byte y 25 MB.');
    accepted.push({blob:file,extension:'jpg',originalExtension:extensionFor(file),registeredAt:new Date().toISOString(),gps:fix,gpsSource:source});
  }catch(error){formError(error.message);}}
  if(draft.length+accepted.length>20){formError('Puedes guardar hasta 20 fotografías por registro. Guarda este grupo antes de continuar.');return;}draft.push(...accepted);renderDraft();}
function lockComposer(locked){for(const id of ['commune','date','point-search','point','activity','note','take-photo','add-files','discard'])$(id).disabled=locked;}
async function saveCapture(event){event.preventDefault();if(busy)return;formError('');try{
  const m=meta(),act=validateCapture(m,points);if(!draft.length)throw new Error('Toma o selecciona al menos una fotografía.');const batch=randomId(),folder=currentFolder(),base=baseName(m.point,m.date,slugFor(act));
  busy=true;lockComposer(true);renderDraft();
  const prepared=[];for(const file of draft){
    const lines=[`${m.point} · ${m.activity} · ${m.commune}`,`Hecho ${m.date.split('-').reverse().join('-')} · Registro ${chileDateTime(file.registeredAt)}`,gpsLabel(file.gps,file.gpsSource),m.author];
    let blob=await processImage(file.blob,lines),extension='jpg';
    if(blob&&file.gps)blob=await withExif(blob,file.gps);
    if(!blob){blob=file.blob;extension=file.originalExtension;}
    prepared.push({...file,blob,extension});
  }
  const rows=await locks('visionaria-save',async()=>{const existing=await getAll(),rows=[];for(const file of prepared){const index=nextIndex(base,folder,[...existing,...rows]);rows.push({id:randomId(),batch,...m,type:act.type,pilot:config.pilot,folder,base,index,name:filename(base,index,file.extension),extension:file.extension,blob:file.blob,registeredAt:file.registeredAt,gps:file.gps??null,gpsSource:file.gpsSource??'',savedAt:new Date().toISOString(),status:'pending',error:'',contentHash:crypto.subtle?await dropbox.contentHash(file.blob):''});}await putMany(rows);return rows;});
  draft=[];await refresh();toast('Guardado en este dispositivo. Enviando a Dropbox…');showView('records');
  busy=false;lockComposer(false);renderDraft();renderRecords();
  if(navigator.onLine)await syncPhotos(rows.map(r=>r.id));
 }catch(error){formError('No se completó el guardado: '+error.message);busy=false;lockComposer(false);renderDraft();}}
function renderRecords(){
  recordURLs.forEach(URL.revokeObjectURL);recordURLs=[];
  $('stat-total').textContent=photos.length;$('stat-sent').textContent=photos.filter(p=>p.status==='sent').length;$('stat-pending').textContent=photos.filter(p=>p.status!=='sent').length;
  const groups=new Map();for(const p of [...photos].sort((a,b)=>b.savedAt.localeCompare(a.savedAt))){if(!groups.has(p.batch))groups.set(p.batch,[]);groups.get(p.batch).push(p);}
  let entries=[...groups.values()];if(filter==='sent')entries=entries.filter(g=>g.every(p=>p.status==='sent'));if(filter==='pending')entries=entries.filter(g=>g.some(p=>p.status!=='sent'));
  $('records-list').innerHTML=entries.length?entries.map(group=>{const p=group[0],sent=group.filter(p=>p.status==='sent').length,errors=group.filter(p=>p.error),complete=sent===group.length;return `<article class="record"><div class="record-top"><div><h3>${esc(p.point)} <span style="font-weight:400;color:#a4ae98">/</span> ${esc(p.activity)}</h3><div class="record-meta">${esc(p.commune)} · ${esc(p.date.split('-').reverse().join('-'))} · ${esc(p.author)}${p.pilot?' · Prueba':''} · ${p.gps?'GPS ±'+esc(p.gps.accuracy)+' m':'Sin GPS'}</div></div><span class="status ${complete?'sent':errors.length?'error':''}">${complete?'Recibido en Dropbox':sent?`${sent}/${group.length} enviadas`:'Pendiente de envío'}</span></div>${p.note?`<p class="record-note">${esc(p.note)}</p>`:''}<div class="record-photos">${group.map(photo=>{const url=URL.createObjectURL(photo.blob);recordURLs.push(url);return `<button type="button" class="record-photo" data-preview="${photo.id}" aria-label="Ver ${esc(photo.name)}"><img src="${url}" alt="Evidencia ${esc(photo.point)}"><span>${photo.status==='sent'?'✓ Dropbox':'○ En dispositivo'}</span></button>`}).join('')}</div><div class="record-path">${esc(p.folder)}/<br>${esc(group.map(p=>p.name).join(' · '))}</div>${errors.length?`<div class="record-error">${esc(errors[0].error)} Tus fotos siguen guardadas en este dispositivo.</div>`:''}<div class="record-actions">${!complete?`<button type="button" class="text-button" data-send="${p.batch}">Enviar a Dropbox</button>`:''}<button type="button" class="text-button" data-download="${p.batch}">Descargar fotos y ficha</button><button type="button" class="text-button" data-delete="${p.batch}">Eliminar copia local</button></div></article>`}).join(''):'<div class="empty-records"><svg><use href="#i-grid"/></svg><h3>Aquí comienza tu registro.</h3><p>Las fotografías que guardes aparecerán aquí.</p></div>';
  $('sync-all').disabled=busy||!photos.some(p=>p.status!=='sent');$('export-all').disabled=busy||!photos.length;
}
async function syncPhotos(ids=null){
  if(busy){toast('Ya hay una operación en curso.');return;}if(!navigator.onLine){toast('Sin conexión. Las fotos siguen guardadas; vuelve a intentar con señal.');return;}
  await locks('visionaria-dropbox-sync',async()=>{
    busy=true;renderRecords();renderDraft();let sent=0,failed=0;
    try{photos=await getAll();const selected=photos.filter(p=>p.status!=='sent'&&(!ids||ids.includes(p.id)));const folders=new Set();
      for(const p of selected){try{
        if(!p.contentHash)p.contentHash=await dropbox.contentHash(p.blob);
        if(!folders.has(p.folder)){await dropbox.verifyFolder(p.folder);folders.add(p.folder);}
        let result=null;for(let attempt=0;attempt<100;attempt++){
          await putMany([p]);
          try{const remote=await dropbox.metadata(p.folder+'/'+p.name);if(remote['.tag']==='file'&&remote.content_hash===p.contentHash){result=remote;break;}p.index++;p.name=filename(p.base,p.index,p.extension);continue;}catch(error){if(!(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('not_found')))throw error;}
          try{result=await dropbox.upload(p);break;}catch(error){if(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('conflict'))continue;throw error;}
        }
        if(!result)throw new Error('No se pudo asignar un nombre libre. Revisa el destino.');
        p.status='sent';p.error='';p.dropboxId=result.id;p.dropboxPath=result.path_display;p.sentAt=new Date().toISOString();sent++;
      }catch(error){p.status='error';p.error=error.name==='TimeoutError'?'La respuesta tardó demasiado. Reintenta para comprobar la recepción sin duplicar.':error.message;failed++;}
        await putMany([p]);await refresh();
      }
      toast(failed?`${sent} foto(s) recibidas en Dropbox. Hay ${failed} pendiente(s) con error.`:sent?`${sent} foto(s) recibidas y confirmadas en Dropbox.`:'No hay fotografías pendientes para enviar.');
    }finally{busy=false;await refresh();renderConnection();}
  });
}
function download(blob,name){const a=$('download-link');if(a.href.startsWith('blob:'))URL.revokeObjectURL(a.href);a.href=URL.createObjectURL(blob);a.download=name;$('export-dialog').showModal();}
async function exportPhotos(batch=null){if(busy)return;const selected=photos.filter(p=>!batch||p.batch===batch);if(!selected.length)return;try{busy=true;renderRecords();toast('Preparando respaldo con nombres automáticos…');const rows=[['ID evidencia','ID captura','Comuna','Punto','Fecha del hecho','Actividad','Tipo','Autor declarado','Detalle','Nombre de foto','Ruta prevista','Estado Dropbox','Ruta confirmada','Fecha de registro en app','Recibido en Dropbox','Piloto','Latitud','Longitud','Precisión GPS (m)','Origen ubicación'],...selected.map(p=>[p.id,p.batch,p.commune,p.point,p.date,p.activity,p.type,p.author,p.note,p.name,p.folder+'/'+p.name,p.status,p.dropboxPath??'',p.registeredAt,p.sentAt??'',p.pilot?'Sí':'No',p.gps?.lat??'',p.gps?.lon??'',p.gps?.accuracy??'',p.gps?(p.gpsSource==='gallery'?'Galería (ubicación al registrar)':'Cámara (al capturar)'):'Sin GPS'])];const files=selected.map(p=>({name:p.folder.replace(/^\//,'')+'/'+p.name,blob:p.blob}));files.push({name:'registro_evidencias.csv',blob:new Blob([csv(rows)],{type:'text/csv;charset=utf-8'})});const blob=await makeZip(files);download(blob,`Visionaria_Evidencias_${chileDate()}${batch?'_'+selected[0].point:''}.zip`);toast('Respaldo preparado. Presiona Descargar archivo ZIP.');}catch(error){toast('No se pudo preparar el respaldo: '+error.message)}finally{busy=false;renderRecords();renderDraft();}}
function openSettings(){if(busy){toast('Espera a que termine la operación.');return;}$('setting-root').value=config.root;$('setting-pilot').checked=config.pilot;$('settings-result').textContent='';$('slug-settings').innerHTML=ACTIVITIES.map((a,i)=>`<label>${esc(a.label)}<input data-slug-index="${i}" value="${esc(slugFor(a))}" pattern="[a-z0-9_]+" required></label>`).join('');$('settings-dialog').showModal();}
function openPhoto(blob,caption){if(largeURL)URL.revokeObjectURL(largeURL);largeURL=URL.createObjectURL(blob);$('large-photo').src=largeURL;$('large-caption').textContent=caption;$('photo-dialog').showModal();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-settings]').forEach(b=>b.addEventListener('click',openSettings));
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('commune').addEventListener('change',()=>{$('point-search').value='';$('point').value='';loadPoints();});$('point-search').addEventListener('input',loadPoints);
for(const id of ['point','date','activity'])$(id).addEventListener('change',renderContext);
$('take-photo').addEventListener('click',()=>{try{validateCapture(meta(),points);formError('');pendingFix=requestFix();$('camera-input').click();}catch(e){formError(e.message)}});
$('add-files').addEventListener('click',()=>{try{validateCapture(meta(),points);formError('');pendingFix=requestFix();$('gallery-input').click();}catch(e){formError(e.message)}});
for(const id of ['camera-input','gallery-input'])$(id).addEventListener('change',async e=>{await addFiles(e.target.files,id==='camera-input'?'camera':'gallery');e.target.value='';});
$('discard').addEventListener('click',()=>{if(confirm('¿Descartar las fotografías seleccionadas? Todavía no están guardadas.')){draft=[];renderDraft();}});
$('photo-previews').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){draft.splice(Number(b.dataset.remove),1);renderDraft();return;}const img=e.target.closest('[data-draft-preview]');if(img){const item=draft[Number(img.dataset.draftPreview)];openPhoto(item.blob,'Fotografía seleccionada · pendiente de guardar');}});
$('capture-form').addEventListener('submit',saveCapture);
$('records-list').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.preview){const p=photos.find(p=>p.id===b.dataset.preview);openPhoto(p.blob,p.name);}if(b.dataset.send)await syncPhotos(photos.filter(p=>p.batch===b.dataset.send).map(p=>p.id));if(b.dataset.download)await exportPhotos(b.dataset.download);if(b.dataset.delete){if(busy){toast('Espera a que termine el envío.');return;}const selected=photos.filter(p=>p.batch===b.dataset.delete),unsent=selected.some(p=>p.status!=='sent');if(confirm(unsent?'Estas fotos aún no tienen recepción confirmada en Dropbox. ¿Eliminar definitivamente la copia de este dispositivo? Descarga un respaldo primero.':'¿Eliminar las copias locales de este registro? Los archivos de Dropbox se conservan.')){await removeMany(selected.map(p=>p.id));await refresh();toast('Copia local eliminada.');}}});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderRecords();}));
$('sync-all').addEventListener('click',()=>syncPhotos());$('export-all').addEventListener('click',()=>exportPhotos());
$('settings-form').addEventListener('submit',e=>{e.preventDefault();try{const slugs={};document.querySelectorAll('[data-slug-index]').forEach(input=>{if(!/^[a-z0-9_]+$/.test(input.value))throw new Error('Los sufijos admiten letras minúsculas, números y guiones bajos.');slugs[ACTIVITIES[Number(input.dataset.slugIndex)].label]=input.value;});config={...config,slugs};localStorage.setItem(KEY,JSON.stringify({slugs}));renderContext();$('settings-dialog').close();toast('Configuración guardada. Los registros anteriores conservan su destino.');}catch(error){$('settings-result').textContent=error.message;}});
$('verify-folder').addEventListener('click',async()=>{try{$('settings-result').textContent='Verificando…';const folder=currentFolder();await dropbox.verifyFolder(folder);$('settings-result').textContent='Carpeta encontrada: '+folder+'. Los permisos de escritura se comprobarán al enviar.';}catch(error){$('settings-result').textContent='No se pudo verificar: '+error.message;}});
$('connection').addEventListener('click',openSettings);
function network(){const online=navigator.onLine;$('network').innerHTML=`<span class="dot ${online?'':'amber'}"></span>${online?'Con señal':'Sin conexión'}`;}
window.addEventListener('online',()=>{network();toast('Volvió la conexión. Puedes enviar las evidencias pendientes.');});window.addEventListener('offline',network);
window.addEventListener('beforeunload',e=>{if(draft.length||busy){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy){refresh().catch(()=>{});renderConnection();}});
async function init(){
  $('date').value=chileDate();$('date').max=chileDate();
  $('today-label').textContent=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  $('activity').innerHTML='<option value="">Selecciona una actividad</option>'+['Etapa','Novedad'].map(type=>`<optgroup label="${type==='Etapa'?'Etapas de obra':'Novedades'}">${ACTIVITIES.filter(a=>a.type===type).map(a=>`<option>${esc(a.label)}</option>`).join('')}</optgroup>`).join('');
  network();
  try{const response=await fetch('/api/evidencias/config');if(!response.ok)throw new Error('No se pudo verificar tu sesión.');const cfg=await response.json();config={...config,root:cfg.root,pilot:cfg.pilot,email:cfg.email};$('author').value=cfg.email;$('author').disabled=true;}catch(error){formError('No se pudo verificar tu acceso: '+error.message+' Vuelve a iniciar sesión en la Intranet.');$('take-photo').disabled=true;$('add-files').disabled=true;}
  renderConnection();
  try{const response=await fetch('/api/evidencias/assets/catalogue.json');if(!response.ok)throw new Error('No se pudo cargar el catálogo.');points=await response.json();loadPoints();await database();storageReady=true;await refresh();if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}catch(error){formError('No se pudo preparar el almacenamiento o el catálogo. '+error.message);$('take-photo').disabled=true;$('add-files').disabled=true;}
  if('serviceWorker'in navigator)navigator.serviceWorker.register('/api/evidencias/assets/sw.js').catch(()=>{});
}
init();
