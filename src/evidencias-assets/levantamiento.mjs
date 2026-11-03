// Levantamiento en terreno: DEC-020 (puntos MOP Vialidad) y vía rápida (puntos municipales, por comuna). Each form's
// yellow columns are the data contract (levantamiento.json, generated from the planillas and read by header name):
// this screen asks for exactly those fields, computes «Control» and, for vía rápida, «Trámite resultante» with the
// planilla's own rules, saves every change on the device so nothing is lost without signal, and sends one JSON per
// point to the queue the office service reads.
import {chileDate,csv,randomId} from './core.mjs';
import * as dropbox from './dropbox-client.mjs';
import {gpsLabel,processImage,withExif,requestFix} from './media.mjs';

const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='visionaria-levantamiento-v1',PREFS='visionaria-levantamiento-prefs',OFICINA='visionaria-levantamiento-oficina';
const FECHA_BASE=Date.UTC(1899,11,30);
const ORDEN_CLASIFICACION=['Vía rápida probable','Revisar','Trámite largo probable'];
let C=null,ctx=null,puntos=new Map(),fotos=[],abierto=null,filtro={quien:'',dia:'',texto:'',comuna:'',estado:'',clasif:''},busy=false,urls=[],guardarTimer=null,aqui=null,confirmando=null;
let prefs={};try{prefs=JSON.parse(localStorage.getItem(PREFS)||'{}')}catch{}
const savePrefs=()=>{try{localStorage.setItem(PREFS,JSON.stringify(prefs))}catch{}};
// What the office already has, per point (from the panel summary): read when the screen opens, kept for offline use.
let oficina={generado:null,puntos:new Map()};
try{const o=JSON.parse(localStorage.getItem(OFICINA)||'null');if(o)oficina={generado:o.generado,puntos:new Map(o.levantamientos.map(r=>[r.codigo,r]))};}catch{}

