import {ACTIVITIES,EXECUTORS,PROTOCOL,chileDate,baseName,filename,extensionFor,folderFor,validateCapture,csv,makeZip,randomId} from './core.mjs';
import {getAll,putMany,removeMany,database} from './storage.mjs';
import * as dropbox from './dropbox-client.mjs';
import {gpsLabel,processImage,withExif,requestFix as sharedRequestFix,datosOriginales} from './media.mjs';
import {setupLevantamiento,showLevantamiento,contarPendientes,enviarTodoPendiente,masAntiguoPendiente,actualizarOficina,estadoOficina} from './levantamiento.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='visionaria-evidence-settings-v1';
const chileDateTime=iso=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
let pendingFix=null,gpsDeniedWarned=false;
const requestFix=()=>sharedRequestFix(()=>{if(!gpsDeniedWarned){gpsDeniedWarned=true;toast('Ubicación desactivada: las fotos se guardarán marcadas "Sin GPS".');}});
let config={root:'/2026-DPR-ANF_OPERACIONES',pilot:true,email:'',parteQueue:null,levantamientoQueue:null};
// Only the last "Ejecutó" choice is remembered on the device; name suffixes are fixed by the planilla.
let lastExecutor='';try{lastExecutor=JSON.parse(localStorage.getItem(KEY)||'{}').executor||''}catch{}
let points=[],photos=[],draft=[],filter='all',busy=false,toastTimer,previewURLs=[],recordURLs=[],largeURL,storageReady=false;
let mode='activity',protoDraft={},protoSlot=null,protoURLs=[];
const slotTitle=s=>s.group===s.label?s.label:`${s.group} · ${s.label}`;
// A Novedad can go to the parte diario without a photo; stages always need one.
const sinFotoPermitido=()=>mode==='activity'&&!!config.parteQueue&&ACTIVITIES.find(a=>a.label===$('activity').value)?.type==='Novedad';
const protoSlots=()=>PROTOCOL.filter(s=>!s.antenna||$('proto-antenna').checked);
const protoTotal=()=>protoSlots().reduce((n,s)=>n+(protoDraft[s.code]?.length||0),0);
function validateProtocol(m){
  const point=points.find(p=>p.code===m.point&&p.commune===m.commune);
  if(!point)throw new Error('El protocolo requiere un punto específico del catálogo.');
  if(/por definir/i.test(point.situation))throw new Error('Este punto requiere confirmación de la Dirección antes de registrar el protocolo.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(m.date)||Number.isNaN(Date.parse(m.date))||new Date(m.date+'T12:00:00Z').toISOString().slice(0,10)!==m.date||m.date>chileDate())throw new Error('La fecha del hecho debe ser válida y no futura.');
  if(!m.author)throw new Error('No se pudo identificar al técnico. Vuelve a iniciar sesión en la Intranet.');
  const act=ACTIVITIES.find(a=>a.label===m.activity);
  if(act?.type!=='Etapa')throw new Error('Selecciona la etapa a la que corresponde el protocolo.');
  if(!EXECUTORS.includes(m.executor))throw new Error('Indica quién ejecutó la etapa.');
  return act;
}
function renderProtocol(){
  protoURLs.forEach(URL.revokeObjectURL);protoURLs=[];
  const slots=protoSlots();
  $('proto-slots').innerHTML=slots.map(s=>{const items=protoDraft[s.code]||[];return `<div class="proto-slot${items.length?' done':''}"><div class="proto-head"><div><strong>${esc(s.code)} · ${esc(slotTitle(s))}${items.length?` · ${items.length} foto${items.length===1?'':'s'}`:''}</strong><span class="field-hint">Fotografiar ${esc(s.stage)}</span></div><div class="proto-actions"><button type="button" class="btn btn-camera" data-proto-camera="${esc(s.code)}"><svg><use href="#i-camera"/></svg>Cámara</button><button type="button" class="btn btn-secondary" data-proto-gallery="${esc(s.code)}"><svg><use href="#i-plus"/></svg>Galería</button></div></div>${items.length?`<div class="proto-thumbs">${items.map((item,i)=>{const url=URL.createObjectURL(item.blob);protoURLs.push(url);return `<div class="photo-tile"><img src="${url}" alt="${esc(s.code)} foto ${i+1}"><button type="button" class="remove-photo" data-proto-remove="${esc(s.code)}|${i}" aria-label="Quitar fotografía">×</button></div>`}).join('')}</div>`:''}</div>`}).join('');
  $('proto-count').textContent=`${slots.filter(s=>protoDraft[s.code]?.length).length}/${slots.length} tomas`;
  renderDraft();
}
function setMode(next){
  mode=next;
  document.querySelectorAll('.mode-switch label').forEach(l=>l.classList.toggle('active',l.querySelector('input').value===mode));
  $('antenna-field').hidden=mode!=='protocol';
  $('photos-card').hidden=mode==='protocol';$('protocol-card').hidden=mode!=='protocol';
  formError('');renderContext();renderProtocol();
}
async function finalizePhoto(file,m,activityLabel){
  const tomada=file.diferida?` · Foto ${file.tomadaEn?file.tomadaEn.slice(8,10)+'-'+file.tomadaEn.slice(5,7)+'-'+file.tomadaEn.slice(0,4)+' '+file.tomadaEn.slice(11,16):'sin fecha original'} · CARGA DIFERIDA`:'';
  const lines=[`${m.point} · ${activityLabel} · ${m.commune}`,`Hecho ${m.date.split('-').reverse().join('-')}${tomada} · Registro ${chileDateTime(file.registeredAt)}`,gpsLabel(file.gps,file.gpsSource),m.author];
  let blob=await processImage(file.blob,lines),extension='jpg';
  if(blob&&file.gps)blob=await withExif(blob,file.gps);
  if(!blob){blob=file.blob;extension=file.originalExtension;}
  return {...file,blob,extension};
}
async function saveProtocol(){
  const m=meta(),act=validateProtocol(m);
  const slots=protoSlots().filter(s=>protoDraft[s.code]?.length);
  if(!slots.length)throw new Error('Toma al menos una fotografía del protocolo.');
  // The parte diario row expects a photo named after the stage; a quality-named shot alone does not count.
  if(slots.every(s=>s.quality))throw new Error('Agrega al menos una toma además del gabinete: esa es la foto de la etapa en el parte diario.');
  const batch=randomId(),folder=currentFolder();
  busy=true;lockComposer(true);renderDraft();
  const prepared=[];for(const slot of slots)for(const file of protoDraft[slot.code])prepared.push({slot,file:await finalizePhoto(file,m,`${slot.code} ${slotTitle(slot)}`)});
  const rows=await locks('visionaria-save',async()=>{const existing=await getAll(),rows=[];for(const {slot,file} of prepared){const base=baseName(m.point,m.date,slot.quality??`${act.slug}_${slot.slug}`),index=nextIndex(base,folder,[...existing,...rows]);rows.push({id:randomId(),batch,...m,activity:`Protocolo ${slot.code} ${slotTitle(slot)}`,type:'Protocolo',slot:slot.code,hecho:act.label,parte:config.parteQueue?'pending':null,pilot:config.pilot,folder,base,index,name:filename(base,index,file.extension),extension:file.extension,blob:file.blob,registeredAt:file.registeredAt,gps:file.gps??null,gpsSource:file.gpsSource??'',tomadaEn:file.tomadaEn??null,diferida:!!file.diferida,savedAt:new Date().toISOString(),status:'pending',error:'',contentHash:crypto.subtle?await dropbox.contentHash(file.blob):''});}await putMany(rows);return rows;});
  protoDraft={};renderProtocol();await refresh();toast('Protocolo guardado en este dispositivo. Enviando a Dropbox…');showView('records');
  busy=false;lockComposer(false);renderDraft();renderRecords();
  if(navigator.onLine)await syncPhotos(rows.map(r=>r.id));
}
const locks=(key,fn)=>navigator.locks?navigator.locks.request(key,fn):fn();
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function formError(message){$('form-error').textContent=message;$('form-error').hidden=!message;}
function meta(){return{commune:$('commune').value,point:$('point').value,date:$('date').value,activity:$('activity').value,author:$('author').value.trim(),executor:$('executor').value,note:$('note').value.trim()};}
function currentFolder(){return folderFor(config.root,$('commune').value)+(config.pilot?'/_PILOTO_CAPTURA':'');}
function currentBase(){const m=meta(),a=ACTIVITIES.find(a=>a.label===m.activity);return m.point&&a?baseName(m.point,m.date,a.slug):null;}
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
  $('name-example').textContent=mode==='protocol'?`${m.point&&m.point!=='GENERAL'?m.point+'_'+m.date:'PUNTO_fecha'}_${act?.type==='Etapa'?act.slug:'etapa'}_31_camara_panoramica.jpg`:base?base+'.jpg':'PUNTO_fecha_actividad.jpg';
  $('note-optional').textContent=mode==='protocol'?'opcional':act?.type==='Novedad'?'obligatoria para novedades':'opcional para etapas';
  $('note').required=mode!=='protocol'&&act?.type==='Novedad';
  renderDraft();
}
function nextIndex(base,folder,local=photos){let index=1;while(local.some(p=>p.base===base&&p.folder===folder&&p.index===index))index++;return index;}
function renderDraft(){
  previewURLs.forEach(URL.revokeObjectURL);previewURLs=[];
  $('photo-count').textContent=draft.length+' foto'+(draft.length===1?'':'s');$('photo-empty').hidden=draft.length>0;$('discard').hidden=!draft.length;
  let base;try{base=currentBase()}catch{};let index=base?nextIndex(base,currentFolder()):1;
  $('photo-previews').innerHTML=draft.map((item,i)=>{const url=URL.createObjectURL(item.blob);previewURLs.push(url);return `<div class="photo-tile"><img src="${url}" alt="Fotografía ${i+1}" data-draft-preview="${i}"><button type="button" class="remove-photo" data-remove="${i}" aria-label="Quitar fotografía ${i+1}">×</button><code>${esc(base?filename(base,index+i,item.extension):'Nombre automático al seleccionar punto')}</code></div>`}).join('');
  $('photo-empty').querySelector('p').innerHTML=sinFotoPermitido()?'Para una novedad la foto es opcional.<br>Puedes guardar solo con la observación.':'Enfoca el trabajo. El nombre y la carpeta<br>quedan a cargo del sistema.';
  $('save-capture').disabled=!(mode==='protocol'?protoTotal():draft.length||sinFotoPermitido())||busy||!storageReady;
  $('save-capture').innerHTML=(busy?'Guardando…':'Guardar y enviar')+'<svg><use href="#i-arrow"/></svg>';
  $('submit-detail').textContent='Primero se guarda aquí; luego se confirma la recepción en Dropbox.';
}
function renderConnection(){$('connection').querySelector('span').textContent='Dropbox conectado';$('cloud-state').innerHTML='<span class="dot"></span>Conectado · cuenta de la empresa';renderDraft();}
function showView(view){$('capture-view').hidden=view!=='capture';$('records-view').hidden=view!=='records';$('levantamiento-view').hidden=view!=='levantamiento';if(view==='levantamiento')showLevantamiento();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='records')renderRecords();window.scrollTo({top:0,behavior:'instant'});}
async function refresh(){photos=await getAll();network();$('nav-count').textContent=photos.filter(p=>p.blob).length;renderRecords();renderDraft();}
async function collectFiles(list,source){formError('');
  const slow=setTimeout(()=>toast('Obteniendo ubicación GPS…'),1500);const fix=await(pendingFix??requestFix());clearTimeout(slow);pendingFix=null;
  const accepted=[];for(const file of list){try{
    if(file.size===0||file.size>25*1024*1024)throw new Error('Cada foto debe pesar entre 1 byte y 25 MB.');
    // A camera shot is taken now; a gallery photo keeps its own date, time and (if the phone kept it) GPS, and is marked
    // as a deferred load, so the record shows when it was shot and when it reached the app (respaldo ante la ITO).
    const registeredAt=new Date().toISOString();
    if(source==='gallery'){const o=await datosOriginales(file);
      accepted.push({blob:file,extension:'jpg',originalExtension:extensionFor(file),registeredAt,tomadaEn:o.tomadaEn,diferida:true,gps:o.gps??fix,gpsSource:o.gps?'foto':source});}
    else accepted.push({blob:file,extension:'jpg',originalExtension:extensionFor(file),registeredAt,tomadaEn:horaLocal(registeredAt),diferida:false,gps:fix,gpsSource:source});
  }catch(error){formError(error.message);}}
  return accepted;}
