export const COMMUNES = ['Antofagasta', 'Calama', 'Tocopilla'];
export const ACTIVITIES = [
  ['Excavación','excavacion','Etapa'],['Hormigón','hormigon','Etapa'],['Izaje','izaje','Etapa'],['Grout','grout','Etapa'],['Preempalme','preempalme','Etapa'],['Conexión eléctrica','conexion','Etapa'],['Montaje tecnología','montaje','Etapa'],['Fusión FO','fusion','Etapa'],['Operativo','operativo','Etapa'],
  ['Bloqueo','bloqueo','Novedad'],['Accidente o incidente','incidente','Novedad'],['Permiso o inspección','permiso','Novedad'],['Interferencia','interferencia','Novedad'],['Vecinos o comunidad','vecinos','Novedad'],['Clima','clima','Novedad'],['Material o equipo','material','Novedad'],['Visita o reunión','visita','Novedad'],['Otro','otro','Novedad']
].map(([label,slug,type])=>({label,slug,type}));
// Labels and slugs mirror the planilla de terreno (sheet «Listas», columns Hecho and Archivo): the planilla
// rebuilds each photo name from them, so any drift here leaves the photo unmatched.
export const EXECUTORS = ['Equipo propio','Cuadrilla OOCC propia','Contratista OOCC','Contratista fibra','Contratista eléctrico','Distribuidora','Otro'];
export function chileDate(date=new Date()) {
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=t=>p.find(x=>x.type===t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function normalize(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
export function randomId(){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export function filename(base,index,extension='jpg'){if(!Number.isInteger(index)||index<1)throw new Error('Índice inválido');return `${base}${index===1?'':`_${index}`}.${extension}`;}
export function baseName(point,date,slug){if(!/^[A-Z0-9-]+$/.test(point)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||! /^[a-z0-9_]+$/.test(slug))throw new Error('Datos de nombre inválidos');return `${point}_${date}_${slug}`;}
export function extensionFor(file){const map={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'};if(!map[file.type])throw new Error('Usa fotografías JPG, PNG, WEBP, HEIC o HEIF.');return map[file.type];}
export function folderFor(root,commune){if(!COMMUNES.includes(commune))throw new Error('Comuna inválida');const clean=root.trim().replace(/\/+$/,'');if(!clean.startsWith('/')||clean.includes('..')||/[\\\u0000-\u001f]/.test(clean))throw new Error('La raíz debe comenzar con / y no contener .. ni barras invertidas.');return `${clean}/${commune}/Fotos`;}
export function validateCapture(meta,points,{today=chileDate()}={}){
  if(!COMMUNES.includes(meta.commune))throw new Error('Selecciona una comuna.');
  const act=ACTIVITIES.find(a=>a.label===meta.activity);if(!act)throw new Error('Selecciona una actividad.');
  const point=points.find(p=>p.code===meta.point&&p.commune===meta.commune);
  if(meta.point!=='GENERAL'&&!point)throw new Error('Selecciona un punto del catálogo.');
  if(meta.point==='GENERAL'&&act.type==='Etapa')throw new Error('Una etapa requiere un punto específico.');
  if(point&&/por definir/i.test(point.situation)&&act.type==='Etapa')throw new Error('Este punto requiere confirmación de la Dirección antes de registrar una etapa.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)||Number.isNaN(Date.parse(meta.date))||new Date(meta.date+'T12:00:00Z').toISOString().slice(0,10)!==meta.date||meta.date>today)throw new Error('La fecha del hecho debe ser válida y no futura.');
  if(!meta.author?.trim())throw new Error('Indica quién toma las fotografías.');
  if(act.type==='Etapa'&&!meta.executor)throw new Error('Indica quién ejecutó la etapa.');
  if(meta.executor&&!EXECUTORS.includes(meta.executor))throw new Error('Selecciona quién ejecutó desde la lista.');
  if(act.type==='Novedad'&&!meta.note?.trim())throw new Error('Describe brevemente la novedad.');
  return act;
}
export function csv(rows){const cell=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n');}
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export async function makeZip(files){
  const enc=new TextEncoder(),parts=[],central=[];let offset=0,centralSize=0;
  for(const file of files){const name=enc.encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer()),crc=crc32(data);const local=new Uint8Array(30+name.length),v=new DataView(local.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.set(name,30);
    const c=new Uint8Array(46+name.length),d=new DataView(c.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);c.set(name,46);parts.push(local,data);central.push(c);offset+=local.length+data.length;centralSize+=c.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
}
// Installation photo protocol requested by Operaciones (camera pole diagram). Slugs sort in diagram order.
// Each shot is tied to the stage where it is still visible: grounding gets buried, connector and teflon get sealed.
// `quality` is the name the planilla's «Calidad» sheet expects for that record (PUNTO_fecha_<quality>).
export const PROTOCOL = [
  {code:'1.1',group:'General',label:'Panorámica',slug:'11_general_panoramica',stage:'al quedar operativo'},
  {code:'2.1',group:'Antena',label:'Hacia donde está orientada',slug:'21_antena_orientacion',stage:'al quedar operativo',antenna:true},
  {code:'2.2',group:'Antena',label:'Copla (prensa)',slug:'22_antena_copla',stage:'en el montaje de tecnología',antenna:true},
  {code:'3.1',group:'Cámara',label:'Panorámica',slug:'31_camara_panoramica',stage:'al quedar operativo'},
  {code:'3.2',group:'Cámara',label:'Conector',slug:'32_camara_conector',stage:'en conexión eléctrica o montaje, antes de sellar'},
  {code:'3.3',group:'Cámara',label:'Teflón',slug:'33_camara_teflon',stage:'en conexión eléctrica o montaje, antes de sellar'},
  {code:'4',group:'Gabinete eléctrico',label:'Gabinete eléctrico',slug:'40_gabinete',quality:'gabinete',stage:'en la conexión eléctrica'},
  {code:'5',group:'Tierra de protección',label:'Tierra de protección',slug:'50_tierra',stage:'en excavación u hormigón, antes de cubrir'},
];
