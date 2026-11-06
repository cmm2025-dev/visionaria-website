// Fibra óptica: the planilla «Tendido FO» rules, as pure functions. Each one is the literal translation of the formula
// in the planilla (Ruta «Control» and «Permisos del tramo», Apoyos «Control» and «Veredicto», Tendido «Metros tendidos»,
// and «Estado de calidad» of Tendido, Mufas, Reservas and Derivaciones), with the same texts and in the same order.
// Values are keyed by header; thresholds come from the sheet «Parámetros» through the contract (C.parametros), never
// from here. The planilla stays the reference: the parity test fills a copy, recalculates it and compares.
//
// Spreadsheet semantics kept on purpose: an empty cell is ''; N() of anything that is not a number is 0; ISNUMBER is
// true only for numbers (numeric fields are stored as numbers, as the writer writes them).

const lleno=x=>x!==undefined&&x!==null&&String(x).length>0;
const N=x=>typeof x==='number'&&Number.isFinite(x)?x:0;
const esNumero=x=>typeof x==='number'&&Number.isFinite(x);
const vacios=(v,claves)=>claves.filter(k=>!lleno(v[k])).length;

export function parametro(C,clave){const p=C.parametros[C.claves[clave]];return N(p?.valor);}
const columnas=(C,hoja,rol)=>C.hojas[hoja].campos.filter(c=>c.rol===rol).map(c=>c.key);
const algo=(v,claves)=>claves.some(k=>lleno(v[k]));

// --- Levantamiento previo -----------------------------------------------------------------------------------------
export function rutaControl(C,v,aptos){
  if(!algo(v,columnas(C,'Ruta','amarillo')))return 'Sin levantar';
  if(vacios(v,['Fecha','Levantó','Recorrido frente al diseño','¿Cruza una ruta o carretera?','Autoridad además de CGE','Fotos tomadas (N°)','¿Hay que volver?'])>0)return 'Faltan datos';
  if(v['¿Cruza una ruta o carretera?']==='Sí'&&!lleno(v['Ruta cruzada']))return 'Falta la ruta cruzada';
  if(N(v['Fotos tomadas (N°)'])<parametro(C,'fotosRuta'))return 'Faltan fotos';
  if(v['Recorrido frente al diseño']==='No factible')return 'Revisar: trazado no factible';
  if(N(aptos)===0&&N(v['Tramo sin postes (m)'])===0)return 'Faltan apoyos';
  return 'OK';
}
export function rutaPermisos(C,v,control){
  if(control==='Sin levantar')return '';
  const a=v['Autoridad además de CGE'];
  if(!lleno(a))return 'Incompleto';
  if(v['¿Cruza una ruta o carretera?']==='Sí'||a==='Vialidad'||a==='Concesionaria')return 'CGE y Vialidad o concesionaria';
  if(a==='SERVIU'||N(v['Tramo sin postes (m)'])>0)return 'CGE y canalización (DOM o SERVIU)';
  if(a==='Municipio (BNUP)')return 'CGE y municipio';
  if(a==='Otra'||a==='No se sabe')return 'CGE y otra autoridad';
  return 'Solo CGE';
}
const cruceBajo=(C,cruce,altura)=>(cruce==='Calle o pasaje'&&N(altura)<parametro(C,'calles'))||((cruce==='Avenida'||cruce==='Ruta o carretera')&&N(altura)<parametro(C,'avenidas'));
export function apoyoControl(C,v){
  if(!algo(v,columnas(C,'Apoyos','amarillo')))return 'Sin levantar';
  if(v['¿Se encontró el poste?']==='No se encontró')return vacios(v,['Fecha','Levantó','Tramo levantado'])>0?'Faltan datos':'No encontrado';
  if(vacios(v,['Fecha','Levantó','Tramo levantado','Latitud medida','Longitud medida','¿Se encontró el poste?','Placa en terreno','Propietario u operador','Material',
    'Altura del poste (m)','Redes eléctricas en el poste','Espacio para la fibra','Estado físico','Función para la fibra','Cruce en el vano siguiente','Usar como apoyo',
    'Fotos tomadas (N°)','¿Hay que volver?'])>0)return 'Faltan datos';
  if(v['Usar como apoyo']==='No'&&!lleno(v['Motivo si no se usa']))return 'Falta el motivo';
  if(v['Cruce en el vano siguiente']!=='Ninguno'&&!lleno(v['Altura libre prevista en el cruce (m)']))return 'Falta altura del cruce';
  if(N(v['Fotos tomadas (N°)'])<parametro(C,'fotosApoyo'))return 'Faltan fotos';
  if(cruceBajo(C,v['Cruce en el vano siguiente'],v['Altura libre prevista en el cruce (m)']))return 'Cruce: altura bajo el mínimo';
  if(v['Usar como apoyo']==='Sí'&&(v['Estado físico']!=='Bueno'||v['Espacio para la fibra']==='No'))return 'Revisar: apoyo con problemas';
  return 'OK';
}
export function apoyoVeredicto(C,v,control){
  if(control==='Sin levantar')return '';
  if(control==='No encontrado')return 'No encontrado';
  if(v['Usar como apoyo']==='No')return 'No apto';
  if((lleno(v['Estado físico'])&&v['Estado físico']!=='Bueno')||v['Espacio para la fibra']==='No')return v['Usar como apoyo']==='Sí'?'A revisar':'No apto';
  if(v['Usar como apoyo']==='A revisar'||v['Espacio para la fibra']==='Dudoso')return 'A revisar';
  if(control!=='OK')return 'Incompleto';
  return 'Apto';
}