async function addFiles(list,source){const accepted=await collectFiles(list,source);
  if(draft.length+accepted.length>20){formError('Puedes guardar hasta 20 fotografías por registro. Guarda este grupo antes de continuar.');return;}draft.push(...accepted);renderDraft();}
function lockComposer(locked){for(const id of ['commune','date','point-search','point','activity','executor','note','take-photo','add-files','discard','proto-antenna'])$(id).disabled=locked;document.querySelectorAll('input[name="mode"],#proto-slots button').forEach(el=>el.disabled=locked);}
async function saveCapture(event){event.preventDefault();if(busy)return;formError('');
  if(mode==='protocol'){try{await saveProtocol();}catch(error){formError('No se completó el guardado: '+error.message);busy=false;lockComposer(false);renderDraft();}return;}
  try{
  const m=meta(),act=validateCapture(m,points);if(!draft.length&&!sinFotoPermitido())throw new Error('Toma o selecciona al menos una fotografía.');const batch=randomId(),folder=currentFolder(),base=baseName(m.point,m.date,act.slug);
  busy=true;lockComposer(true);renderDraft();
  const prepared=[];for(const file of draft)prepared.push(await finalizePhoto(file,m,m.activity));
  // Without photos there is nothing to upload: a single placeholder row carries the record to the parte diario queue.
  const sinFoto=!prepared.length?{gps:await requestFix(),registeredAt:new Date().toISOString()}:null;
  const rows=await locks('visionaria-save',async()=>{const existing=await getAll(),rows=[];if(sinFoto)rows.push({id:randomId(),batch,...m,type:act.type,hecho:act.label,parte:'pending',pilot:config.pilot,folder,base,index:0,name:'',extension:'',blob:null,registeredAt:sinFoto.registeredAt,gps:sinFoto.gps,gpsSource:sinFoto.gps?'form':'',savedAt:new Date().toISOString(),status:'sent',error:'',contentHash:''});for(const file of prepared){const index=nextIndex(base,folder,[...existing,...rows]);rows.push({id:randomId(),batch,...m,type:act.type,hecho:act.label,parte:config.parteQueue?'pending':null,pilot:config.pilot,folder,base,index,name:filename(base,index,file.extension),extension:file.extension,blob:file.blob,registeredAt:file.registeredAt,gps:file.gps??null,gpsSource:file.gpsSource??'',tomadaEn:file.tomadaEn??null,diferida:!!file.diferida,savedAt:new Date().toISOString(),status:'pending',error:'',contentHash:crypto.subtle?await dropbox.contentHash(file.blob):''});}await putMany(rows);return rows;});
  draft=[];await refresh();toast('Guardado en este dispositivo. Enviando a Dropbox…');showView('records');
  busy=false;lockComposer(false);renderDraft();renderRecords();
  if(navigator.onLine)await syncPhotos(rows.map(r=>r.id));
 }catch(error){formError('No se completó el guardado: '+error.message);busy=false;lockComposer(false);renderDraft();}}