// --- Storage: its own database, so a levantamiento never mixes with the evidence records ---------------------------
let dbp;
function database(){return dbp??=new Promise((resolve,reject)=>{const r=indexedDB.open(KEY,1);r.onupgradeneeded=()=>{r.result.createObjectStore('puntos',{keyPath:'codigo'});r.result.createObjectStore('fotos',{keyPath:'id'}).createIndex('codigo','codigo');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function all(store){const d=await database();return new Promise((resolve,reject)=>{const q=d.transaction(store).objectStore(store).getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function put(store,rows){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');rows.forEach(r=>tx.objectStore(store).put(r));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('No se pudo guardar.'));});}
async function del(store,ids){const d=await database();return new Promise((resolve,reject)=>{const tx=d.transaction(store,'readwrite');ids.forEach(id=>tx.objectStore(store).delete(id));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}

// --- Contract helpers ------------------------------------------------------------------------------------------------
const formulario=id=>C.formularios.find(f=>f.id===id);
let porCodigo=new Map();
const ubicar=codigo=>porCodigo.get(codigo);                      // {F, punto}
const activo=()=>formulario(prefs.formulario)??C.formularios[0];
const minFecha=()=>new Date(FECHA_BASE+Number(C.fechaMinima)*86400000).toISOString().slice(0,10);
const visible=(campo,punto)=>!campo.when||(campo.when==='lpr'?punto.lpr:punto.enlace);
const tomasDe=(F,punto)=>F.fotos.filter(t=>!t.when||(t.when==='lpr'?punto.lpr:punto.enlace));
const asignado=(F,punto,clave)=>punto.asignacion?.[clave==='quien'?'Lo levanta':F.tipo==='dec020'?'Día (plan de Iván)':'Día']??'';

// --- The planilla's own rules: «Control», «Trámite resultante» and the LPR angles ------------------------------------
const num=v=>{const n=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;};
const vacio=v=>v===undefined||v===null||String(v).trim()==='';
export function angulos(F,v){const r=F.reglas.angulos;if(!r)return {vertical:null,horizontal:null};
  const m=num(v[r.montaje]),c=num(v[r.captura]),l=num(v[r.lateral]),deg=x=>Math.round(Math.atan(x)*180/Math.PI);
  return {vertical:m!==null&&c?deg((m-0.6)/c):null,horizontal:l!==null&&c?deg(l/c):null};}
// Pure versions of «Control» and «Trámite resultante», exported so they can be checked against the planillas themselves.
export function controlFormulario(F,punto,v){
  const r=F.reglas,a=angulos(F,v);
  if(F.campos.every(c=>vacio(v[c.key])||(c.key===r.fotos.campo&&String(v[c.key])==='0')))return 'Sin levantar';
  if(r.obligatorios.some(k=>vacio(v[k])))return 'Faltan datos';
  if(punto.lpr&&r.obligatoriosLpr.some(k=>vacio(v[k])))return 'Faltan datos LPR';
  if(punto.enlace&&vacio(v[r.enlace.campo]))return 'Faltan datos del enlace';
  if(v[r.cruce.campo]==='Sí'&&(vacio(v[r.cruce.altura])||(num(v[r.cruce.altura])??0)<r.cruce.minimo))return 'Cruce: altura bajo 6,0 m';
  if(r.angulos&&((a.vertical??0)>r.angulos.maximo||(a.horizontal??0)>r.angulos.maximo))return 'LPR: ángulo sobre 30°';
  if(v[r.organismo.faja]==='Sí'&&!r.organismo.validos.includes(v[r.organismo.campo]))return 'Revisar organismo';
  if((num(v[r.fotos.campo])??0)<r.fotos.minimo)return 'Faltan fotos (mínimo 3)';
  return 'OK';
}
export function tramiteFormulario(F,punto,v){
  const t=F.reglas.tramite;if(!t)return null;
  if(controlFormulario(F,punto,v)==='Sin levantar')return '';
  if(vacio(v[t.rotura])||vacio(v[t.redBT])||vacio(v[t.organismo]))return 'Incompleto';
  if(t.mop.includes(v[t.organismo])||v[t.faja]==='Sí')return 'MOP o concesionaria';
  if(v[t.rotura]==='Sí'||v[t.organismo]===t.serviu)return 'DOM y SERVIU';
  if(v[t.redBT]!==t.redOk||vacio(v[t.distancia])||(num(v[t.distancia])??0)>t.distanciaMax)return 'Solo DOM; empalme por revisar';
  if(v[t.fundacion]===t.areaVerde)return 'Vía rápida: DOM (área verde)';
  return 'Vía rápida: solo DOM';
}
function valoresCompletos(codigo){const {F}=ubicar(codigo),p=puntos.get(codigo),v={...(p?.valores||{})};v[F.reglas.fotos.campo]=String(fotos.filter(f=>f.codigo===codigo).length||'');return v;}
const estadoDe=codigo=>{const {F,punto}=ubicar(codigo),v=valoresCompletos(codigo);return {control:controlFormulario(F,punto,v),tramite:tramiteFormulario(F,punto,v)};};

// What the queue receives: values typed as the contract says, only the visible fields, the photo count from the photos.
function envioValores(F,punto,v){const out={};for(const c of F.campos){if(!visible(c,punto))continue;const x=v[c.key];if(vacio(x))continue;
  if(c.type==='decimal'){const n=num(x);if(n!==null)out[c.key]=n;}else if(c.type==='whole'){const n=num(x);if(n!==null)out[c.key]=Math.round(n);}else out[c.key]=String(x).trim();}
  return out;}
const fechaCorta=iso=>new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
const huella=o=>JSON.stringify(o,Object.keys(o).sort());
function estadoEnvio(codigo){const p=puntos.get(codigo),fs=fotos.filter(f=>f.codigo===codigo);
  if(!p||(!Object.keys(p.valores||{}).length&&!fs.length))return p?.anulado?{texto:'Anulado '+fechaCorta(p.anulado.at),clase:''}:{texto:'Sin datos',clase:''};
  if(p.error)return {texto:'Error al enviar',clase:'error'};
  const {F,punto}=ubicar(codigo),actual=huella({v:envioValores(F,punto,valoresCompletos(codigo)),f:fs.map(f=>f.id).sort(),g:p.gpsPoste?.at??''});
  if(p.sent&&p.sent.huella===actual&&fs.every(f=>f.status==='sent'))return {texto:'Enviado '+fechaCorta(p.sent.at),clase:'sent'};
  return {texto:p.sent?'Cambios sin enviar':'Guardado en el teléfono',clase:'pending'};
}
const distanciaM=(a,b)=>{const R=6371000,r=x=>x*Math.PI/180,dLat=r(b.lat-a.lat),dLon=r(b.lon-a.lon);
  const h=Math.sin(dLat/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const kmz=punto=>{const lat=num(punto.pre['Latitud KMZ']),lon=num(punto.pre['Longitud KMZ']);return lat!==null&&lon!==null?{lat,lon}:null;};
const nodoOrden=n=>{const m=String(n).match(/\d+/);return m?Number(m[0]):999;};

// Where each point stands, joining this phone (drafts, sends not yet processed) with what the office already wrote.
// estado: sin | borrador | enviado (in the queue) | ingresado (in the planilla) | anulado.
const ETIQUETA={sin:'Sin levantar',borrador:'Borrador en el teléfono',enviado:'Enviado, en cola',ingresado:'Ingresado en la planilla',anulado:'Anulado'};
function situacion(codigo){
  const p=puntos.get(codigo),s=estadoEnvio(codigo),o=oficina.puntos.get(codigo),local=estadoDe(codigo);
  const t=x=>Date.parse(x)||0,oficinaVigente=o&&(!p?.sent||t(o.guardado_en)>=t(p.sent.at))&&(!p?.anulado||t(o.guardado_en)>=t(p.anulado.at));
  let estado;
  if(s.clase==='pending'||s.clase==='error')estado='borrador';
  else if(oficinaVigente)estado=o.anulado?'anulado':'ingresado';
  else if(s.clase==='sent')estado='enviado';
  else if(p?.anulado)estado='anulado';
  else estado='sin';
  const deOficina=estado==='ingresado';
  return {estado,etiqueta:ETIQUETA[estado],clase:estado==='sin'||estado==='anulado'?'':estado==='borrador'?'pending':'sent',
    control:deOficina?o.control||'Sin levantar':local.control,tramite:deOficina?o.tramite||'':local.tramite};
}
const ESTADOS=[['sin','Sin levantar'],['borrador','Borradores en el teléfono'],['enviado','Enviados, en cola'],['ingresado','Ingresados en la planilla'],['anulado','Anulados'],['ok','Control OK'],['faltan','Con datos pendientes'],['via-rapida','Vía rápida confirmada'],['largo','Trámite largo o por revisar']];
function coincideEstado(codigo,filtroEstado){const e=situacion(codigo);
  if(filtroEstado==='ok')return e.control==='OK';
  if(filtroEstado==='faltan')return !['OK','Sin levantar'].includes(e.control);
  if(filtroEstado==='via-rapida')return String(e.tramite).startsWith('Vía rápida');
  if(filtroEstado==='largo')return !!e.tramite&&!String(e.tramite).startsWith('Vía rápida');
  return e.estado===filtroEstado;}
const claseGrupo=g=>g==='Vía rápida probable'?'rapida':g==='Revisar'?'revisar':'largo';

// The person comes from the session: the email's surname matched against the form's levantadores.
const sinTildes=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
function nombreSesion(){const email=ctx?.config().email||'',local=sinTildes(email.split('@')[0]);if(!local)return null;
  const hay=C.levantadores.filter(n=>{const partes=n.split(/\s+/).map(sinTildes).filter(x=>x.length>2);return partes.length>1&&local.includes(partes.at(-1));});
  return hay.length===1?hay[0]:null;}
function levantoSesion(F){const campo=F.campos.find(c=>c.key==='Levantó'),nombre=nombreSesion();
  if(campo?.type==='list')return nombre&&campo.options.includes(nombre)?nombre:null;
  return nombre||ctx?.config().email||null;}

async function cargarOficina(){
  try{const r=await fetch('/api/evidencias/levantamiento',{cache:'no-store'});if(!r.ok)return;const o=await r.json();
    oficina={generado:o.generado,puntos:new Map(o.levantamientos.map(x=>[x.codigo,x]))};
    try{localStorage.setItem(OFICINA,JSON.stringify(o))}catch{}
    if(!abierto)render();}catch{}
}

// The executive board: every point of every form, per comuna, with what is in the planilla, in the queue and on this phone.
function renderTablero(){
  const comunas=[...new Set(C.formularios.flatMap(F=>F.puntos.map(p=>p.comuna)))].sort();
  const hora=oficina.generado?new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(oficina.generado)):null;
  const tarjetas=comunas.map(comuna=>{
    const filas=C.formularios.map(F=>({F,lista:F.puntos.filter(p=>p.comuna===comuna&&!p.porUbicar)})).filter(x=>x.lista.length);
    const todos=filas.flatMap(x=>x.lista.map(p=>situacion(p.codigo))),total=todos.length,cuenta=k=>todos.filter(e=>e.estado===k).length;
    const ing=cuenta('ingresado'),env=cuenta('enviado'),bor=cuenta('borrador'),ok=todos.filter(e=>e.control==='OK').length;
    const vr=todos.filter(e=>String(e.tramite).startsWith('Vía rápida')).length,largo=todos.filter(e=>e.tramite&&!String(e.tramite).startsWith('Vía rápida')).length;
    const pct=x=>total?(x/total*100).toFixed(1):0,avance=total?Math.round((ing+env)/total*100):0;
    return `<button type="button" class="lev-tarjeta${filtro.comuna===comuna?' activa':''}" data-lev-comuna="${esc(comuna)}">
      <div class="lev-tarjeta-top"><strong>${esc(comuna)}</strong><span>${avance}%</span></div>
      <div class="lev-barra" role="img" aria-label="${ing} ingresados, ${env} en cola, ${bor} borradores de ${total}"><i class="ing" style="width:${pct(ing)}%"></i><i class="env" style="width:${pct(env)}%"></i><i class="bor" style="width:${pct(bor)}%"></i></div>
      <dl><div><dt>Ingresados</dt><dd>${ing}</dd></div><div><dt>En cola</dt><dd>${env}</dd></div><div><dt>Borradores</dt><dd>${bor}</dd></div><div><dt>Sin levantar</dt><dd>${cuenta('sin')+cuenta('anulado')}</dd></div></dl>
      <p>${ok} con Control OK${vr||largo?` · ${vr} vía rápida · ${largo} trámite largo o por revisar`:''}</p>
      <p class="lev-tarjeta-forms">${filas.map(x=>`${esc(x.F.tipo==='dec020'?'DEC-020':'Vía rápida')} ${x.lista.length}`).join(' · ')} puntos</p></button>`;}).join('');
  $('lev-tablero').innerHTML=`<div class="lev-tablero-grid">${tarjetas}</div><p class="field-hint">${hora?`Planilla: estado de la oficina al ${hora}.`:'Sin datos de la oficina todavía: se muestra solo lo de este teléfono.'} Los borradores son solo los de este teléfono. Toca una comuna para filtrar la lista.</p>`;
}

// --- Rendering ------------------------------------------------------------------------------------------------------
const chipClase=t=>t==='OK'||String(t).startsWith('Vía rápida')?'sent':t==='Sin levantar'||!t?'':'error';
function bandeja(F){
  let lista=F.puntos.filter(p=>!p.porUbicar&&(!filtro.quien||asignado(F,p,'quien').includes(filtro.quien))&&(!filtro.dia||asignado(F,p,'dia')===filtro.dia)
    &&(!filtro.comuna||p.comuna===filtro.comuna)&&(!filtro.clasif||p.clasificacion===filtro.clasif)&&(!filtro.estado||coincideEstado(p.codigo,filtro.estado))
    &&(!filtro.texto||(p.codigo+' '+(p.pre['Ubicación según el KMZ de las bases']??'')+' '+(p.nodo??'')).toLowerCase().includes(filtro.texto.toLowerCase())));
  if(F.tipo==='via-rapida'){const dist=p=>{const k=kmz(p);return aqui&&k?distanciaM(aqui,k):Infinity;};
    lista=[...lista].sort((a,b)=>ORDEN_CLASIFICACION.indexOf(a.clasificacion)-ORDEN_CLASIFICACION.indexOf(b.clasificacion)||nodoOrden(a.nodo)-nodoOrden(b.nodo)||dist(a)-dist(b));}
  return lista;
}
function renderLista(){
  const F=activo(),lista=bandeja(F),estados=F.puntos.filter(p=>!p.porUbicar).map(p=>situacion(p.codigo));
  const n=t=>estados.filter(e=>e.control===t).length,vr=estados.filter(e=>String(e.tramite).startsWith('Vía rápida')).length;
  $('lev-resumen').textContent=`${n('OK')} OK · ${estados.length-n('OK')-n('Sin levantar')} en curso · ${n('Sin levantar')} sin levantar · ${estados.length} puntos${F.tipo==='via-rapida'?` · ${vr} vía rápida confirmada`:''}`;
  renderTablero();
  let grupo='';const porGrupo=g=>lista.filter(p=>p.clasificacion===g).length;
  $('lev-lista').innerHTML=lista.length?lista.map(p=>{const e=situacion(p.codigo),s=estadoEnvio(p.codigo),k=kmz(p);
    const cab=F.tipo==='via-rapida'&&p.clasificacion!==grupo?(grupo=p.clasificacion,`<h3 class="lev-grupo-titulo ${claseGrupo(grupo)}">${esc(grupo)}<span>${porGrupo(grupo)} punto${porGrupo(grupo)===1?'':'s'}</span></h3>`):'';
    const lejos=aqui&&k?` · a ${(distanciaM(aqui,k)/1000).toFixed(1).replace('.',',')} km`:'';
    return `${cab}<button type="button" class="lev-item" data-lev-abrir="${esc(p.codigo)}"><div><strong>${esc(p.codigo)}</strong>${p.lpr?' <span class="lev-tag">LPR</span>':''}${p.sinSolucion?' <span class="lev-tag">Sin solución</span>':''}<div class="record-meta">${esc(p.comuna)}${p.nodo?' · '+esc(p.nodo):''} · ${esc(p.pre['Ubicación según el KMZ de las bases'])}${asignado(F,p,'quien')?' · '+esc(asignado(F,p,'quien')):''}${lejos}</div></div><div class="lev-estados">${e.tramite?`<span class="status ${chipClase(e.tramite)}">${esc(e.tramite)}</span>`:''}<span class="status ${chipClase(e.control)}">${esc(e.control)}</span><span class="lev-envio ${s.clase||e.clase}">${esc(s.clase?s.texto:e.etiqueta)}</span></div></button>`;}).join(''):'<p class="muted">Ningún punto coincide con el filtro.</p>';
}
function campoHTML(F,c,v,punto){
  const val=v[c.key]??'',id='lev-c-'+F.campos.indexOf(c),req=c.required||(c.requiredLpr&&punto.lpr)||(c.key===F.reglas.enlace.campo&&punto.enlace);
  const label=`<span class="lev-col">${esc(c.col)}</span> ${esc(c.key)}${req?' <span class="lev-req">*</span>':''}${c.key.startsWith('Señal celular')&&punto.sinSolucion?' <span class="lev-tag">Anotar cada operador</span>':''}`;
  const attr=`id="${id}" data-lev-campo="${esc(c.key)}"`;let input;
  const quien=c.key==='Levantó'?levantoSesion(F):null;
  if(c.key===F.reglas.fotos.campo)input=`<input id="${id}" value="${esc(val)}" readonly>`;
  else if(quien)input=`<input id="${id}" value="${esc(val||quien)}" readonly><span class="field-hint">Se asigna con la sesión iniciada.</span>`;
  else if(c.type==='list')input=`<select ${attr}><option value=""></option>${c.options.map(o=>`<option${o===val?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(c.type==='date')input=`<input ${attr} type="date" min="${minFecha()}" max="${chileDate()}" value="${esc(val)}">`;
  else if(c.type==='decimal'||c.type==='whole')input=`<input ${attr} type="text" inputmode="${c.type==='whole'?'numeric':'decimal'}" value="${esc(val)}" autocomplete="off">`;
  else input=`<textarea ${attr} rows="2" maxlength="2000">${esc(val)}</textarea>`;
  return `<label class="lev-campo${req&&vacio(val)?' lev-falta':''}">${label}${c.hint?`<span class="field-hint">${esc(c.hint)}</span>`:''}${input}</label>`;
}
function bloqueGps(F,p){
  if(F.tipo==='via-rapida'){const d=p?.gpsDistancia;
    return `<div class="lev-gps"><button type="button" class="btn btn-camera" data-lev-gps="poste"><svg><use href="#i-pin"/></svg>Estoy en el lugar del poste nuevo</button><button type="button" class="btn btn-secondary" data-lev-gps="cge"><svg><use href="#i-pin"/></svg>Estoy en el poste CGE</button>
      <span class="field-hint">${p?.gps?'Poste nuevo: '+esc(gpsLabel(p.gps,'camera')):'Poste nuevo: sin tomar'} · ${p?.gpsPoste?'Poste CGE: '+esc(gpsLabel(p.gpsPoste,'camera')):'Poste CGE: sin tomar'}${d?` · distancia por GPS ${String(d.metros).replace('.',',')} m (±${d.precision} m)`:''}</span></div>`;}
  return `<div class="lev-gps"><button type="button" class="btn btn-camera" data-lev-gps="poste"><svg><use href="#i-pin"/></svg>Tomar coordenada aquí</button><span class="field-hint">${p?.gps?esc(gpsLabel(p.gps,'camera')):'De pie en el lugar propuesto para el poste.'}</span></div>`;
}
function renderFicha(){
  urls.forEach(URL.revokeObjectURL);urls=[];
  const {F,punto}=ubicar(abierto),v=valoresCompletos(abierto),a=angulos(F,v),e=estadoDe(abierto),s=estadoEnvio(abierto),p=puntos.get(abierto);
  const visibles=F.campos.filter(c=>visible(c,punto)),rapidos=visibles.filter(c=>c.rapida).sort((x,y)=>x.rapida-y.rapida);
  const resto=visibles.filter(c=>!c.rapida),grupos=[...new Set(resto.map(x=>x.group))];
  const angulosHTML=F.reglas.angulos?`<p class="lev-angulos" id="lev-angulos">${angulosTexto(a)}</p>`:'';
  const fieldsets=grupos.map(g=>`<fieldset class="lev-grupo"><legend>${esc(g)}</legend>${resto.filter(x=>x.group===g).map(x=>campoHTML(F,x,v,punto)).join('')}${g==='Pórtico LPR'?angulosHTML:''}</fieldset>`).join('');
  $('lev-ficha').innerHTML=`
    <div class="lev-ficha-top"><button type="button" class="text-button" data-lev-volver>← Todos los puntos</button><span id="lev-control" class="status ${chipClase(e.control)}">${esc(e.control)}</span></div>
    <h2>${esc(punto.codigo)} · ${esc(punto.pre['Tipo']||punto.clasificacion||'')}</h2>
    <p class="lev-aviso">Levantamiento de observación: no se contacta ni se ingresa nada en la Delegación, el municipio, CGE ni Vialidad.</p>
    <dl class="lev-pre">${F.precargadas.filter(h=>!['Código','Latitud KMZ','Longitud KMZ'].includes(h)&&punto.pre[h]&&punto.pre[h]!=='—').map(h=>`<div><dt>${esc(h)}</dt><dd>${esc(punto.pre[h])}</dd></div>`).join('')}
      <div><dt>Coordenada KMZ</dt><dd>${esc(punto.pre['Latitud KMZ'])}, ${esc(punto.pre['Longitud KMZ'])}${punto.mapa?` · <a href="${esc(punto.mapa)}" target="_blank" rel="noopener noreferrer">Abrir mapa</a>`:''}</dd></div></dl>
    ${bloqueGps(F,p)}
    ${F.tipo==='via-rapida'?`<fieldset class="lev-grupo lev-rapida"><legend>Ficha rápida</legend>${rapidos.map(x=>campoHTML(F,x,v,punto)).join('')}<div class="lev-tramite ${chipClase(e.tramite)}" id="lev-tramite"><span>Trámite resultante</span><strong>${esc(e.tramite||'Sin levantar')}</strong></div></fieldset>
      <details class="lev-mas"${prefs.abrirResto?' open':''}><summary>Resto del formulario (necesario para «Control» OK)</summary>${fieldsets}</details>`:fieldsets}
    <fieldset class="lev-grupo"><legend>Fotos guiadas</legend><p class="field-hint">Mínimo 3. Cada foto queda estampada con el punto, la toma, la fecha y el GPS.</p>
      ${tomasDe(F,punto).map(t=>{const fs=fotos.filter(f=>f.codigo===abierto&&f.toma===t.code);return `<div class="proto-slot${fs.length?' done':''}"><div class="proto-head"><div><strong>${esc(t.code)} · ${esc(t.label)}${t.required?' <span class="lev-req">*</span>':''}${fs.length?` · ${fs.length}`:''}</strong><span class="field-hint">${esc(t.hint)}</span></div><div class="proto-actions"><button type="button" class="btn btn-camera" data-lev-foto="${esc(t.code)}|camera"><svg><use href="#i-camera"/></svg>Cámara</button><button type="button" class="btn btn-secondary" data-lev-foto="${esc(t.code)}|gallery"><svg><use href="#i-plus"/></svg>Galería</button></div></div>${fs.length?`<div class="proto-thumbs">${fs.map(f=>{const u=URL.createObjectURL(f.blob);urls.push(u);return `<div class="photo-tile"><img src="${u}" alt="${esc(t.code)}"><code>${esc(nombreFoto(f))} · ${f.status==='sent'?'✓ Dropbox':'○ En el teléfono'}</code>${f.status==='sent'?'':`<button type="button" class="remove-photo" data-lev-quitar="${esc(f.id)}" aria-label="Quitar fotografía">×</button>`}</div>`}).join('')}</div>`:''}</div>`;}).join('')}
    </fieldset>
    ${bloqueConfirmar(p)}
    <div class="lev-acciones"><span id="lev-envio-estado" class="lev-envio ${s.clase}">${esc(s.texto)}${p?.error?' · '+esc(p.error):''}</span><div class="lev-botones">${p?.sent?`<button type="button" class="text-button lev-peligro" data-lev-confirmar="anular" ${busy?'disabled':''}>Anular levantamiento</button>`:p&&s.clase?`<button type="button" class="text-button lev-peligro" data-lev-confirmar="descartar" ${busy?'disabled':''}>Descartar borrador</button>`:''}<button type="button" class="btn btn-primary" data-lev-enviar ${busy?'disabled':''}>Enviar a Dropbox</button></div></div>`;
}
// Undoing a point: a draft that never left the phone is simply discarded; one already sent is annulled through the
// queue, so the planilla row is emptied and the history (and the photos in Dropbox) stays.
function bloqueConfirmar(p){
  if(confirmando==='descartar')return `<div class="lev-confirmar"><p><strong>¿Descartar el borrador de ${esc(abierto)}?</strong> Se borran del teléfono los datos y las fotos de este punto. Nunca se enviaron, así que no queda copia en ningún lado.</p><div class="lev-botones"><button type="button" class="btn btn-secondary" data-lev-confirmar="">Volver</button><button type="button" class="btn lev-btn-peligro" data-lev-descartar>Descartar borrador</button></div></div>`;
  if(confirmando==='anular')return `<div class="lev-confirmar"><p><strong>¿Anular el levantamiento de ${esc(abierto)}?</strong> Se envía una anulación y el servicio vacía las celdas amarillas de este punto en la planilla. Lo enviado antes queda en el historial y las fotos siguen en Dropbox. Las fotos que no alcanzaste a enviar se borran del teléfono. El punto vuelve a «Sin levantar» y se puede levantar de nuevo.</p>
    <label class="lev-campo">Motivo de la anulación <span class="lev-req">*</span><textarea id="lev-motivo" rows="2" maxlength="500" placeholder="Ej.: punto equivocado, datos de prueba"></textarea></label>
    <div class="lev-botones"><button type="button" class="btn btn-secondary" data-lev-confirmar="">Volver</button><button type="button" class="btn lev-btn-peligro" data-lev-anular ${busy?'disabled':''}>Confirmar anulación</button></div></div>`;
  return '';
}
const angulosTexto=a=>`Ángulo vertical: <strong>${a.vertical??'—'}°</strong> · Ángulo horizontal: <strong>${a.horizontal??'—'}°</strong>${(a.vertical??0)>30||(a.horizontal??0)>30?' · <span class="lev-req">sobre 30°</span>':''}`;
function render(){if(!C)return;$('lev-lista-wrap').hidden=!!abierto;$('lev-ficha').hidden=!abierto;if(abierto)renderFicha();else renderLista();}

// --- Editing --------------------------------------------------------------------------------------------------------
const nuevoPunto=codigo=>({codigo,formulario:ubicar(codigo).F.id,valores:{},gps:null,gpsPoste:null,sent:null,error:''});
async function guardarCampo(clave,valor){
  const p=puntos.get(abierto)??nuevoPunto(abierto);
  if(vacio(valor))delete p.valores[clave];else p.valores[clave]=valor;
  // The first thing typed stamps the day and who surveyed it; both stay editable.
  let auto=false;
  if(!p.valores['Fecha']&&chileDate()>=minFecha()){p.valores['Fecha']=chileDate();auto=true;}
  const quien=levantoSesion(ubicar(abierto).F);
  if(quien&&p.valores['Levantó']!==quien){p.valores['Levantó']=quien;auto=true;}
  p.error='';p.updatedAt=new Date().toISOString();puntos.set(abierto,p);await put('puntos',[p]);
  return auto;
}
// After a field changes, refresh only what depends on it, so the next field the technician taps keeps its focus.
function actualizarEstado(campo){
  const {F}=ubicar(abierto),v=valoresCompletos(abierto),e=estadoDe(abierto),s=estadoEnvio(abierto);
  $('lev-control').textContent=e.control;$('lev-control').className='status '+chipClase(e.control);
  if($('lev-tramite')){$('lev-tramite').querySelector('strong').textContent=e.tramite||'Sin levantar';$('lev-tramite').className='lev-tramite '+chipClase(e.tramite);}
  $('lev-envio-estado').textContent=s.texto;$('lev-envio-estado').className='lev-envio '+s.clase;
  if($('lev-angulos'))$('lev-angulos').innerHTML=angulosTexto(angulos(F,v));
  campo?.closest('.lev-campo')?.classList.toggle('lev-falta',campo.closest('.lev-campo').querySelector('.lev-req')!==null&&vacio(campo.value));
}
async function tomarGps(cual){
  const {F}=ubicar(abierto);
  ctx.toast('Obteniendo ubicación GPS…');
  const fix=await requestFix(()=>ctx.toast('Ubicación desactivada: activa el GPS para tomar la coordenada.'));
  if(!fix){ctx.toast('No se pudo obtener la ubicación. Escribe el dato a mano.');return;}
  const p=puntos.get(abierto)??nuevoPunto(abierto);aqui=fix;
  if(cual==='cge')p.gpsPoste=fix;
  else{p.gps=fix;p.valores['Latitud medida']=fix.lat.toFixed(6);p.valores['Longitud medida']=fix.lon.toFixed(6);}
  let aviso=`Coordenada ${cual==='cge'?'del poste CGE':'del poste nuevo'} tomada ±${fix.accuracy} m.`;
  // With both positions, the distance to the CGE pole comes from the GPS when both fixes are precise enough.
  if(F.tipo==='via-rapida'&&p.gps&&p.gpsPoste){
    const metros=Math.round(distanciaM(p.gps,p.gpsPoste)*10)/10,precision=Math.max(p.gps.accuracy,p.gpsPoste.accuracy);
    p.gpsDistancia={metros,precision};
    if(precision<=F.reglas.precisionGpsMax){p.valores['Distancia al poste CGE (m)']=String(metros);aviso+=` Distancia al poste CGE: ${String(metros).replace('.',',')} m.`;}
    else aviso+=` La precisión (±${precision} m) es peor que ${F.reglas.precisionGpsMax} m: mide la distancia al poste a mano.`;
  }else if(fix.accuracy>15)aviso+=' La precisión es baja: espera unos segundos y vuelve a tomarla.';
  puntos.set(abierto,p);await guardarCampo('Latitud medida',p.valores['Latitud medida']??'');
  ctx.toast(aviso);render();
}
async function agregarFotos(toma,lista,origen){
  const {F,punto}=ubicar(abierto),t=F.fotos.find(x=>x.code===toma),fix=await requestFix(),author=ctx.config().email,fecha=puntos.get(abierto)?.valores['Fecha']||chileDate();
  const nuevas=[];let n=Math.max(0,...fotos.filter(f=>f.codigo===abierto).map(f=>f.n||0));
  for(const file of lista){
    if(!file.size||file.size>25*1024*1024){ctx.toast('Cada foto debe pesar entre 1 byte y 25 MB.');continue;}
    const registered=new Date().toISOString();
    let blob=await processImage(file,[`${punto.codigo} · Levantamiento ${t.code} ${t.label}`,`${fecha.split('-').reverse().join('-')} · ${new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',dateStyle:'short',timeStyle:'short'}).format(new Date(registered))}`,gpsLabel(fix,origen),author]);
    if(!blob){ctx.toast('No se pudo procesar la foto.');continue;}
    if(fix)blob=await withExif(blob,fix);
    nuevas.push({id:randomId(),codigo:punto.codigo,formulario:F.id,comuna:punto.comuna,toma,blob,gps:fix,gpsSource:origen,registeredAt:registered,fecha,status:'pending',n:++n});
  }
  if(!nuevas.length)return;
  await put('fotos',nuevas);fotos.push(...nuevas);
  const p=puntos.get(abierto)??nuevoPunto(abierto);p.updatedAt=new Date().toISOString();p.error='';
  if(!p.valores['Fecha']&&chileDate()>=minFecha())p.valores['Fecha']=chileDate();puntos.set(abierto,p);await put('puntos',[p]);render();
}

// --- Sending: photos first, then the point's JSON; nothing leaves the phone until Dropbox confirms -----------------
const carpetaFotos=f=>`${ctx.config().root.replace(/\/+$/,'')}/${f.comuna}/Fotos${ctx.config().pilot?'/_PILOTO_CAPTURA':''}/Levantamiento/${f.codigo}`;
const nombreFoto=f=>`${f.codigo}_${f.fecha}_levantamiento-${f.n}.jpg`;
async function subirFoto(f){
  if(!f.contentHash)f.contentHash=await dropbox.contentHash(f.blob);
  const folder=carpetaFotos(f);
  for(let intento=0;intento<50;intento++){
    const path=folder+'/'+nombreFoto(f);
    try{const remota=await dropbox.metadata(path);if(remota['.tag']==='file'&&remota.content_hash===f.contentHash){f.path=remota.path_display;return;}f.n+=100;continue;}
    catch(error){if(!(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('not_found')))throw error;}
    try{const r=await dropbox.api('files/upload',null,{binary:f.blob,args:{path,mode:'add',autorename:false,strict_conflict:true,content_hash:f.contentHash}});f.path=r.path_display;return;}
    catch(error){if(error instanceof dropbox.DropboxError&&error.status===409&&String(error.message).includes('conflict')){f.n+=100;continue;}throw error;}
  }
  throw new Error('No se pudo asignar un nombre libre a la foto.');
}
async function enviar(codigo){
  const cfg=ctx.config();
  if(!cfg.levantamientoQueue){ctx.toast('El envío del levantamiento no está activado todavía. Todo queda guardado en el teléfono.');return;}
  if(!navigator.onLine){ctx.toast('Sin señal. Todo queda guardado en el teléfono; envía cuando haya cobertura.');return;}
  if(busy)return;busy=true;render();
  const {F,punto}=ubicar(codigo),p=puntos.get(codigo)??nuevoPunto(codigo);
  try{
    for(const f of fotos.filter(x=>x.codigo===codigo&&x.status!=='sent')){await subirFoto(f);f.status='sent';f.sentAt=new Date().toISOString();await put('fotos',[f]);}
    const fs=fotos.filter(x=>x.codigo===codigo),valores=envioValores(F,punto,valoresCompletos(codigo)),id=randomId(),guardado=new Date().toISOString();
    const cuerpo={version:2,tipo:'levantamiento',app:'evidencias',formulario:F.id,id,codigo,comuna:punto.comuna,guardado,registro:cfg.email,piloto:!!cfg.pilot,
      valores,gps:p.gps??null,gpsPosteCGE:p.gpsPoste??null,fotos:fs.map(f=>({toma:f.toma,nombre:nombreFoto(f),ruta:f.path,gps:f.gps??null}))};
    const path=`${cfg.levantamientoQueue}/${cfg.pilot?'_PILOTO/':''}${punto.comuna}/${codigo}_${guardado.replace(/[:.]/g,'-')}_${id.slice(0,8)}.json`;
    await dropbox.api('files/upload',null,{binary:new Blob([JSON.stringify(cuerpo,null,1)],{type:'application/json'}),args:{path,mode:'add',autorename:false,strict_conflict:true}});
    p.sent={id,at:guardado,path,huella:huella({v:valores,f:fs.map(f=>f.id).sort(),g:p.gpsPoste?.at??''})};p.error='';
    ctx.toast(`${codigo} enviado. La planilla se actualiza en el próximo ciclo del servicio.`);
  }catch(error){p.error=error.name==='TimeoutError'?'La respuesta tardó demasiado. Reintenta.':error.message;ctx.toast('No se pudo enviar: '+p.error);}
  finally{puntos.set(codigo,p);await put('puntos',[p]);busy=false;render();}
}
async function descartar(codigo){
  const ids=fotos.filter(f=>f.codigo===codigo).map(f=>f.id);
  await del('fotos',ids);fotos=fotos.filter(f=>f.codigo!==codigo);
  const p=puntos.get(codigo);
  if(p?.anulado){const limpio={...nuevoPunto(codigo),anulado:p.anulado};puntos.set(codigo,limpio);await put('puntos',[limpio]);}
  else{puntos.delete(codigo);await del('puntos',[codigo]);}
  confirmando=null;ctx.toast(`Borrador de ${codigo} descartado.`);render();
}
async function anular(codigo,motivo){
  const cfg=ctx.config();
  if(!motivo){ctx.toast('Escribe el motivo de la anulación.');$('lev-motivo')?.focus();return;}
  if(!cfg.levantamientoQueue){ctx.toast('El envío del levantamiento no está activado todavía.');return;}
  if(!navigator.onLine){ctx.toast('Sin señal. La anulación necesita cobertura: inténtalo cuando haya señal.');return;}
  if(busy)return;busy=true;render();
  const {F,punto}=ubicar(codigo);
  try{
    const id=randomId(),guardado=new Date().toISOString();
    const cuerpo={version:2,tipo:'anulacion',app:'evidencias',formulario:F.id,id,codigo,comuna:punto.comuna,guardado,registro:cfg.email,piloto:!!cfg.pilot,motivo};
    const path=`${cfg.levantamientoQueue}/${cfg.pilot?'_PILOTO/':''}${punto.comuna}/${codigo}_${guardado.replace(/[:.]/g,'-')}_${id.slice(0,8)}_anulacion.json`;
    await dropbox.api('files/upload',null,{binary:new Blob([JSON.stringify(cuerpo,null,1)],{type:'application/json'}),args:{path,mode:'add',autorename:false,strict_conflict:true}});
    await del('fotos',fotos.filter(f=>f.codigo===codigo).map(f=>f.id));fotos=fotos.filter(f=>f.codigo!==codigo);
    const p={...nuevoPunto(codigo),anulado:{id,at:guardado,path,motivo}};puntos.set(codigo,p);await put('puntos',[p]);
    confirmando=null;ctx.toast(`${codigo} anulado. La planilla se actualiza en el próximo ciclo del servicio.`);
  }catch(error){ctx.toast('No se pudo anular: '+(error.name==='TimeoutError'?'la respuesta tardó demasiado. Reintenta.':error.message));}
  finally{busy=false;render();}
}
async function enviarPendientes(){for(const p of activo().puntos)if(['pending','error'].includes(estadoEnvio(p.codigo).clase))await enviar(p.codigo);}

// The same columns as the form, by header, so the file can be pasted into the planilla if something fails in the field.
function descargarCSV(){
  const F=activo(),fijas=[...F.precargadas,...F.asignacion.filter(h=>!F.precargadas.includes(h))];
  const filas=[[...fijas,...F.campos.map(c=>c.key)]];
  for(const punto of F.puntos){if(!puntos.get(punto.codigo)&&!fotos.some(f=>f.codigo===punto.codigo))continue;const v=valoresCompletos(punto.codigo);
    filas.push([...fijas.map(h=>punto.pre[h]??punto.asignacion?.[h]??''),...F.campos.map(c=>visible(c,punto)?v[c.key]??'':'')]);}
  if(filas.length===1){ctx.toast('Todavía no hay levantamientos de este formulario en el teléfono.');return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv(filas)],{type:'text/csv;charset=utf-8'}));a.download=`Levantamiento_${F.id}_${chileDate()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}

// Drafts saved by the first version (DEC-020 only, values keyed by column letter, photos named lev_L1) still load.
function migrar(p){
  if(p.formulario)return p;
  const F=formulario('DEC-020'),porLetra=Object.fromEntries(F.campos.map(c=>[c.col,c.key]));
  return {...p,formulario:'DEC-020',valores:Object.fromEntries(Object.entries(p.valores||{}).map(([k,v])=>[porLetra[k]??k,v]))};
}

// --- Wiring ---------------------------------------------------------------------------------------------------------
function poblarFiltros(){
  const F=activo();
  $('lev-quien').innerHTML='<option value="">Todos</option>'+C.levantadores.map(n=>`<option${n===filtro.quien?' selected':''}>${esc(n)}</option>`).join('');
  const dias=[...new Set(F.puntos.map(p=>asignado(F,p,'dia')).filter(Boolean))].sort();
  $('lev-dia').innerHTML='<option value="">Todos los días</option>'+dias.map(d=>`<option${d===filtro.dia?' selected':''}>${esc(d)}</option>`).join('');
  $('lev-cerca').hidden=F.tipo!=='via-rapida';
  const comunas=[...new Set(F.puntos.map(p=>p.comuna))].sort();
  if(!comunas.includes(filtro.comuna))filtro.comuna='';
  $('lev-comuna-wrap').hidden=comunas.length<2;
  $('lev-comuna').innerHTML='<option value="">Todas</option>'+comunas.map(c=>`<option${c===filtro.comuna?' selected':''}>${esc(c)}</option>`).join('');
  $('lev-estado').innerHTML='<option value="">Todos</option>'+ESTADOS.filter(([k])=>F.tipo==='via-rapida'||!['via-rapida','largo'].includes(k)).map(([k,t])=>`<option value="${k}"${k===filtro.estado?' selected':''}>${esc(t)}</option>`).join('');
  const clases=ORDEN_CLASIFICACION.filter(c=>F.puntos.some(p=>p.clasificacion===c&&!p.porUbicar));
  if(!clases.includes(filtro.clasif))filtro.clasif='';
  $('lev-clasif-wrap').hidden=!clases.length;
  $('lev-clasif').innerHTML='<option value="">Todas</option>'+clases.map(c=>`<option${c===filtro.clasif?' selected':''}>${esc(c)}</option>`).join('');
}
export async function setupLevantamiento(context){
  ctx=context;
  try{const r=await fetch('/api/evidencias/assets/levantamiento.json');if(!r.ok)throw new Error('No se pudo cargar el formulario de levantamiento.');C=await r.json();}
  catch(error){$('lev-lista').innerHTML=`<p class="form-error">${esc(error.message)}</p>`;return;}
  porCodigo=new Map(C.formularios.flatMap(F=>F.puntos.map(punto=>[punto.codigo,{F,punto}])));
  const guardados=(await all('puntos')).map(migrar).filter(p=>porCodigo.has(p.codigo));guardados.forEach(p=>puntos.set(p.codigo,p));
  fotos=(await all('fotos')).filter(f=>porCodigo.has(f.codigo));
  // Photos from the first version had no sequence number: give them one, in the order they were taken.
  const sinN=fotos.filter(f=>!f.n).sort((a,b)=>a.registeredAt.localeCompare(b.registeredAt));
  for(const f of sinN){f.n=Math.max(0,...fotos.filter(x=>x.codigo===f.codigo&&x.n).map(x=>x.n))+1;f.formulario??='DEC-020';}
  if(sinN.length)await put('fotos',sinN);
  if(!formulario(prefs.formulario))prefs.formulario=C.formularios[0].id;
  $('lev-formulario').innerHTML=C.formularios.map(F=>`<option value="${esc(F.id)}"${F.id===prefs.formulario?' selected':''}>${esc(F.titulo)}</option>`).join('');
  poblarFiltros();
  $('lev-formulario').addEventListener('change',e=>{prefs.formulario=e.target.value;savePrefs();filtro.dia='';poblarFiltros();render();});
  $('lev-quien').addEventListener('change',e=>{filtro.quien=e.target.value;render();});
  $('lev-dia').addEventListener('change',e=>{filtro.dia=e.target.value;render();});
  $('lev-comuna').addEventListener('change',e=>{filtro.comuna=e.target.value;render();});
  $('lev-estado').addEventListener('change',e=>{filtro.estado=e.target.value;render();});
  $('lev-clasif').addEventListener('change',e=>{filtro.clasif=e.target.value;render();});
  $('lev-buscar').addEventListener('input',e=>{filtro.texto=e.target.value;render();});
  $('lev-csv').addEventListener('click',descargarCSV);
  $('lev-enviar-todo').addEventListener('click',enviarPendientes);
  $('lev-cerca').addEventListener('click',async()=>{ctx.toast('Obteniendo ubicación GPS…');const fix=await requestFix(()=>ctx.toast('Ubicación desactivada.'));if(fix){aqui=fix;render();ctx.toast('Lista ordenada por cercanía dentro de cada grupo y nodo.');}});
  const view=$('levantamiento-view');
  view.addEventListener('click',async e=>{
    const tarjeta=e.target.closest('[data-lev-comuna]');
    if(tarjeta){const comuna=tarjeta.dataset.levComuna,F=activo();
      if(filtro.comuna===comuna){filtro.comuna='';}
      else{if(!F.puntos.some(p=>p.comuna===comuna)){const otro=C.formularios.find(x=>x.tipo==='via-rapida'&&x.puntos.some(p=>p.comuna===comuna))??C.formularios.find(x=>x.puntos.some(p=>p.comuna===comuna));prefs.formulario=otro.id;savePrefs();$('lev-formulario').value=otro.id;filtro.dia='';}
        filtro.comuna=comuna;}
      poblarFiltros();render();return;}
    const t=e.target.closest('[data-lev-abrir],[data-lev-volver],[data-lev-gps],[data-lev-foto],[data-lev-quitar],[data-lev-enviar],[data-lev-confirmar],[data-lev-descartar],[data-lev-anular]');if(!t)return;
    if(t.dataset.levAbrir){abierto=t.dataset.levAbrir;confirmando=null;render();window.scrollTo({top:0,behavior:'instant'});}
    else if('levVolver'in t.dataset){abierto=null;confirmando=null;render();}
    else if('levConfirmar'in t.dataset){confirmando=t.dataset.levConfirmar||null;render();if(confirmando)document.querySelector('.lev-confirmar')?.scrollIntoView({behavior:'smooth',block:'center'});}
    else if('levDescartar'in t.dataset)await descartar(abierto);
    else if('levAnular'in t.dataset)await anular(abierto,$('lev-motivo').value.trim());
    else if(t.dataset.levGps)await tomarGps(t.dataset.levGps);
    else if(t.dataset.levFoto){const [toma,origen]=t.dataset.levFoto.split('|');const input=document.createElement('input');input.type='file';input.accept='image/*';if(origen==='camera')input.capture='environment';else input.multiple=true;input.onchange=()=>agregarFotos(toma,[...input.files],origen);input.click();}
    else if(t.dataset.levQuitar){const id=t.dataset.levQuitar;await del('fotos',[id]);fotos=fotos.filter(f=>f.id!==id);render();}
    else if('levEnviar'in t.dataset)await enviar(abierto);
  });
  view.addEventListener('toggle',e=>{if(e.target.classList?.contains('lev-mas')){prefs.abrirResto=e.target.open;savePrefs();}},true);
  view.addEventListener('input',e=>{const clave=e.target.dataset?.levCampo;if(!clave)return;clearTimeout(guardarTimer);const valor=e.target.value;guardarTimer=setTimeout(()=>guardarCampo(clave,valor),300);});
  view.addEventListener('change',async e=>{const clave=e.target.dataset?.levCampo;if(!clave)return;clearTimeout(guardarTimer);if(await guardarCampo(clave,e.target.value))render();else actualizarEstado(e.target);});
  render();cargarOficina();
}
export function showLevantamiento(){abierto=null;confirmando=null;render();cargarOficina();}