// --- Calidad de ejecución ------------------------------------------------------------------------------------------
export function metrosTendidos(v){const a=v['Metraje inicial (m)'],b=v['Metraje final (m)'];return esNumero(a)&&esNumero(b)?Math.abs(b-a):'';}

// The first eight steps are the same in the four sheets; only the required fields, the photo minimum and the
// result/findings headers change. Then each sheet adds its technical «Revisar» checks, in the planilla's order.
function estadoComun(C,hoja,v,{ejecucion,fotosEjecucion,minEjecucion,inspeccion,fotosInspeccion}){
  const amarillas=columnas(C,hoja,'amarillo'),verdes=columnas(C,hoja,'verde');
  if(!algo(v,amarillas)&&!algo(v,verdes))return 'Sin ejecutar';
  if(vacios(v,ejecucion)>0)return 'Faltan datos de ejecución';
  if(N(v[fotosEjecucion])<parametro(C,minEjecucion))return 'Faltan fotos de ejecución';
  if(!algo(v,verdes))return 'Falta inspección';
  const resultado=v['Resultado'];
  if(vacios(v,inspeccion)+((resultado==='Observado'||resultado==='Rechazado')&&!lleno(v['Hallazgos'])?1:0)>0)return 'Faltan datos de inspección';
  if(N(v[fotosInspeccion])<parametro(C,'fotosInspeccion'))return 'Faltan fotos de inspección';
  if(resultado==='Rechazado')return 'Rechazado';
  if(resultado==='Observado')return 'Observado';
  return null;
}
export function estadoTendido(C,v){
  const e=estadoComun(C,'Tendido',v,{ejecucion:['Fecha de tendido','Ejecutó (empresa y cuadrilla)','Registró','Cable instalado (modelo)','Metraje inicial (m)','Metraje final (m)',
      'Apoyos usados (N°)','Herrajes de suspensión (N°)','Herrajes de retención (N°)','Reservas dejadas (N°)','Etiquetas instaladas','Daños en la cubierta','Fotos de ejecución (N°)'],
    fotosEjecucion:'Fotos de ejecución (N°)',minEjecucion:'fotosTendido',
    inspeccion:['Fecha de inspección','Inspeccionó','Recorrido del tramo','Altura libre mínima medida (m)','Cruce de esa medición','Separación a la red eléctrica',
      'Herrajes y fijaciones','Curvaturas y flecha','Etiquetado','Restos o cables abandonados','Resultado'],fotosInspeccion:'Fotos de inspección (N°)'});
  if(e)return e;
  if(!lleno(v['Autorización de apoyo (N° y fecha)']))return 'Revisar: sin autorización de apoyo';
  if(cruceBajo(C,v['Cruce de esa medición'],v['Altura libre mínima medida (m)']))return 'Revisar: gálibo bajo el mínimo';
  if(v['Daños en la cubierta']==='Sí: sin reparar')return 'Revisar: cable dañado';
  if(v['Etiquetas instaladas']!=='Todas')return 'Revisar: etiquetado incompleto';
  if(v['Separación a la red eléctrica']==='No conforme'||v['Herrajes y fijaciones']==='No conforme'||v['Curvaturas y flecha']==='No conforme'||v['Etiquetado']!=='Conforme'||v['Restos o cables abandonados']==='Sí')return 'Revisar: ítem no conforme';
  return 'Conforme';
}
export function estadoMufa(C,v){
  const e=estadoComun(C,'Mufas',v,{ejecucion:['Fecha','Ejecutó (empresa y cuadrilla)','Registró','Modelo de mufa','Latitud','Longitud','Instalada en','Bandejas usadas (N°)',
      'Fusiones realizadas (N°)','Pérdida máxima por fusión (dB)','Sellado','Reserva en la mufa (m)','Rótulo instalado','Mapa de fusiones (archivo)','Fotos de ejecución (N°)'],
    fotosEjecucion:'Fotos de ejecución (N°)',minEjecucion:'fotosMufa',
    inspeccion:['Fecha de inspección','Inspeccionó','Cierre hermético','Bandejas y curvaturas','Fusiones según el plan de derivación','Rótulo','Fijación y reserva','Resultado'],
    fotosInspeccion:'Fotos de inspección (N°)'});
  if(e)return e;
  if(v['Rótulo instalado']==='No')return 'Revisar: sin rótulo';
  if(N(v['Pérdida máxima por fusión (dB)'])>parametro(C,'fusionMax'))return 'Revisar: fusión sobre el máximo';
  if(esNumero(v['Fusiones previstas (N°)'])&&N(v['Fusiones realizadas (N°)'])!==N(v['Fusiones previstas (N°)']))return 'Revisar: fusiones distintas a la ingeniería';
  if(v['Fusiones según el plan de derivación']!=='Sí')return 'Revisar: fusiones sin plan o fuera del plan';
  if(['Cierre hermético','Bandejas y curvaturas','Rótulo','Fijación y reserva'].some(k=>v[k]==='No conforme'))return 'Revisar: ítem no conforme';
  return 'Conforme';
}
export function estadoReserva(C,v){
  const e=estadoComun(C,'Reservas',v,{ejecucion:['Fecha','Ejecutó (empresa y cuadrilla)','Registró','Latitud','Longitud','Longitud dejada (m)','Forma','Fijación','Rótulo instalado','Fotos de ejecución (N°)'],
    fotosEjecucion:'Fotos de ejecución (N°)',minEjecucion:'fotosReserva',
    inspeccion:['Fecha de inspección','Inspeccionó','Longitud verificada','Curvatura','Fijación y rótulo','Resultado'],fotosInspeccion:'Fotos de inspección (N°)'});
  if(e)return e;
  if(v['Rótulo instalado']==='No')return 'Revisar: sin rótulo';
  if(esNumero(v['Longitud de diseño (m)'])&&N(v['Longitud dejada (m)'])<v['Longitud de diseño (m)'])return 'Revisar: reserva menor a la ingeniería';
  if(v['Forma']!=='En cámara'&&N(v['Diámetro de la coca (cm)'])<parametro(C,'cocaMin'))return 'Revisar: diámetro bajo el mínimo';
  if(['Longitud verificada','Curvatura','Fijación y rótulo'].some(k=>v[k]==='No conforme'))return 'Revisar: ítem no conforme';
  return 'Conforme';
}
export function estadoDerivacion(C,v){
  const e=estadoComun(C,'Derivaciones',v,{ejecucion:['Fecha','Ejecutó (empresa y cuadrilla)','Registró','Cable de bajada (modelo)','Longitud instalada (m)','Roseta SC/PC instalada',
      'Pelos rematados (N°)','Pelos oscuros de reserva (N°)','Rotulado en roseta y ODF','Pérdida a 1310 nm (dB)','Pérdida a 1550 nm (dB)','Archivo OTDR','Fotos de ejecución (N°)'],
    fotosEjecucion:'Fotos de ejecución (N°)',minEjecucion:'fotosDerivacion',
    inspeccion:['Fecha de inspección','Inspeccionó','Pelos según el plan','Roseta y rótulo','Traza OTDR revisada','Resultado'],fotosInspeccion:'Fotos de inspección (N°)'});
  if(e)return e;
  if(v['Roseta SC/PC instalada']==='No')return 'Revisar: sin roseta SC/PC';
  if(N(v['Pelos oscuros de reserva (N°)'])<parametro(C,'pelosOscuros'))return 'Revisar: menos pelos oscuros que las bases';
  if(v['Rotulado en roseta y ODF']!=='Sí')return 'Revisar: rotulado incompleto';
  if(!esNumero(v['Pérdida máxima aceptada (dB)']))return 'Revisar: sin presupuesto de pérdida';
  if(Math.max(N(v['Pérdida a 1310 nm (dB)']),N(v['Pérdida a 1550 nm (dB)']))>N(v['Pérdida máxima aceptada (dB)']))return 'Revisar: pérdida sobre el presupuesto';
  if(v['Pelos según el plan']==='No')return 'Revisar: pelos fuera del plan';
  if(v['Roseta y rótulo']==='No conforme'||v['Traza OTDR revisada']==='No conforme')return 'Revisar: ítem no conforme';
  return 'Conforme';
}
export const ESTADO={Tendido:estadoTendido,Mufas:estadoMufa,Reservas:estadoReserva,Derivaciones:estadoDerivacion};