function renderRecords(){
  recordURLs.forEach(URL.revokeObjectURL);recordURLs=[];
  $('stat-total').textContent=photos.filter(p=>p.blob).length;$('stat-sent').textContent=photos.filter(p=>p.blob&&p.status==='sent').length;$('stat-pending').textContent=photos.filter(p=>p.status!=='sent').length;
  const groups=new Map();for(const p of [...photos].sort((a,b)=>b.savedAt.localeCompare(a.savedAt))){if(!groups.has(p.batch))groups.set(p.batch,[]);groups.get(p.batch).push(p);}
  let entries=[...groups.values()];if(filter==='sent')entries=entries.filter(g=>g.every(p=>p.status==='sent'));if(filter==='pending')entries=entries.filter(g=>g.some(p=>p.status!=='sent'));
  $('records-list').innerHTML=entries.length?entries.map(group=>{const p=group[0],sent=group.filter(p=>p.status==='sent').length,errors=group.filter(p=>p.error),complete=sent===group.length;return `<article class="record"><div class="record-top"><div><h3>${esc(p.point)} <span style="font-weight:400;color:#a4ae98">/</span> ${esc(p.type==='Protocolo'?`Protocolo fotográfico · ${new Set(group.map(x=>x.slot)).size} toma(s)`:p.activity)}</h3><div class="record-meta">${esc(p.commune)} · ${esc(p.date.split('-').reverse().join('-'))} · ${esc(p.author)}${p.pilot?' · Prueba':''} · ${p.gps?'GPS ±'+esc(p.gps.accuracy)+' m':'Sin GPS'}${p.parte?' · '+(p.parte==='queued'?'Parte diario: en cola':'Parte diario: pendiente'):''}</div></div><span class="status ${complete?'sent':errors.length?'error':''}">${complete?(group.some(x=>x.blob)?'Recibido en Dropbox':'Registro sin foto'):sent?`${sent}/${group.length} enviadas`:'Pendiente de envío'}</span></div>${p.note?`<p class="record-note">${esc(p.note)}</p>`:''}<div class="record-photos">${group.filter(photo=>photo.blob).map(photo=>{const url=URL.createObjectURL(photo.blob);recordURLs.push(url);return `<button type="button" class="record-photo" data-preview="${photo.id}" aria-label="Ver ${esc(photo.name)}"><img src="${url}" alt="Evidencia ${esc(photo.point)}"><span>${photo.slot?esc(photo.slot)+' · ':''}${photo.status==='sent'?'✓ Dropbox':'○ En dispositivo'}</span></button>`}).join('')}</div><div class="record-path">${group.some(x=>x.blob)?esc(p.folder)+'/<br>'+esc(group.filter(x=>x.blob).map(p=>p.name).join(' · ')):'Sin fotografía · solo parte diario'}</div>${errors.length?`<div class="record-error">${esc(errors[0].error)} Tus fotos siguen guardadas en este dispositivo.</div>`:''}${complete&&p.parteError?`<div class="record-error">No se pudo dejar en cola para el parte diario: ${esc(p.parteError)}</div>`:''}<div class="record-actions">${!complete||(p.parte==='pending'&&config.parteQueue)?`<button type="button" class="text-button" data-send="${p.batch}">Enviar a Dropbox</button>`:''}<button type="button" class="text-button" data-download="${p.batch}">Descargar fotos y ficha</button><button type="button" class="text-button" data-delete="${p.batch}">Eliminar copia local</button></div></article>`}).join(''):'<div class="empty-records"><svg><use href="#i-grid"/></svg><h3>Aquí comienza tu registro.</h3><p>Las fotografías que guardes aparecerán aquí.</p></div>';
  $('sync-all').disabled=busy||!photos.some(p=>p.status!=='sent'||(p.parte==='pending'&&config.parteQueue));$('export-all').disabled=busy||!photos.length;
}
// One JSON per saved record, dropped in the Dropbox queue once every photo of it is confirmed there.
// The office PC (tools/parte-diario/escribir_parte.py) turns each one into a «Parte diario» row.
// The camera's local time of a moment, as the phone shows it in Chile (YYYY-MM-DDTHH:MM:SS), like a photo's EXIF date.
function horaLocal(iso){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)),g=t=>p.find(x=>x.type===t).value;return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;}
function parteRecord(group){
  const p=group[0],fixes=group.filter(x=>x.gps).sort((a,b)=>(a.gps.accuracy??50)-(b.gps.accuracy??50)),best=fixes.find(x=>x.gpsSource!=='gallery')??fixes[0];
  const tomas=group.filter(x=>x.blob&&x.tomadaEn).map(x=>x.tomadaEn).sort();
  return {version:1,id:p.batch,comuna:p.commune,punto:p.point,fecha:p.date,hecho:p.hecho,tipo:ACTIVITIES.find(a=>a.label===p.hecho)?.type??'',ejecuto:p.executor||'',observacion:p.note||'',registro:p.author,
    gps:best?{lat:best.gps.lat,lon:best.gps.lon,accuracy:best.gps.accuracy}:null,gpsOrigen:best?.gpsSource??'',
    fotos:group.filter(x=>x.blob).map(x=>({nombre:x.name,ruta:x.dropboxPath??x.folder+'/'+x.name,toma:x.slot??null,tomadaEn:x.tomadaEn??null,diferida:!!x.diferida})),piloto:!!p.pilot,guardado:p.savedAt,app:'evidencias',
    // When the first photo was shot (camera local time) and whether any photo was loaded later from the gallery.
    tomadaEn:tomas[0]??null,cargaDiferida:group.some(x=>x.diferida)};
}
async function queueParte(){
  if(!config.parteQueue)return 0;
  const all=await getAll(),batches=new Set(all.filter(p=>p.parte==='pending').map(p=>p.batch));let queued=0;
  for(const batch of batches){
    const group=all.filter(p=>p.batch===batch);if(group.some(p=>p.status!=='sent'))continue;
    const p=group[0],path=`${config.parteQueue}/${p.pilot?'_PILOTO/':''}${p.commune}/${p.point}_${p.date}_${batch}.json`;
    try{
      // A conflict means an earlier attempt already left this exact file in the queue.
      try{await dropbox.api('files/upload',null,{binary:new Blob([JSON.stringify(parteRecord(group),null,1)],{type:'application/json'}),args:{path,mode:'add',autorename:false,strict_conflict:true}});}
      catch(error){if(!(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('conflict')))throw error;}
      for(const x of group){x.parte='queued';x.parteError='';x.partePath=path;x.parteAt=new Date().toISOString();}queued++;
    }catch(error){for(const x of group)x.parteError=error.message;}
    await putMany(group);
  }
  return queued;
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
      const queued=await queueParte();
      toast(failed?`${sent} foto(s) recibidas en Dropbox. Hay ${failed} pendiente(s) con error.`:sent?`${sent} foto(s) recibidas y confirmadas en Dropbox.${queued?' Registro en cola para el parte diario.':''}`:queued?'Registro en cola para el parte diario.':'No hay fotografías pendientes para enviar.');
    }finally{busy=false;await refresh();renderConnection();}
  });
}
function download(blob,name){const a=$('download-link');if(a.href.startsWith('blob:'))URL.revokeObjectURL(a.href);a.href=URL.createObjectURL(blob);a.download=name;$('export-dialog').showModal();}
async function exportPhotos(batch=null){if(busy)return;const selected=photos.filter(p=>!batch||p.batch===batch);if(!selected.length)return;try{busy=true;renderRecords();toast('Preparando respaldo con nombres automáticos…');const rows=[['ID evidencia','ID captura','Comuna','Punto','Fecha del hecho','Actividad','Tipo','Autor declarado','Detalle','Nombre de foto','Ruta prevista','Estado Dropbox','Ruta confirmada','Fecha de registro en app','Recibido en Dropbox','Piloto','Latitud','Longitud','Precisión GPS (m)','Origen ubicación','Ejecutó','Parte diario'],...selected.map(p=>[p.id,p.batch,p.commune,p.point,p.date,p.activity,p.type,p.author,p.note,p.name,p.folder+'/'+p.name,p.status,p.dropboxPath??'',p.registeredAt,p.sentAt??'',p.pilot?'Sí':'No',p.gps?.lat??'',p.gps?.lon??'',p.gps?.accuracy??'',p.gps?(p.gpsSource==='gallery'?'Galería (ubicación al registrar)':'Cámara (al capturar)'):'Sin GPS',p.executor??'',p.parte==='queued'?'En cola':p.parte==='pending'?'Pendiente':''])];const files=selected.filter(p=>p.blob).map(p=>({name:p.folder.replace(/^\//,'')+'/'+p.name,blob:p.blob}));files.push({name:'registro_evidencias.csv',blob:new Blob([csv(rows)],{type:'text/csv;charset=utf-8'})});const blob=await makeZip(files);download(blob,`Visionaria_Evidencias_${chileDate()}${batch?'_'+selected[0].point:''}.zip`);toast('Respaldo preparado. Presiona Descargar archivo ZIP.');}catch(error){toast('No se pudo preparar el respaldo: '+error.message)}finally{busy=false;renderRecords();renderDraft();}}
function openSettings(){if(busy){toast('Espera a que termine la operación.');return;}$('setting-root').value=config.root;$('setting-pilot').checked=config.pilot;$('settings-result').textContent='';$('slug-settings').innerHTML=ACTIVITIES.map(a=>`<label>${esc(a.label)}<input value="${esc(a.slug)}" disabled></label>`).join('');$('settings-dialog').showModal();}
function openPhoto(blob,caption){if(largeURL)URL.revokeObjectURL(largeURL);largeURL=URL.createObjectURL(blob);$('large-photo').src=largeURL;$('large-caption').textContent=caption;$('photo-dialog').showModal();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-settings]').forEach(b=>b.addEventListener('click',openSettings));
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
// Dictado por voz: el reconocimiento de Chrome (el de Google) escribe en «Observación» lo que se dice. En Android el modo continuo devuelve
// cada frase repetida y acumulada, así que se escucha frase a frase: cuando Chrome corta (una pausa, o unos 10 s), se vuelve a escuchar solo
// hasta que el técnico toca el botón o se cumplen 30 s. El texto de cada frase se rearma completo en cada resultado; el botón muestra los segundos.
function setupDictation(){const Rec=window.SpeechRecognition||window.webkitSpeechRecognition,btn=$('dictate'),note=$('note');if(!Rec)return;btn.hidden=false;
  const LIMITE=30;let rec=null,activo=false,base='',dicho='',reloj=null,quedan=0,error='';
  const junta=(antes,frase)=>{if(!frase)return antes;frase=antes?frase:frase.charAt(0).toUpperCase()+frase.slice(1);return((antes?antes+' ':'')+frase).slice(0,note.maxLength);};
  const terminar=aviso=>{activo=false;clearInterval(reloj);btn.classList.remove('listening');btn.setAttribute('aria-pressed','false');btn.removeAttribute('data-left');note.dispatchEvent(new Event('input',{bubbles:true}));if(aviso)toast(aviso);};
  const escuchar=()=>{rec=new Rec();rec.lang='es-CL';rec.interimResults=true;rec.continuous=false;dicho='';
    rec.onresult=e=>{dicho=Array.from(e.results,r=>r[0].transcript.replace(/\s+/g,' ').trim()).reduce((acc,t)=>!acc||t.toLowerCase().startsWith(acc.toLowerCase())?t:acc.toLowerCase().startsWith(t.toLowerCase())?acc:acc+' '+t,'');note.value=junta(base,dicho);};
    rec.onerror=e=>{error=e.error;};
    rec.onend=()=>{base=junta(base,dicho);note.value=base;rec=null;if(!activo)return;
      if(error&&error!=='no-speech'&&error!=='aborted')return terminar(error==='not-allowed'||error==='service-not-allowed'?'Permite el micrófono para dictar.':error==='network'?'El dictado necesita conexión a internet.':'No se pudo dictar: '+error);
      if(quedan<=0)return terminar('El dictado se detuvo a los '+LIMITE+' segundos. Toca el micrófono para seguir.');
      error='';try{escuchar();}catch(e){terminar('No se pudo seguir dictando: '+e.message);}};
    rec.start();};
  btn.addEventListener('click',()=>{if(activo){terminar();if(rec)rec.stop();return;}
    base=note.value.trim();error='';quedan=LIMITE;activo=true;btn.dataset.left=quedan;btn.classList.add('listening');btn.setAttribute('aria-pressed','true');
    reloj=setInterval(()=>{quedan--;btn.dataset.left=Math.max(quedan,0);if(quedan<=0){clearInterval(reloj);if(rec)rec.stop();}},1000);
    try{escuchar();}catch(e){terminar('No se pudo iniciar el dictado: '+e.message);}});}
setupDictation();
$('commune').addEventListener('change',()=>{$('point-search').value='';$('point').value='';loadPoints();});$('point-search').addEventListener('input',loadPoints);
for(const id of ['point','date','activity'])$(id).addEventListener('change',renderContext);
$('take-photo').addEventListener('click',()=>{try{validateCapture(meta(),points);formError('');pendingFix=requestFix();$('camera-input').click();}catch(e){formError(e.message)}});
$('add-files').addEventListener('click',()=>{try{validateCapture(meta(),points);formError('');pendingFix=requestFix();$('gallery-input').click();}catch(e){formError(e.message)}});
for(const id of ['camera-input','gallery-input'])$(id).addEventListener('change',async e=>{await addFiles(e.target.files,id==='camera-input'?'camera':'gallery');e.target.value='';});
$('discard').addEventListener('click',()=>{if(confirm('¿Descartar las fotografías seleccionadas? Todavía no están guardadas.')){draft=[];renderDraft();}});
$('photo-previews').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){draft.splice(Number(b.dataset.remove),1);renderDraft();return;}const img=e.target.closest('[data-draft-preview]');if(img){const item=draft[Number(img.dataset.draftPreview)];openPhoto(item.blob,'Fotografía seleccionada · pendiente de guardar');}});
$('capture-form').addEventListener('submit',saveCapture);
$('records-list').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.preview){const p=photos.find(p=>p.id===b.dataset.preview);if(p?.blob)openPhoto(p.blob,p.name);}if(b.dataset.send)await syncPhotos(photos.filter(p=>p.batch===b.dataset.send).map(p=>p.id));if(b.dataset.download)await exportPhotos(b.dataset.download);if(b.dataset.delete){if(busy){toast('Espera a que termine el envío.');return;}const selected=photos.filter(p=>p.batch===b.dataset.delete),unsent=selected.some(p=>p.status!=='sent');if(confirm(unsent?'Estas fotos aún no tienen recepción confirmada en Dropbox. ¿Eliminar definitivamente la copia de este dispositivo? Descarga un respaldo primero.':'¿Eliminar las copias locales de este registro? Los archivos de Dropbox se conservan.')){await removeMany(selected.map(p=>p.id));await refresh();toast('Copia local eliminada.');}}});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderRecords();}));
$('sync-all').addEventListener('click',()=>syncPhotos());$('export-all').addEventListener('click',()=>exportPhotos());
$('settings-form').addEventListener('submit',e=>e.preventDefault());
$('executor').addEventListener('change',()=>{try{localStorage.setItem(KEY,JSON.stringify({executor:$('executor').value}))}catch{}});
$('verify-folder').addEventListener('click',async()=>{try{$('settings-result').textContent='Verificando…';const folder=currentFolder();await dropbox.verifyFolder(folder);$('settings-result').textContent='Carpeta encontrada: '+folder+'. Los permisos de escritura se comprobarán al enviar.';}catch(error){$('settings-result').textContent='No se pudo verificar: '+error.message;}});
$('connection').addEventListener('click',openSettings);
document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',()=>setMode(r.value)));
$('proto-antenna').addEventListener('change',renderProtocol);
$('proto-slots').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;
  if(b.dataset.protoRemove){const [code,i]=b.dataset.protoRemove.split('|');protoDraft[code].splice(Number(i),1);renderProtocol();return;}
  const code=b.dataset.protoCamera||b.dataset.protoGallery;if(!code)return;
  try{validateProtocol(meta());formError('');}catch(err){formError(err.message);return;}
  protoSlot=code;pendingFix=requestFix();$(b.dataset.protoCamera?'proto-camera-input':'proto-gallery-input').click();});
