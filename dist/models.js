import * as T from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
const supplied=new Map();
async function loadSupplied(name){
 if(!supplied.has(name))supplied.set(name,new GLTFLoader().loadAsync(new URL('./models/'+name+'.glb',import.meta.url).href).then(gltf=>{gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedAsset=true;}});return gltf.scene;}).catch(error=>{supplied.delete(name);throw error;}));
 return supplied.get(name);
}
let unoTemplate,servoTemplate;

const C={pcb:0x167d76,black:0x182a29,metal:0xb6c7c5,gold:0xdfbc65,blue:0x3277b2,white:0xf5f5e8,lime:0xbafa68};
function mat(c,metal=0){return new T.MeshStandardMaterial({color:c,metalness:metal,roughness:metal?.34:.6})}
function box(g,w,h,d,x,y,z,c){let m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c,c===C.metal?.65:0));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function cyl(g,r,h,x,y,z,c){let m=new T.Mesh(new T.CylinderGeometry(r,r,h,32),mat(c,c===C.metal?.65:0));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
function wire(g,points,c,r=.022){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,30,r,7,false),mat(c));g.add(m);return m}
function label(g,text,x,y,z,size=.3,color='#e4eee2'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 65px Arial';ctx.fillText(text,256,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(size*4,size),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);g.add(m);return m}
function headers(g,x,z,count){box(g,.15,.19,count*.14,x,.21,z,C.black);for(let i=0;i<count;i++){box(g,.055,.015,.065,x,.312,z+(i-(count-1)/2)*.14,C.gold)}}
function arduino(){return unoTemplate.clone(true)}
function servo(){return servoTemplate.clone(true)}
function rain(){const g=new T.Group();box(g,1.7,.09,2.2,-.4,.1,0,0x233a39);for(let i=0;i<13;i++){box(g,1.4,.015,.036,-.4,.154,-.93+i*.15,C.metal);box(g,.035,.015,.1,i%2?-.98:.18,.155,-.88+i*.15,C.metal)}box(g,.7,.09,1.25,1.1,.1,.1,C.pcb);box(g,.28,.25,.3,1.1,.27,-.22,C.blue);cyl(g,.06,.02,1.1,.404,-.22,C.metal);box(g,.2,.1,.4,1.1,.2,.24,C.black);for(let i=0;i<4;i++)box(g,.035,.04,.32,.88+i*.14,.13,.87,C.gold);wire(g,[[.3,.18,-.95],[.8,.2,-1.2],[1.2,.2,-.55]],0xdc5c37);wire(g,[[.35,.18,-.8],[.9,.2,-1],[1.1,.2,-.55]],C.black);return g}
function ultrasonic(){const g=new T.Group();box(g,2.5,.12,1.15,0,.1,0,C.pcb);for(const x of [-.7,.7]){cyl(g,.44,.45,x,.39,0,C.metal);cyl(g,.365,.015,x,.624,0,0x455957);for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){if(i*i+j*j<12)cyl(g,.013,.006,x+i*.085,.637,j*.085,0x9fb0a7)}}for(let i=0;i<4;i++)box(g,.035,.06,.48,-.25+i*.16,.12,.7,C.gold);label(g,'ULTRASSÔNICO',0,.171,-.45,.11);return g}
function shield(){let g=new T.Group();box(g,2.3,.12,2.85,0,.08,0,0x267a48);for(let x of [-.91,.91]){headers(g,x,0,16);for(let i=0;i<16;i++)box(g,.045,.37,.045,x,-.15,(i-7.5)*.14,C.gold)}for(let i=0;i<3;i++)for(let j=0;j<10;j++)cyl(g,.035,.22,-.37+i*.17,.23,-.8+j*.17,[C.black,0xe3b844,0xdc553d][i]);box(g,.5,.3,.4,.4,.3,1.03,C.blue);label(g,'SHIELD',.45,.15,-1.16,.18);return g}
function power(){const g=new T.Group();box(g,1.5,.65,2.1,0,.4,0,C.black);box(g,1.4,.01,1.3,0,.731,0,0x41534c);label(g,'FONTE',0,.744,-.1,.24);label(g,'ALIMENTAÇÃO',0,.744,.27,.12);wire(g,[[0,.4,-1],[.2,.25,-1.7],[1.2,.15,-1.5],[1.5,.16,0]],C.black,.04);let plug=cyl(g,.1,.35,1.5,.16,.14,C.metal);plug.rotation.x=Math.PI/2;return g}
function jumpers(){const g=new T.Group();for(let i=0;i<6;i++){const x=(i-2.5)*.32;wire(g,[[x,.14,-1.2],[x+.1,.3,-.6],[x-.1,.35,.5],[x+.18,.14,1.25]],[0xb74336,0xe1b642,0x2a7fab,0x3a925c,0x31383b,0xd2dbcf][i],.038);box(g,.12,.14,.35,x,.14,-1.25,C.black);box(g,.04,.04,.25,x,.14,-1.5,C.gold);box(g,.12,.14,.35,x+.18,.14,1.25,C.black);box(g,.04,.04,.25,x+.18,.14,1.5,C.gold)}return g}
function gate(){
 const g=new T.Group(),steel=0x344b50,stone=0xb7bdb6;
 box(g,6.6,.18,5.5,0,0,.8,0x718078);
 // Paving joints and entrance curb.
 for(let x=-3;x<3.3;x+=.55)for(let z=-1.65;z<3.5;z+=.68)box(g,.525,.027,.655,x,.104,z,((Math.round(x*20)+Math.round(z*20))%3)?0x9da59c:0xadb1a7);
 for(const x of [-2.16,2.16]){
   box(g,.43,2.48,.5,x,1.35,0,stone);box(g,.55,.11,.63,x,2.63,0,0x5a6e64);
   box(g,.55,.13,.63,x,.2,0,0x66776d);
   for(let y=.5;y<2.5;y+=.3)box(g,.434,.012,.505,x,y,0,0x89958b);
 }
 for(const x of [-2.85,2.85]){box(g,.95,1.25,.35,x,.82,0,0xa8b1a5);box(g,1.02,.08,.45,x,1.48,0,0x667a6c)}
 const pivot=new T.Group();pivot.position.set(-1.92,.3,0);
 for(let y of [.04,1.95])box(pivot,3.82,.13,.15,1.91,y,0,steel);
 for(let x of [.04,3.78])box(pivot,.13,2.05,.15,x,.99,0,steel);
 for(let x=.24;x<3.7;x+=.235){box(pivot,.135,1.85,.08,x,1,0,steel);box(pivot,.012,1.82,.012,x-.05,1,.046,0x64767b)}
 box(pivot,3.64,.16,.17,1.91,.62,0,steel);
 box(pivot,.085,.36,.08,3.58,1.12,.13,C.metal);
 for(let y of [.16,1.77]){cyl(g,.085,.3,-1.96,y+.3,0,C.metal);box(pivot,.22,.09,.2,.08,y,0,steel)}
 g.add(pivot);
 // SG90 model and a visible pivot linkage illustrate the actuation.
 const s=servo();s.scale.setScalar(.36);s.position.set(-2.35,.38,-.46);g.add(s);
 const crank=new T.Group();crank.position.set(-1.96,.37,0);box(crank,.68,.065,.09,.25,0,0,C.metal);cyl(crank,.07,.08,.56,0,0,C.gold);g.add(crank);
 const sensor=ultrasonic();sensor.scale.setScalar(.22);sensor.rotation.x=Math.PI/2;sensor.position.set(2.16,1.5,.31);g.add(sensor);
 box(g,.48,.36,.13,2.16,1.47,.255,0x1e302e);
 const beacon=cyl(g,.1,.12,2.16,2.75,0,0xdca347);
 const person=new T.Group();
 cyl(person,.19,.65,0,.7,0,0x6f9b6e);
 for(let x of [-.11,.11]){cyl(person,.065,.43,x,.22,0,0x304950);box(person,.12,.08,.23,x,.035,.05,0x283b3c)}
 for(let x of [-.26,.26])cyl(person,.057,.53,x,.69,0,0x6f9b6e);
 const head=new T.Mesh(new T.SphereGeometry(.16,24,20),mat(0xd6b998));head.position.y=1.2;person.add(head);person.position.set(1.42,.13,3);g.add(person);
 const waves=new T.Group();for(let i=0;i<3;i++){const pts=[];for(let k=0;k<=36;k++){const a=-.7+k/36*1.4;pts.push([2.16+Math.sin(a)*(.42+i*.28),1.5,.36+Math.cos(a)*(.42+i*.28)])}wire(waves,pts,0x9ddc71,.012)}g.add(waves);waves.visible=false;
 return {g,pivot,person,crank,waves,beacon};
}
function clothesline(){let g=new T.Group();box(g,5.8,.13,3.8,0,.01,0,0xbac9ae);for(let x of [-2.6,-.5])for(let z of [-1.4,1.4])box(g,.09,2.6,.09,x,1.35,z,0x738c76);box(g,2.5,.12,3.35,-1.6,2.72,0,0xeceee1);for(let z of [-.95,.95])box(g,4.8,.055,.06,0,2.1,z,C.metal);const rack=new T.Group();for(let x of [-.7,.7])box(rack,.06,.06,2,x,0,0,C.black);for(let z of [-.82,0,.82]){box(rack,1.4,.025,.025,0,0,z,C.metal);box(rack,.68,.74,.025,-.1,-.39,z,z===0?0xebeedd:0x6b9d83);box(rack,.04,.08,.06,-.35,-.015,z,C.gold);box(rack,.04,.08,.06,.12,-.015,z,C.gold)}rack.position.set(1.5,2.08,0);g.add(rack);let se=servo();se.scale.setScalar(.27);se.position.set(-2.4,2.2,1.15);g.add(se);const drops=new T.Group();for(let i=0;i<45;i++){const drop=box(drops,.016,.13,.016,.05+((i*37)%100)/40,2.8+((i*13)%100)/90,((i*23)%100)/35-1.4,0x609fbd);drop.userData.y=drop.position.y}g.add(drops);drops.visible=false;return{g,rack,drops}}
export async function mount(el,slide,component){
 const loading=document.createElement('div');loading.className='model-loading';loading.textContent='Carregando modelo 3D…';el.appendChild(loading);
 try{if(slide===4&&component===0)unoTemplate=await loadSupplied('arduino-uno');else if(slide!==4||component===1)servoTemplate=await loadSupplied('servo-sg90');}catch(error){loading.remove();throw error}
 loading.remove();
 if(!el.isConnected)return {dispose(){}};
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xdfe6db,1);el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label',slide===4?'Modelo 3D do componente selecionado':'Modelo 3D conceitual do protótipo');const scene=new T.Scene();const camera=new T.PerspectiveCamera(36,1,.1,100);scene.add(new T.HemisphereLight(0xffffff,0x6e846d,3));const light=new T.DirectionalLight(0xfffae8,4);light.position.set(3,7,5);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-8,right:8,top:8,bottom:-8});light.shadow.bias=-.001;scene.add(light);const root=new T.Group();scene.add(root);let gateModel=null,varal=null;const isComponent=slide===4;let radius=isComponent?8:slide===0?15:slide===3?12.5:11;let yaw=slide===3?.4:.65,pitch=slide===3?.43:.65;let focus=isComponent?(component===1?.6:.1):1;let active=0,amount=0;
if(isComponent){root.add([arduino,servo,rain,ultrasonic,shield,power,jumpers][component]())}else if(slide===3){gateModel=gate();root.add(gateModel.g)}else if(slide===2){varal=clothesline();root.add(varal.g)}else{varal=clothesline();varal.g.position.set(-1.4,0,-1);varal.g.scale.setScalar(.9);root.add(varal.g);gateModel=gate();gateModel.g.position.set(1.4,0,1.7);gateModel.g.scale.setScalar(.75);root.add(gateModel.g)}
const floor=new T.Mesh(new T.PlaneGeometry(200,200),mat(0xdfe6db));floor.rotation.x=-Math.PI/2;floor.position.y=isComponent?-.46:-.08;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(24,48,0xc4d1bd,0xd1daca);grid.position.y=floor.position.y+.002;scene.add(grid);function applyTheme(){const dark=document.documentElement.dataset.theme==='dark';const bg=dark?0x192821:0xdfe6db;renderer.setClearColor(bg,1);floor.material.color.setHex(bg);grid.material.vertexColors=false;grid.material.color.setHex(dark?0x3c5545:0xc4d1bd);grid.material.opacity=dark?.32:.7;grid.material.transparent=true;renderer.toneMappingExposure=dark?.72:.85;}
 applyTheme();window.addEventListener('themechange',applyTheme);
 const initial={radius,yaw,pitch};function cameraUpdate(){camera.position.set(Math.sin(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius+focus,Math.cos(yaw)*Math.cos(pitch)*radius);camera.lookAt(0,focus,0)}cameraUpdate();let dragging=false,px=0,py=0;const canvas=renderer.domElement;canvas.onpointerdown=e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!dragging)return;yaw-=(e.clientX-px)*.008;pitch=Math.max(.15,Math.min(1.45,pitch+(e.clientY-py)*.006));px=e.clientX;py=e.clientY;cameraUpdate()};canvas.onpointerup=canvas.onpointercancel=()=>dragging=false;canvas.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(isComponent?3.5:6,Math.min(22,radius+e.deltaY*.012));cameraUpdate()},{passive:false});const observer=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()});observer.observe(el);let frame=0,disposed=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;function animate(t){if(disposed)return;frame=requestAnimationFrame(animate);amount=reduced?active:amount+(active-amount)*.045;if(gateModel){gateModel.pivot.rotation.y=amount*Math.PI*.48;gateModel.crank.rotation.y=gateModel.pivot.rotation.y;gateModel.person.position.z=3-amount*1.4;gateModel.person.visible=slide===3;gateModel.waves.visible=slide===3&&active===1;gateModel.beacon.material.color.setHex(active?0xbafa68:0xdca347)}if(varal){varal.rack.position.x=1.5-amount*3.05;varal.drops.visible=active===1;if(!reduced)varal.drops.children.forEach((d,i)=>{d.position.y=.3+((d.userData.y-t*.002+i*.02)%3.4+3.4)%3.4})}renderer.render(scene,camera)}animate(0);return {setActive:v=>active=v?1:0,reset:()=>{({radius,yaw,pitch}=initial);cameraUpdate()},dispose:()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("themechange",applyTheme);scene.traverse(o=>{if(o.userData.sharedAsset)return;if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.map)m.map.dispose();m.dispose()}}});renderer.dispose();canvas.remove()}}}

