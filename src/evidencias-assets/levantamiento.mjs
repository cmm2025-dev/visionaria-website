// Levantamiento en terreno (formulario DEC-020). The yellow columns S..BU of the form are the data contract
// (levantamiento.json, generated from the form itself): this screen asks for exactly those fields, saves every change
// on the device so nothing is lost without signal, and sends one JSON per point to the queue the office service reads.
import {chileDate,csv,randomId} from './core.mjs';
import * as dropbox from './dropbox-client.mjs';
import {gpsLabel,processImage,withExif,requestFix} from './media.mjs';

const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='visionaria-levantamiento-v1',PREFS='visionaria-levantamiento-prefs';
const FECHA_BASE=Date.UTC(1899,11,30);
let C=null,ctx=null,puntos=new Map(),fotos=[],abierto=null,filtro={quien:'',dia:'',texto:''},busy=false,urls=[],guardarTimer=null;
let prefs={};try{prefs=JSON.parse(localStorage.getItem(PREFS)||'{}')}catch{}
const savePrefs=()=>{try{localStorage.setItem(PREFS,JSON.stringify(prefs))}catch{}};

// --- Storage: its own database, so a levantamiento never mixes with the evidence records ---------------------------
let dbp;
function database(){return dbp??=new Promise((resolve,reject)=>{const r=indexedDB.open(KEY,1);r.onupgradeneeded=()=>{r.result.createObjectStore('puntos',{keyPath:'codigo'});r.result.createObjectStore('fotos',{keyPath:'id'}).createIndex('codigo','codigo');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function all(store){const d=await database();return new Promise((resolve,reject)=>{const q=d.transaction(store).objectStore(store).getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function put(store,rows){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');rows.forEach(r=>tx.objectStore(store).put(r));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('No se pudo guardar.'));});}
async function del(store,ids){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');ids.forEach(id=>tx.objectStore(store).delete(id));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}

// --- The form's own rules: LPR angles and «Control», same formulas as columns BP, BQ and BV ------------------------
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;};
const vacio=v=>v===undefined||v===null||String(v).trim()==='';
export function angulos(v){const bm=num(v.BM),bn=num(v.BN),bo=num(v.BO);const deg=x=>Math.round(Math.atan(x)*180/Math.PI);
  return {BP:bm!==null&&bn?deg((bm-0.6)/bn):null,BQ:bo!==null&&bn?deg(bo/bn):null};}
function valoresCompletos(codigo){const p=puntos.get(codigo),v={...(p?.valores||{})};v.BS=String(fotos.filter(f=>f.codigo===codigo).length||'');return v;}
const control=(punto,v)=>controlFormulario(C,punto,v);
// Pure version of the form's «Control» (column BV), exported so it can be checked against the planilla itself.
export function controlFormulario(C,punto,v){
  const a=angulos(v),cols=C.campos.map(c=>c.col);
  if(cols.every(c=>vacio(v[c])||(c==='BS'&&v[c]==='0')))return 'Sin levantar';
  if(C.campos.some(c=>c.required&&vacio(v[c.col])))return 'Faltan datos';
  if(punto.lpr&&C.campos.some(c=>c.requiredLpr&&vacio(v[c.col])))return 'Faltan datos LPR';
  if(punto.enlace&&vacio(v.AX))return 'Faltan datos del enlace';
  if(v.AQ==='Sí'&&(vacio(v.AR)||num(v.AR)<6))return 'Cruce: altura bajo 6,0 m';
  if((a.BP??0)>30||(a.BQ??0)>30)return 'LPR: ángulo sobre 30°';
  if(v.AG==='Sí'&&v.AH!=='Vialidad'&&v.AH!=='Concesionaria')return 'Revisar organismo';
  if((num(v.BS)??0)<3)return 'Faltan fotos (mínimo 3)';
  return 'OK';
}
const visible=(campo,punto)=>!campo.when||(campo.when==='lpr'?punto.lpr:punto.enlace);
const tomasDe=punto=>C.fotos.filter(t=>!t.when||(t.when==='lpr'?punto.lpr:punto.enlace));
const minFecha=()=>new Date(FECHA_BASE+Number(C.fechaMinima)*86400000).toISOString().slice(0,10);

// What the queue receives: values typed as the contract says, only the visible fields, BS from the photo count.
function envioValores(punto,v){const out={};for(const c of C.campos){if(!visible(c,punto))continue;const x=v[c.col];if(vacio(x))continue;
  if(c.type==='decimal'){const n=num(x);if(n!==null)out[c.col]=n;}else if(c.type==='whole'){const n=num(x);if(n!==null)out[c.col]=Math.round(n);}else out[c.col]=String(x).trim();}
  return out;}
const huella=o=>JSON.stringify(o,Object.keys(o).sort());
function estadoEnvio(codigo){const p=puntos.get(codigo),fs=fotos.filter(f=>f.codigo===codigo);
  if(!p||(!Object.keys(p.valores||{}).length&&!fs.length))return {texto:'Sin datos',clase:''};
  if(p.error)return {texto:'Error al enviar',clase:'error'};
  const punto=C.puntos.find(x=>x.A===codigo),actual=huella({v:envioValores(punto,valoresCompletos(codigo)),f:fs.map(f=>f.id).sort()});
  if(p.sent&&p.sent.huella===actual&&fs.every(f=>f.status==='sent'))return {texto:'Enviado '+new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(p.sent.at)),clase:'sent'};
  return {texto:p.sent?'Cambios sin enviar':'Guardado en el teléfono',clase:'pending'};
}

// --- Rendering ------------------------------------------------------------------------------------------------------
const chipClase=t=>t==='OK'?'sent':t==='Sin levantar'?'':'error';
function renderLista(){
  const lista=C.puntos.filter(p=>(!filtro.quien||p.F.includes(filtro.quien))&&(!filtro.dia||p.E===filtro.dia)&&(!filtro.texto||(p.A+' '+p.G+' '+p.B).toLowerCase().includes(filtro.texto.toLowerCase())));
  const estados=C.puntos.map(p=>control(p,valoresCompletos(p.A)));
  $('lev-resumen').textContent=`${estados.filter(e=>e==='OK').length} OK · ${estados.filter(e=>e!=='OK'&&e!=='Sin levantar').length} en curso · ${estados.filter(e=>e==='Sin levantar').length} sin levantar · ${C.puntos.length} puntos`;
  $('lev-lista').innerHTML=lista.length?lista.map(p=>{const c=control(p,valoresCompletos(p.A)),e=estadoEnvio(p.A);
    return `<button type="button" class="lev-item" data-lev-abrir="${esc(p.A)}"><div><strong>${esc(p.A)}</strong>${p.lpr?' <span class="lev-tag">LPR</span>':''}${p.sinSolucion?' <span class="lev-tag">Sin solución</span>':''}<div class="record-meta">${esc(p.B)} · ${esc(p.G)} · ${esc(p.F)}</div></div><div class="lev-estados"><span class="status ${chipClase(c)}">${esc(c)}</span><span class="lev-envio ${e.clase}">${esc(e.texto)}</span></div></button>`;}).join(''):'<p class="muted">Ningún punto coincide con el filtro.</p>';
}
function campoHTML(c,v,punto){
  const val=v[c.col]??'',id='lev-'+c.col,req=c.required||(c.requiredLpr&&punto.lpr)||(c.col==='AX'&&punto.enlace);
  const label=`<span class="lev-col">${esc(c.col)}</span> ${esc(c.label)}${req?' <span class="lev-req">*</span>':''}${c.col==='BA'&&punto.sinSolucion?' <span class="lev-tag">Anotar cada operador</span>':''}`;
  let input;
  if(c.col==='BS')input=`<input id="${id}" value="${esc(v.BS)}" readonly>`;
  else if(c.type==='list')input=`<select id="${id}" data-lev-campo="${c.col}"><option value=""></option>${c.options.map(o=>`<option${o===val?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(c.type==='date')input=`<input id="${id}" type="date" min="${minFecha()}" max="${chileDate()}" value="${esc(val)}" data-lev-campo="${c.col}">`;
  else if(c.type==='decimal'||c.type==='whole')input=`<input id="${id}" type="text" inputmode="${c.type==='whole'?'numeric':'decimal'}" value="${esc(val)}" data-lev-campo="${c.col}" autocomplete="off">`;
  else input=`<textarea id="${id}" rows="2" maxlength="2000" data-lev-campo="${c.col}">${esc(val)}</textarea>`;
  return `<label class="lev-campo${req&&vacio(c.col==='BS'?v.BS:val)?' lev-falta':''}">${label}${c.hint?`<span class="field-hint">${esc(c.hint)}</span>`:''}${input}</label>`;
}
function renderFicha(){
  urls.forEach(URL.revokeObjectURL);urls=[];
  const punto=C.puntos.find(p=>p.A===abierto),v=valoresCompletos(abierto),a=angulos(v),c=control(punto,v),e=estadoEnvio(abierto),p=puntos.get(abierto);
  const grupos=[...new Set(C.campos.map(x=>x.group))];
  $('lev-ficha').innerHTML=`
    <div class="lev-ficha-top"><button type="button" class="text-button" data-lev-volver>← Todos los puntos</button><span id="lev-control" class="status ${chipClase(c)}">${esc(c)}</span></div>
    <h2>${esc(punto.A)} · ${esc(punto.D)}</h2>
    <dl class="lev-pre">${C.precargadas.filter(x=>!['A','H','I','J'].includes(x.col)&&punto[x.col]&&punto[x.col]!=='—').map(x=>`<div><dt>${esc(x.label)}</dt><dd>${esc(punto[x.col])}</dd></div>`).join('')}
      <div><dt>Coordenada KMZ</dt><dd>${esc(punto.H)}, ${esc(punto.I)}${punto.J?` · <a href="${esc(punto.J)}" target="_blank" rel="noopener noreferrer">Abrir mapa</a>`:''}</dd></div></dl>
    <div class="lev-gps"><button type="button" class="btn btn-camera" data-lev-gps><svg><use href="#i-pin"/></svg>Tomar coordenada aquí</button><span class="field-hint">${p?.gps?esc(gpsLabel(p.gps,'camera')):'De pie en el lugar propuesto para el poste.'}</span></div>
    ${grupos.map(g=>{const cs=C.campos.filter(x=>x.group===g&&visible(x,punto));if(!cs.length)return '';
      return `<fieldset class="lev-grupo"><legend>${esc(g)}</legend>${cs.map(x=>campoHTML(x,v,punto)).join('')}${g==='Pórtico LPR'?`<p class="lev-angulos" id="lev-angulos">Ángulo vertical (BP): <strong>${a.BP??'—'}°</strong> · Ángulo horizontal (BQ): <strong>${a.BQ??'—'}°</strong>${(a.BP??0)>30||(a.BQ??0)>30?' · <span class="lev-req">sobre 30°</span>':''}</p>`:''}</fieldset>`;}).join('')}
    <fieldset class="lev-grupo"><legend>Fotos guiadas</legend><p class="field-hint">Mínimo 3. Cada foto queda estampada con el punto, la toma, la fecha y el GPS.</p>
      ${tomasDe(punto).map(t=>{const fs=fotos.filter(f=>f.codigo===abierto&&f.toma===t.code);return `<div class="proto-slot${fs.length?' done':''}"><div class="proto-head"><div><strong>${esc(t.code)} · ${esc(t.label)}${t.required?' <span class="lev-req">*</span>':''}${fs.length?` · ${fs.length}`:''}</strong><span class="field-hint">${esc(t.hint)}</span></div><div class="proto-actions"><button type="button" class="btn btn-camera" data-lev-foto="${esc(t.code)}|camera"><svg><use href="#i-camera"/></svg>Cámara</button><button type="button" class="btn btn-secondary" data-lev-foto="${esc(t.code)}|gallery"><svg><use href="#i-plus"/></svg>Galería</button></div></div>${fs.length?`<div class="proto-thumbs">${fs.map(f=>{const u=URL.createObjectURL(f.blob);urls.push(u);return `<div class="photo-tile"><img src="${u}" alt="${esc(t.code)}"><code>${f.status==='sent'?'✓ Dropbox':'○ En el teléfono'}</code>${f.status==='sent'?'':`<button type="button" class="remove-photo" data-lev-quitar="${esc(f.id)}" aria-label="Quitar fotografía">×</button>`}</div>`}).join('')}</div>`:''}</div>`;}).join('')}
    </fieldset>
    <div class="lev-acciones"><span id="lev-envio-estado" class="lev-envio ${e.clase}">${esc(e.texto)}${p?.error?' · '+esc(p.error):''}</span><button type="button" class="btn btn-primary" data-lev-enviar ${busy?'disabled':''}>Enviar a Dropbox</button></div>`;
}
function render(){if(!C)return;$('lev-lista-wrap').hidden=!!abierto;$('lev-ficha').hidden=!abierto;if(abierto)renderFicha();else renderLista();}

// --- Editing --------------------------------------------------------------------------------------------------------
async function guardarCampo(col,valor){
  const p=puntos.get(abierto)??{codigo:abierto,valores:{},gps:null,sent:null,error:''};
  if(vacio(valor))delete p.valores[col];else p.valores[col]=valor;
  // The first thing typed stamps the day and who surveyed it; both stay editable.
  let auto=false;
  if(!p.valores.S&&chileDate()>=minFecha()){p.valores.S=chileDate();auto=true;}
  if(!p.valores.T&&prefs.levanto){p.valores.T=prefs.levanto;auto=true;}
  if(col==='T'&&valor){prefs.levanto=valor;savePrefs();}
  p.error='';p.updatedAt=new Date().toISOString();puntos.set(abierto,p);await put('puntos',[p]);
  return auto;
}
// After a field changes, refresh only what depends on it, so the next field the technician taps keeps its focus.
function actualizarEstado(campo){
  const punto=C.puntos.find(p=>p.A===abierto),v=valoresCompletos(abierto),a=angulos(v),c=control(punto,v),e=estadoEnvio(abierto);
  $('lev-control').textContent=c;$('lev-control').className='status '+chipClase(c);
  $('lev-envio-estado').textContent=e.texto;$('lev-envio-estado').className='lev-envio '+e.clase;
  if($('lev-angulos'))$('lev-angulos').innerHTML=`Ángulo vertical (BP): <strong>${a.BP??'—'}°</strong> · Ángulo horizontal (BQ): <strong>${a.BQ??'—'}°</strong>${(a.BP??0)>30||(a.BQ??0)>30?' · <span class="lev-req">sobre 30°</span>':''}`;
  campo?.closest('.lev-campo')?.classList.toggle('lev-falta',campo.closest('.lev-campo').querySelector('.lev-req')!==null&&vacio(campo.value));
}
async function tomarGps(){
  ctx.toast('Obteniendo ubicación GPS…');
  const fix=await requestFix(()=>ctx.toast('Ubicación desactivada: activa el GPS para tomar la coordenada.'));
  if(!fix){ctx.toast('No se pudo obtener la ubicación. Escribe la coordenada a mano.');return;}
  const p=puntos.get(abierto)??{codigo:abierto,valores:{},sent:null,error:''};
  p.gps=fix;p.valores.U=fix.lat.toFixed(6);p.valores.V=fix.lon.toFixed(6);puntos.set(abierto,p);
  await guardarCampo('U',p.valores.U);
  ctx.toast(`Coordenada tomada ±${fix.accuracy} m.${fix.accuracy>15?' La precisión es baja: espera unos segundos y vuelve a tomarla.':''}`);render();
}
async function agregarFotos(toma,lista,origen){
  const punto=C.puntos.find(p=>p.A===abierto),t=C.fotos.find(x=>x.code===toma),fix=await requestFix(),author=ctx.config().email,fecha=puntos.get(abierto)?.valores.S||chileDate();
  const nuevas=[];
  for(const file of lista){
    if(!file.size||file.size>25*1024*1024){ctx.toast('Cada foto debe pesar entre 1 byte y 25 MB.');continue;}
    const registered=new Date().toISOString();
    let blob=await processImage(file,[`${punto.A} · Levantamiento ${t.code} ${t.label}`,`${fecha.split('-').reverse().join('-')} · ${new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'short',timeStyle:'short'}).format(new Date(registered))}`,gpsLabel(fix,origen),author]);
    if(!blob){ctx.toast('No se pudo procesar la foto.');continue;}
    if(fix)blob=await withExif(blob,fix);
    nuevas.push({id:randomId(),codigo:punto.A,comuna:punto.B,toma,blob,gps:fix,gpsSource:origen,registeredAt:registered,fecha,status:'pending',index:1});
  }
  if(!nuevas.length)return;
  await put('fotos',nuevas);fotos.push(...nuevas);
  const p=puntos.get(abierto)??{codigo:abierto,valores:{},gps:null,sent:null,error:''};p.updatedAt=new Date().toISOString();p.error='';
  if(!p.valores.S)p.valores.S=chileDate()>=minFecha()?chileDate():'';puntos.set(abierto,p);await put('puntos',[p]);render();
}

// --- Sending: photos first, then the point's JSON; nothing leaves the phone until Dropbox confirms -----------------
const carpetaFotos=f=>`${ctx.config().root.replace(/\/+$/,'')}/${f.comuna}/Fotos${ctx.config().pilot?'/_PILOTO_CAPTURA':''}/Levantamiento/${f.codigo}`;
const nombreFoto=f=>`${f.codigo}_${f.fecha}_lev_${f.toma}${f.index===1?'':'_'+f.index}.jpg`;
async function subirFoto(f){
  if(!f.contentHash)f.contentHash=await dropbox.contentHash(f.blob);
  const folder=carpetaFotos(f);
  for(let intento=0;intento<50;intento++){
    const path=folder+'/'+nombreFoto(f);
    try{const remota=await dropbox.metadata(path);if(remota['.tag']==='file'&&remota.content_hash===f.contentHash){f.path=remota.path_display;return;}f.index++;continue;}
    catch(error){if(!(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('not_found')))throw error;}
    try{const r=await dropbox.api('files/upload',null,{binary:f.blob,args:{path,mode:'add',autorename:false,strict_conflict:true,content_hash:f.contentHash}});f.path=r.path_display;return;}
    catch(error){if(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('conflict'))continue;throw error;}
  }
  throw new Error('No se pudo asignar un nombre libre a la foto.');
}
async function enviar(codigo){
  const cfg=ctx.config();
  if(!cfg.levantamientoQueue){ctx.toast('El envío del levantamiento no está activado todavía. Todo queda guardado en el teléfono.');return;}
  if(!navigator.onLine){ctx.toast('Sin señal. Todo queda guardado en el teléfono; envía cuando haya cobertura.');return;}
  if(busy)return;busy=true;render();
  const punto=C.puntos.find(p=>p.A===codigo),p=puntos.get(codigo)??{codigo,valores:{},gps:null,sent:null,error:''};
  try{
    for(const f of fotos.filter(x=>x.codigo===codigo&&x.status!=='sent')){await subirFoto(f);f.status='sent';f.sentAt=new Date().toISOString();await put('fotos',[f]);}
    const fs=fotos.filter(x=>x.codigo===codigo),valores=envioValores(punto,valoresCompletos(codigo)),id=randomId(),guardado=new Date().toISOString();
    const cuerpo={version:1,tipo:'levantamiento',app:'evidencias',id,codigo,comuna:punto.B,guardado,registro:cfg.email,piloto:!!cfg.pilot,
      valores,gps:p.gps??null,fotos:fs.map(f=>({toma:f.toma,nombre:nombreFoto(f),ruta:f.path,gps:f.gps??null}))};
    const path=`${cfg.levantamientoQueue}/${cfg.pilot?'_PILOTO/':''}${punto.B}/${codigo}_${guardado.replace(/[:.]/g,'-')}_${id.slice(0,8)}.json`;
    await dropbox.api('files/upload',null,{binary:new Blob([JSON.stringify(cuerpo,null,1)],{type:'application/json'}),args:{path,mode:'add',autorename:false,strict_conflict:true}});
    p.sent={id,at:guardado,path,huella:huella({v:valores,f:fs.map(f=>f.id).sort()})};p.error='';
    ctx.toast(`${codigo} enviado. La planilla se actualiza en el próximo ciclo del servicio.`);
  }catch(error){p.error=error.name==='TimeoutError'?'La respuesta tardó demasiado. Reintenta.':error.message;ctx.toast('No se pudo enviar: '+p.error);}
  finally{puntos.set(codigo,p);await put('puntos',[p]);busy=false;render();}
}
async function enviarPendientes(){for(const p of C.puntos)if(estadoEnvio(p.A).clase==='pending'||estadoEnvio(p.A).clase==='error')await enviar(p.A);}

// The same columns A..BU as the form, so the file can be pasted into it if something fails in the field.
function descargarCSV(){
  const cols=[...C.precargadas.map(c=>c.col),...C.campos.map(c=>c.col)];
  const filas=[[...C.precargadas.map(c=>c.label),...C.campos.map(c=>c.label)]];
  for(const punto of C.puntos){const v=valoresCompletos(punto.A);if(!puntos.get(punto.A)&&!fotos.some(f=>f.codigo===punto.A))continue;
    filas.push(cols.map(c=>C.precargadas.some(x=>x.col===c)?punto[c]:(visible(C.campos.find(x=>x.col===c),punto)?v[c]??'':'')));}
  if(filas.length===1){ctx.toast('Todavía no hay levantamientos en este teléfono.');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv(filas)],{type:'text/csv;charset=utf-8'}));a.download=`Levantamiento_DEC-020_${chileDate()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}

// --- Wiring ---------------------------------------------------------------------------------------------------------
export async function setupLevantamiento(context){
  ctx=context;
  try{const r=await fetch('/api/evidencias/assets/levantamiento.json');if(!r.ok)throw new Error('No se pudo cargar el formulario de levantamiento.');C=await r.json();}
  catch(error){$('lev-lista').innerHTML=`<p class="form-error">${esc(error.message)}</p>`;return;}
  (await all('puntos')).forEach(p=>puntos.set(p.codigo,p));fotos=await all('fotos');
  $('lev-quien').innerHTML='<option value="">Todos</option>'+C.levantadores.map(n=>`<option${n===prefs.levanto?' selected':''}>${esc(n)}</option>`).join('');filtro.quien=prefs.levanto&&C.levantadores.includes(prefs.levanto)?prefs.levanto:'';
  $('lev-dia').innerHTML='<option value="">Todos los días</option>'+[...new Set(C.puntos.map(p=>p.E))].sort().map(d=>`<option>${esc(d)}</option>`).join('');
  $('lev-quien').addEventListener('change',e=>{filtro.quien=e.target.value;render();});
  $('lev-dia').addEventListener('change',e=>{filtro.dia=e.target.value;render();});
  $('lev-buscar').addEventListener('input',e=>{filtro.texto=e.target.value;render();});
  $('lev-csv').addEventListener('click',descargarCSV);
  $('lev-enviar-todo').addEventListener('click',enviarPendientes);
  const view=$('levantamiento-view');
  view.addEventListener('click',async e=>{
    const t=e.target.closest('[data-lev-abrir],[data-lev-volver],[data-lev-gps],[data-lev-foto],[data-lev-quitar],[data-lev-enviar]');if(!t)return;
    if(t.dataset.levAbrir){abierto=t.dataset.levAbrir;render();window.scrollTo({top:0,behavior:'instant'});}
    else if('levVolver'in t.dataset){abierto=null;render();}
    else if('levGps'in t.dataset)await tomarGps();
    else if(t.dataset.levFoto){const [toma,origen]=t.dataset.levFoto.split('|');const input=document.createElement('input');input.type='file';input.accept='image/*';if(origen==='camera')input.capture='environment';else input.multiple=true;input.onchange=()=>agregarFotos(toma,[...input.files],origen);input.click();}
    else if(t.dataset.levQuitar){const id=t.dataset.levQuitar;await del('fotos',[id]);fotos=fotos.filter(f=>f.id!==id);render();}
    else if('levEnviar'in t.dataset)await enviar(abierto);
  });
  view.addEventListener('input',e=>{const col=e.target.dataset?.levCampo;if(!col)return;clearTimeout(guardarTimer);const valor=e.target.value;guardarTimer=setTimeout(()=>guardarCampo(col,valor),300);});
  view.addEventListener('change',async e=>{const col=e.target.dataset?.levCampo;if(!col)return;clearTimeout(guardarTimer);if(await guardarCampo(col,e.target.value))render();else actualizarEstado(e.target);});
  render();
}
export function showLevantamiento(){abierto=null;render();}