for(const id of ['proto-camera-input','proto-gallery-input'])$(id).addEventListener('change',async e=>{
  const items=await collectFiles(e.target.files,id==='proto-camera-input'?'camera':'gallery');e.target.value='';
  if(!protoSlot||!items.length)return;
  if(protoTotal()+items.length>20){formError('Puedes guardar hasta 20 fotografías por registro. Guarda este grupo antes de continuar.');return;}
  (protoDraft[protoSlot]??=[]).push(...items);renderProtocol();});
// What is still only on this phone: evidence photos not in Dropbox or records not yet queued, plus levantamiento points.
function pendientesEvidencia(){return new Set(photos.filter(p=>p.status!=='sent'||(p.parte&&p.parte!=='queued')).map(p=>p.batch)).size;}
function totalPendientes(){return pendientesEvidencia()+contarPendientes();}
function pendienteDesde(){let min=masAntiguoPendiente();for(const p of photos)if((p.status!=='sent'||(p.parte&&p.parte!=='queued'))&&p.savedAt&&(!min||p.savedAt<min))min=p.savedAt;return min;}
const DIA=24*60*60*1000;
function avisoPendientes(){const desde=pendienteDesde(),viejo=!!desde&&Date.now()-Date.parse(desde)>DIA;$('aviso-pendientes').hidden=!viejo;
  if(viejo)$('aviso-pendientes').textContent=`Hay registros guardados en este teléfono hace más de 24 horas que aún no llegan a la oficina (desde ${new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(desde))}). Busca señal y abre la app para que se envíen; si alguno da error, revísalo en «Mis registros» o en Levantamiento.`;}
