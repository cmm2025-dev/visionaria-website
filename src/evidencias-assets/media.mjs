// Photo handling shared by the evidence capture and the levantamiento: stamp, shrink, geotag and locate.
// This is a verification control, not forensic photography -- resolution past this is never needed,
// and shrinking every photo keeps uploads fast on weak field signal.
const MAX_DIMENSION=1600,JPEG_QUALITY=0.8;
// Where the position came from: the camera at capture, the photo's own GPS (a gallery photo that kept it), or the phone
// when a gallery photo was added (not where it was shot) -- the stamp says which.
export function gpsLabel(gps,source){if(!gps)return 'Sin GPS';const rotulo=source==='gallery'?'Ubicación al registrar':source==='foto'?'GPS original de la foto':'GPS';return `${rotulo} ${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}${gps.accuracy!=null?` ±${gps.accuracy} m`:''}`;}
// A photo taken outside the app (the phone's camera, then the gallery) keeps when and where it was shot in its EXIF:
// read the original date and time (DateTimeOriginal, the camera's local time) and GPS, if the phone kept them. Android
// may withhold the GPS from the browser for privacy; the date usually survives. Nothing here throws.
export async function datosOriginales(file){
  try{
    const v=new DataView(await file.slice(0,256*1024).arrayBuffer());
    if(v.byteLength<4||v.getUint16(0)!==0xFFD8)return {tomadaEn:null,gps:null};
    for(let o=2;o+10<v.byteLength;){
      const marca=v.getUint16(o),largo=v.getUint16(o+2);
      if((marca&0xFF00)!==0xFF00)break;
      if(marca===0xFFE1&&v.getUint32(o+4)===0x45786966)return leerTiff(v,o+10);
      o+=2+largo;
    }
  }catch{}
  return {tomadaEn:null,gps:null};
}
function leerTiff(v,t){
  const le=v.getUint16(t)===0x4949,u16=p=>v.getUint16(p,le),u32=p=>v.getUint32(p,le);
  const ifd=p=>{const n=u16(p),out={};for(let i=0;i<n;i++){const e=p+2+i*12;out[u16(e)]={count:u32(e+4),val:e+8};}return out;};
  const texto=e=>{const off=e.count>4?t+u32(e.val):e.val;let s='';for(let i=0;i<e.count-1;i++)s+=String.fromCharCode(v.getUint8(off+i));return s;};
  const racionales=e=>{const off=t+u32(e.val),r=[];for(let i=0;i<e.count;i++){const d=u32(off+i*8+4);r.push(d?u32(off+i*8)/d:NaN);}return r;};
  const fecha=s=>{const m=String(s).match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);return m&&m[1]!=='0000'?`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`:null;};
  const cero=ifd(t+u32(t+4));let tomadaEn=null,gps=null;
  if(cero[0x8769]){const ex=ifd(t+u32(cero[0x8769].val)),d=ex[0x9003]??ex[0x9004];if(d)tomadaEn=fecha(texto(d));}
  if(!tomadaEn&&cero[0x0132])tomadaEn=fecha(texto(cero[0x0132]));
  if(cero[0x8825]){const g=ifd(t+u32(cero[0x8825].val));
    if(g[2]&&g[4]){const gms=a=>a[0]+a[1]/60+a[2]/3600,ref=e=>e?String.fromCharCode(v.getUint8(e.val)):'';
      let lat=gms(racionales(g[2])),lon=gms(racionales(g[4]));if(ref(g[1])==='S')lat=-lat;if(ref(g[3])==='W')lon=-lon;
      if(Number.isFinite(lat)&&Number.isFinite(lon)&&(lat||lon))gps={lat:Math.round(lat*1e6)/1e6,lon:Math.round(lon*1e6)/1e6,accuracy:null};}}
  return {tomadaEn,gps};
}
// Resize, burn in the visible stamp and re-encode in a single pass, so there is only one generation of JPEG loss.
export function processImage(file,lines){
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
export async function withExif(blob,gps){
  const bytes=new Uint8Array(await blob.arrayBuffer());if(bytes[0]!==0xFF||bytes[1]!==0xD8)return blob;
  const at=bytes[2]===0xFF&&bytes[3]===0xE0?4+((bytes[4]<<8)|bytes[5]):2;
  return new Blob([bytes.slice(0,at),exifGps(gps),bytes.slice(at)],{type:'image/jpeg'});
}
// One GPS fix for the photo or field being captured. onDenied runs when the user blocked location access.
export function requestFix(onDenied=()=>{}){
  if(!navigator.geolocation)return Promise.resolve(null);
  return new Promise(resolve=>navigator.geolocation.getCurrentPosition(
    p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:Math.round(p.coords.accuracy),at:new Date().toISOString()}),
    error=>{if(error.code===1)onDenied();resolve(null);},
    {enableHighAccuracy:true,timeout:15000,maximumAge:30000}));
}