// Heartbeat: tells the office how many records this phone still holds and since when, so nothing waits unnoticed.
// Only counts and dates travel, never the records. At most every 10 minutes unless the count changed.
const DISPOSITIVO=(()=>{try{let id=localStorage.getItem('visionaria-dispositivo');if(!id){id=randomId();localStorage.setItem('visionaria-dispositivo',id);}return id;}catch{return 'sin-almacenamiento';}})();
let ultimoLatido={at:0,huella:''};
async function latido(){
  if(!navigator.onLine||!configLista)return;
  const cuerpo={dispositivo:DISPOSITIVO,etiqueta:(navigator.userAgentData?.platform||navigator.platform||'').slice(0,40),evidencias:pendientesEvidencia(),levantamiento:contarPendientes(),masAntiguo:pendienteDesde()};
  const huella=JSON.stringify([cuerpo.evidencias,cuerpo.levantamiento,cuerpo.masAntiguo]);
  if(huella===ultimoLatido.huella&&Date.now()-ultimoLatido.at<10*60*1000)return;
  try{const r=await fetch('/api/evidencias/latido',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(cuerpo)});if(r.ok)ultimoLatido={at:Date.now(),huella};}catch{}
}
function network(){const online=navigator.onLine,n=totalPendientes();$('network').innerHTML=`<span class="dot ${online?'':'amber'}"></span>${online?'Con señal':'Sin conexión'}${n?` · <strong class="pendientes">${n} pendiente${n===1?'':'s'}</strong>`:''}`;$('network').title=n?'Registros guardados en este teléfono que aún no llegan a la oficina':'';avisoPendientes();estadoDatos();}
// Sends what is pending on its own when the signal comes back, when the app opens or returns, and every 5 minutes while
// something is pending: the same as «Enviar pendientes», so nobody has to remember.
let autoEnviando=false;
async function autoEnviar(motivo){
  if(autoEnviando||busy||!navigator.onLine||!configLista||!totalPendientes()){latido();return;}
  autoEnviando=true;
  try{
    const antes=totalPendientes();
    if(pendientesEvidencia())await syncPhotos();
    const lev=await enviarTodoPendiente();
    const quedan=totalPendientes(),enviados=antes-quedan;
    if(motivo!=='silencioso'&&enviados>0)toast(`${motivo==='online'?'Volvió la conexión: s':'S'}e enviaron ${enviados} registro${enviados===1?'':'s'} pendiente${enviados===1?'':'s'} a la oficina.${quedan?` Quedan ${quedan} con error: revísalos en «Mis registros» o en Levantamiento.`:''}`);
  }catch{}finally{autoEnviando=false;network();latido();}
}
let configLista=false;
// How current the office data on this phone is. The office writes its summary every few minutes, so a summary much older
// than the moment the phone fetched it means the office stopped, not the phone.
const OFICINA_ATRASADA=30*60*1000,DATOS_VIEJOS=12*60*60*1000,PREPARADO='visionaria-preparado';
function cuando(iso){const d=new Date(iso),f=x=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago'}).format(x),hoy=f(new Date()),ayer=f(new Date(Date.now()-864e5)),dia=f(d);
  const hora=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
  return `${dia===hoy?'hoy':dia===ayer?'ayer':dia.slice(8,10)+'-'+dia.slice(5,7)} ${hora}`;}
function situacionDatos(){const {generado,descargado}=estadoOficina();
  if(!config.levantamientoQueue)return {aviso:false,texto:''};
  if(!generado||!descargado)return {aviso:true,texto:'Este teléfono aún no tiene los datos de la oficina: ábrelo con señal o toca «Preparar».'};
  if(Date.now()-Date.parse(descargado)>DATOS_VIEJOS)return {aviso:true,texto:`Datos de la oficina de ${cuando(generado)}: busca señal o toca «Preparar» antes de salir.`};
  if(Date.parse(descargado)-Date.parse(generado)>OFICINA_ATRASADA)return {aviso:true,atrasada:true,texto:`La oficina no actualiza desde ${cuando(generado)}. Puedes seguir trabajando: lo que envíes queda en Dropbox y se procesa cuando vuelva.`};
  return {aviso:false,texto:`Datos de la oficina: ${cuando(generado)}`};}
function estadoDatos(){const s=situacionDatos();let prep='';try{const p=localStorage.getItem(PREPARADO);if(p)prep=` · preparado ${cuando(p)}`;}catch{}
  $('estado-datos').classList.toggle('aviso',s.aviso);$('estado-datos-texto').textContent=s.texto+(s.aviso?'':prep);}
function guardarApp(){
  const sw=navigator.serviceWorker?.controller;if(!sw)return Promise.resolve({ok:false});
  return new Promise(resolve=>{const canal=new MessageChannel(),tope=setTimeout(()=>resolve({ok:false}),60000);
    canal.port1.onmessage=e=>{clearTimeout(tope);resolve(e.data);};sw.postMessage({tipo:'preparar'},[canal.port2]);});}
// «Preparar para trabajar sin señal»: everything a phone needs before leaving coverage, checked in one go.
let preparando=false;
async function preparar(){
  if(preparando)return;if(!navigator.onLine){toast('Necesitas señal para preparar el teléfono. Hazlo antes de salir a terreno.');return;}
  preparando=true;$('preparar').disabled=true;$('preparar').textContent='Preparando…';
  const res=[],paso=(clase,texto)=>res.push({clase,texto});
  try{
    const sesion=await fetch('/api/evidencias/config',{cache:'no-store'}).then(r=>r.ok).catch(()=>false);
    paso(sesion?'ok':'error',sesion?'Sesión de la Intranet vigente.':'Tu sesión venció: vuelve a iniciar sesión en la Intranet antes de salir.');
    const app=await guardarApp();
    paso(app.ok?'ok':'error',app.ok?'App, catálogo y formularios guardados en el teléfono.':'No se pudo guardar la app para usarla sin señal: recarga la página e inténtalo de nuevo.');
    if(config.levantamientoQueue){const ok=await actualizarOficina(),s=situacionDatos();
      paso(!ok?'error':s.atrasada?'aviso':'ok',!ok?'No se pudieron descargar los datos de la oficina.':s.atrasada?s.texto:`Datos de la oficina al día (${cuando(estadoOficina().generado)}).`);}
    await autoEnviar('silencioso');const n=totalPendientes();
    paso(n?'aviso':'ok',n?`${n} registro${n===1?'':'s'} no se pudo enviar: revísalo en «Mis registros» o en Levantamiento.`:'Nada pendiente por enviar.');
    const persistente=navigator.storage?.persist?await navigator.storage.persist().catch(()=>false):false;
    let libre=null;try{const e=await navigator.storage.estimate();libre=(e.quota-e.usage)/1048576;}catch{}
    if(libre!==null&&libre<300)paso('aviso',`Queda poco espacio para fotos (${Math.round(libre)} MB): libera espacio en el teléfono.`);
    else paso(persistente?'ok':'aviso',persistente?'El teléfono conservará lo guardado aunque falte espacio.':'El navegador podría borrar datos si falta espacio: agrega la app a la pantalla de inicio.');
    const permiso=await navigator.permissions?.query({name:'geolocation'}).then(p=>p.state).catch(()=>null);
    const gps=permiso==='denied'?null:await requestFix();
    paso(gps?'ok':'error',gps?`GPS activo (precisión ${gps.accuracy} m).`:permiso==='denied'?'La ubicación está bloqueada: actívala en los ajustes del navegador para este sitio.':'No se obtuvo ubicación GPS: revisa que esté activada.');
    if(!res.some(r=>r.clase==='error')){try{localStorage.setItem(PREPARADO,new Date().toISOString());}catch{}}
  }finally{
    preparando=false;$('preparar').disabled=false;$('preparar').textContent='Preparar para trabajar sin señal';
    $('preparar-resultado').innerHTML=res.map(r=>`<li class="${r.clase}">${esc(r.texto)}</li>`).join('');$('preparar-resultado').hidden=!res.length;
    toast(res.some(r=>r.clase==='error')?'Falta algo antes de trabajar sin señal: revisa la lista.':'Listo para trabajar sin señal.');network();
  }
}
$('preparar').addEventListener('click',preparar);
setInterval(()=>{estadoDatos();if(navigator.onLine&&!document.hidden)actualizarOficina();},5*60*1000);
window.addEventListener('online',()=>{network();autoEnviar('online');actualizarOficina();});window.addEventListener('offline',network);
setInterval(()=>autoEnviar('periodico'),5*60*1000);
window.addEventListener('beforeunload',e=>{if(draft.length||protoTotal()||busy){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy){refresh().catch(()=>{});renderConnection();setTimeout(()=>autoEnviar('vuelta'),1500);}});
async function init(){
  $('date').value=chileDate();$('date').max=chileDate();
  $('today-label').textContent=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  $('executor').innerHTML='<option value="">Selecciona quién ejecutó</option>'+EXECUTORS.map(x=>`<option>${esc(x)}</option>`).join('');if(EXECUTORS.includes(lastExecutor))$('executor').value=lastExecutor;
  $('activity').innerHTML='<option value="">Selecciona una actividad</option>'+['Etapa','Novedad'].map(type=>`<optgroup label="${type==='Etapa'?'Etapas de obra':'Novedades'}">${ACTIVITIES.filter(a=>a.type===type).map(a=>`<option>${esc(a.label)}</option>`).join('')}</optgroup>`).join('');
  network();
  try{const response=await fetch('/api/evidencias/config');if(!response.ok)throw new Error('No se pudo verificar tu sesión.');const cfg=await response.json();dropbox.configurarAlias(cfg.alias);config={...config,root:cfg.root,pilot:cfg.pilot,email:cfg.email,parteQueue:cfg.parteQueue??null,levantamientoQueue:cfg.levantamientoQueue??null,verPorUbicar:!!cfg.verPorUbicar,verTodo:!!cfg.verTodo};if(config.parteQueue)$('storage-note').textContent='Los registros locales pertenecen a este navegador. No borres sus datos antes de enviarlos. Cada registro recibido en Dropbox queda en cola para el parte diario de la planilla, y el proceso de la oficina lo escribe en su siguiente pasada.';$('author').value=cfg.email;$('author').disabled=true;}catch(error){formError('No se pudo verificar tu acceso: '+error.message+' Vuelve a iniciar sesión en la Intranet.');$('take-photo').disabled=true;$('add-files').disabled=true;}
  renderConnection();
  try{const response=await fetch('/api/evidencias/assets/catalogue.json');if(!response.ok)throw new Error('No se pudo cargar el catálogo.');points=await response.json();loadPoints();await database();storageReady=true;await refresh();if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}catch(error){formError('No se pudo preparar el almacenamiento o el catálogo. '+error.message);$('take-photo').disabled=true;$('add-files').disabled=true;}
  await setupLevantamiento({toast,config:()=>config,alCambiar:network}).catch(error=>toast('No se pudo preparar el levantamiento: '+error.message));
  configLista=!!(config.parteQueue||config.levantamientoQueue);network();setTimeout(()=>autoEnviar('inicio'),2000);
  if('serviceWorker'in navigator)navigator.serviceWorker.register('/api/evidencias/assets/sw.js').catch(()=>{});
}
init();
