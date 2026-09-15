import * as T from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { mountScene } from './scene-viewer.mjs';
const supplied=new Map();
async function loadSupplied(name){
 if(!supplied.has(name))supplied.set(name,new GLTFLoader().loadAsync(new URL('./models/'+name+'.glb',import.meta.url).href).then(gltf=>{gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedAsset=true;}});return gltf.scene;}).catch(error=>{supplied.delete(name);throw error;}));
 return supplied.get(name);
}
let unoTemplate,servoTemplate,ultrasonicTemplate,shieldTemplate;

const C={pcb:0x167d76,black:0x182a29,metal:0xb6c7c5,gold:0xdfbc65,blue:0x3277b2,white:0xf5f5e8,lime:0xbafa68};
function mat(c,metal=0){return new T.MeshStandardMaterial({color:c,metalness:metal,roughness:metal?.34:.6})}
function box(g,w,h,d,x,y,z,c){let m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c,c===C.metal?.65:0));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function cyl(g,r,h,x,y,z,c){let m=new T.Mesh(new T.CylinderGeometry(r,r,h,32),mat(c,c===C.metal?.65:0));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
function wire(g,points,c,r=.022){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,30,r,7,false),mat(c));g.add(m);return m}
function label(g,text,x,y,z,size=.3,color='#e4eee2'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 65px Arial';ctx.fillText(text,256,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(size*4,size),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);g.add(m);return m}
function arduino(){return unoTemplate.clone(true)}
function servo(){return servoTemplate.clone(true)}
function rain(){const g=new T.Group();box(g,1.7,.09,2.2,-.4,.1,0,0x233a39);for(let i=0;i<13;i++){box(g,1.4,.015,.036,-.4,.154,-.93+i*.15,C.metal);box(g,.035,.015,.1,i%2?-.98:.18,.155,-.88+i*.15,C.metal)}box(g,.7,.09,1.25,1.1,.1,.1,C.pcb);box(g,.28,.25,.3,1.1,.27,-.22,C.blue);cyl(g,.06,.02,1.1,.404,-.22,C.metal);box(g,.2,.1,.4,1.1,.2,.24,C.black);for(let i=0;i<4;i++)box(g,.035,.04,.32,.88+i*.14,.13,.87,C.gold);wire(g,[[.3,.18,-.95],[.8,.2,-1.2],[1.2,.2,-.55]],0xdc5c37);wire(g,[[.35,.18,-.8],[.9,.2,-1],[1.1,.2,-.55]],C.black);return g}
function ultrasonic(){return ultrasonicTemplate.clone(true)}
function shield(){return shieldTemplate.clone(true)}
function power(){const g=new T.Group();box(g,1.5,.65,2.1,0,.4,0,C.black);box(g,1.4,.01,1.3,0,.731,0,0x41534c);label(g,'FONTE',0,.744,-.1,.24);label(g,'ALIMENTAÇÃO',0,.744,.27,.12);wire(g,[[0,.4,-1],[.2,.25,-1.7],[1.2,.15,-1.5],[1.5,.16,0]],C.black,.04);let plug=cyl(g,.1,.35,1.5,.16,.14,C.metal);plug.rotation.x=Math.PI/2;return g}
function jumpers(){const g=new T.Group();for(let i=0;i<6;i++){const x=(i-2.5)*.32;wire(g,[[x,.14,-1.2],[x+.1,.3,-.6],[x-.1,.35,.5],[x+.18,.14,1.25]],[0xb74336,0xe1b642,0x2a7fab,0x3a925c,0x31383b,0xd2dbcf][i],.038);box(g,.12,.14,.35,x,.14,-1.25,C.black);box(g,.04,.04,.25,x,.14,-1.5,C.gold);box(g,.12,.14,.35,x+.18,.14,1.25,C.black);box(g,.04,.04,.25,x+.18,.14,1.5,C.gold)}return g}
function gate(){
 const g=new T.Group(),steel=0x344b50,stone=0xb7bdb6;
 box(g,10,.18,5.5,1.8,0,.8,0x718078);
 // Paving joints and entrance curb.
 for(let x=-3;x<6.6;x+=.55)for(let z=-1.65;z<3.5;z+=.68)box(g,.525,.027,.655,x,.104,z,((Math.round(x*20)+Math.round(z*20))%3)?0x9da59c:0xadb1a7);
 for(const x of [-2.16,2.16]){
   box(g,.43,2.48,.5,x,1.35,0,stone);box(g,.55,.11,.63,x,2.63,0,0x5a6e64);
   box(g,.55,.13,.63,x,.2,0,0x66776d);
   for(let y=.5;y<2.5;y+=.3)box(g,.434,.012,.505,x,y,0,0x89958b);
 }
 for(const x of [-2.85,2.85]){box(g,.95,1.25,.35,x,.82,0,0xa8b1a5);box(g,1.02,.08,.45,x,1.48,0,0x667a6c)}
 // The leaf runs behind the posts, into a full-width lateral pocket.
 box(g,4.6,1.25,.23,4.58,.82,-.68,0xa8b1a5);
 box(g,4.7,.08,.32,4.58,1.48,-.68,0x667a6c);
 box(g,8.25,.055,.07,2.13,.16,-.34,C.metal);
 const leaf=new T.Group();leaf.position.set(-1.92,.45,-.34);
 for(let y of [.04,1.95])box(leaf,3.82,.13,.15,1.91,y,0,steel);
 for(let x of [.04,3.78])box(leaf,.13,2.05,.15,x,.99,0,steel);
 for(let x=.24;x<3.7;x+=.235){box(leaf,.135,1.85,.08,x,1,0,steel);box(leaf,.012,1.82,.012,x-.05,1,.046,0x64767b)}
 box(leaf,3.64,.16,.17,1.91,.62,0,steel);
 box(leaf,.085,.36,.08,3.58,1.12,.13,C.metal);
 const wheels=[];
 for(const x of [.42,3.4]){const wheel=cyl(leaf,.11,.09,x,-.15,0,C.metal);wheel.rotation.x=Math.PI/2;wheels.push(wheel);box(leaf,.25,.15,.15,x,-.04,0,steel)}
 // Rack and stationary pinion visualize the horizontal transmission.
 box(leaf,3.78,.07,.06,1.91,.21,-.12,C.metal);
 for(let x=.05;x<3.8;x+=.095)box(leaf,.045,.055,.075,x,.16,-.12,C.metal);
 g.add(leaf);
 for(let z of [-.48,-.20]){const roller=cyl(g,.065,.17,2.13,2.3,z,C.black);box(g,.2,.06,.47,2.13,2.41,-.34,steel)}
 for(let x of [-1.99,6.25])box(g,.08,.21,.22,x,.26,-.34,steel);
 const s=servo();s.scale.setScalar(.3);s.position.set(2.5,.39,-.86);g.add(s);
 const gear=new T.Group();gear.position.set(2.48,.58,-.46);
 const hub=cyl(gear,.13,.08,0,0,0,C.gold);hub.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const tooth=box(gear,.05,.07,.09,Math.cos(a)*.135,Math.sin(a)*.135,0,C.gold);tooth.rotation.z=a-Math.PI/2}g.add(gear);
 const sensor=ultrasonic();sensor.scale.setScalar(.23);sensor.position.set(2.16,1.15,.4);g.add(sensor);
 box(g,.62,.4,.13,2.16,1.32,.255,0x1e302e);
 const beacon=cyl(g,.1,.12,2.16,2.75,0,0xdca347);
 const person=new T.Group();
 cyl(person,.19,.65,0,.7,0,0x6f9b6e);
 for(let x of [-.11,.11]){cyl(person,.065,.43,x,.22,0,0x304950);box(person,.12,.08,.23,x,.035,.05,0x283b3c)}
 for(let x of [-.26,.26])cyl(person,.057,.53,x,.69,0,0x6f9b6e);
 const head=new T.Mesh(new T.SphereGeometry(.16,24,20),mat(0xd6b998));head.position.y=1.2;person.add(head);person.position.set(1.42,.13,3);g.add(person);
 const waves=new T.Group();for(let i=0;i<3;i++){const pts=[];for(let k=0;k<=36;k++){const a=-.7+k/36*1.4;pts.push([2.16+Math.sin(a)*(.42+i*.28),1.5,.36+Math.cos(a)*(.42+i*.28)])}wire(waves,pts,0x9ddc71,.012)}g.add(waves);waves.visible=false;
 g.position.x=-1.8;return {g,leaf,person,gear,wheels,waves,beacon};
}
function palmeirasShirt(){
 const g=new T.Group();
 const shape=new T.Shape();
 // Shoulder seams, short sleeves and a wider hem give each shirt a real silhouette.
 const outline=[[-.17,0],[-.32,-.055],[-.53,-.24],[-.38,-.39],[-.29,-.3],[-.29,-.82],[.29,-.82],[.29,-.3],[.38,-.39],[.53,-.24],[.32,-.055],[.17,0],[.105,-.085],[-.105,-.085]];
 outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.007,bevelThickness:.005});
 const uv=geo.attributes.uv,positions=geo.attributes.position;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(positions.getX(i)+.55)/1.1,(positions.getY(i)+.84)/.86);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#075d35';ctx.fillRect(0,0,512,512);
 for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#07633a':'#075d35';ctx.fillRect(i*44,0,22,512)}
 ctx.fillStyle='#f3f0da';ctx.fillRect(0,155,88,15);ctx.fillRect(424,155,88,15);
 ctx.strokeStyle='#f3f0da';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(256,38,59,35,0,0,Math.PI);ctx.stroke();
 // Illustrated club crest, with its name and monogram.
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(320,142,29,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#075d35';ctx.beginPath();ctx.arc(320,142,26,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(320,142,21,0,Math.PI*2);ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 8px Arial';ctx.fillText('PALMEIRAS',320,132);ctx.font='bold italic 26px Georgia';ctx.fillText('P',319,154);
 ctx.font='bold 22px Arial';ctx.fillText('PALMEIRAS',256,241);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 const cloth=new T.MeshStandardMaterial({map:tex,roughness:.98,side:T.DoubleSide});
 const shirt=new T.Mesh(geo,[cloth,mat(0x075d35)]);shirt.castShadow=true;shirt.receiveShadow=true;g.add(shirt);
 return g;
}
function house(){
 const g=new T.Group();
 box(g,12,.18,10,0,-.07,0,0x6e8c63);
 box(g,5.6,.22,4.25,.75,.16,-2,0x9aa49b);
 box(g,5.2,2.45,3.8,.75,1.46,-2,0xe2dfcf);
 // Gabled roof with fascia and individual raised seams.
 const roofShape=new T.Shape();roofShape.moveTo(-2.85,0);roofShape.lineTo(0,1.2);roofShape.lineTo(2.85,0);roofShape.closePath();
 const roof=new T.Mesh(new T.ExtrudeGeometry(roofShape,{depth:4.3,bevelEnabled:false}),mat(0x9b5140));roof.position.set(.75,2.7,-4.15);roof.castShadow=true;g.add(roof);
 for(let z=-4.15;z<.16;z+=.22)for(let side of [-1,1])wire(g,[[.75+side*2.87,2.71,z],[.75,3.91,z]],0xb66d52,.025);
 box(g,5.78,.12,.13,.75,2.67,.16,0xece8d7);
 function windowUnit(x,y,z,w,h){
  box(g,w+.16,h+.16,.11,x,y,z,0xf4f0df);const glass=box(g,w,h,.025,x,y,z+.073,0x437b83);glass.material.metalness=.25;glass.material.roughness=.22;
  box(g,.045,h,.04,x,y,z+.095,0xd5ddd5);box(g,w,.045,.04,x,y,z+.095,0xd5ddd5);
  box(g,w+.28,.09,.23,x,y-h/2-.07,z+.05,0xb7bcb0);
 }
 windowUnit(-.95,1.62,-.08,1.1,1.1);windowUnit(2.4,1.62,-.08,1.1,1.1);
 box(g,.96,1.94,.09,.75,1.2,-.07,0x77543c);box(g,1.1,.09,.14,.75,2.21,-.035,0xf2ebd9);
 for(let y=.4;y<2;y+=.23)box(g,.88,.012,.012,.75,y,-.016,0x5f412e);
 const knob=cyl(g,.043,.04,1.08,1.16,.02,C.gold);knob.rotation.x=Math.PI/2;
 box(g,1.5,.13,.65,.75,.22,.29,0xa9b2a5);
 for(let z=.9;z<3.35;z+=.6)box(g,1.35,.055,.49,.75,.07,z,0xc4c6b8);
 for(let x of [-1.6,3.1]){box(g,.68,.26,.6,x,.23,.45,0x967c5e);for(let i=0;i<3;i++){const shrub=new T.Mesh(new T.IcosahedronGeometry(.27,1),mat(0x3f784a));shrub.position.set(x+(i-1)*.18,.49,.45);shrub.castShadow=true;g.add(shrub)}}
 return g;
}
function clothesline(){let g=new T.Group();box(g,5.8,.13,3.8,0,.01,0,0xbac9ae);for(let x of [-2.6,-.5])for(let z of [-1.4,1.4])box(g,.09,2.6,.09,x,1.35,z,0x738c76);box(g,2.5,.12,3.35,-1.6,2.72,0,0xeceee1);for(let z of [-.95,.95])box(g,4.8,.055,.06,0,2.1,z,C.metal);const rack=new T.Group();for(let x of [-.7,.7])box(rack,.06,.06,2,x,0,0,C.black);for(let z of [-.82,0,.82]){box(rack,1.4,.025,.025,0,0,z,C.metal);const shirt=palmeirasShirt();shirt.position.set(0,-.025,z);rack.add(shirt);box(rack,.04,.08,.06,-.23,-.015,z,C.gold);box(rack,.04,.08,.06,.23,-.015,z,C.gold)}rack.position.set(1.5,2.08,0);g.add(rack);let se=servo();se.scale.setScalar(.27);se.position.set(-2.4,2.2,1.15);g.add(se);const drops=new T.InstancedMesh(new T.BoxGeometry(.016,.13,.016),mat(0x609fbd),45);
drops.castShadow=true;drops.receiveShadow=true;drops.instanceMatrix.setUsage(T.DynamicDrawUsage);
const positions=[],matrix=new T.Matrix4();
for(let i=0;i<45;i++){const x=.05+((i*37)%100)/40,y=2.8+((i*13)%100)/90,z=((i*23)%100)/35-1.4;positions.push({x,y,z});drops.setMatrixAt(i,matrix.makeTranslation(x,y,z));}
// Include the whole falling range in the bounds, avoiding per-frame bound work.
drops.boundingBox=new T.Box3(new T.Vector3(0,.2,-1.5),new T.Vector3(2.6,4,1.6));
drops.boundingSphere=drops.boundingBox.getBoundingSphere(new T.Sphere());
function updateRain(time){positions.forEach((p,i)=>{const y=.3+((p.y-time*.002+i*.02)%3.4+3.4)%3.4;drops.setMatrixAt(i,matrix.makeTranslation(p.x,y,p.z));});drops.instanceMatrix.needsUpdate=true;}
g.add(drops);drops.visible=false;return{g,rack,drops,updateRain}}

export async function mount(el,slide,component){
 const loading=document.createElement('div');loading.className='model-loading';loading.textContent='Carregando modelo 3D…';el.appendChild(loading);
 try{
 const pending=[];
 if(slide===4&&component===0)pending.push(loadSupplied('arduino-uno').then(m=>unoTemplate=m));
 if(slide!==4||component===1)pending.push(loadSupplied('servo-sg90').then(m=>servoTemplate=m));
 if(slide===0||slide===3||(slide===4&&component===3))pending.push(loadSupplied('hc-sr04').then(m=>ultrasonicTemplate=m));
 if(slide===4&&component===4)pending.push(loadSupplied('motor-shield-l293d').then(m=>shieldTemplate=m));
 await Promise.all(pending);
 }catch(error){loading.remove();throw error}
 loading.remove();
 if(!el.isConnected)return {dispose(){}};
const root=new T.Group();let gateModel=null,varal=null;const isComponent=slide===4;
if(isComponent){root.add([arduino,servo,rain,ultrasonic,shield,power,jumpers][component]())}else if(slide===3){gateModel=gate();root.add(gateModel.g)}else if(slide===2){varal=clothesline();root.add(varal.g)}else{root.add(house());varal=clothesline();varal.g.position.set(-3.8,.09,.9);varal.g.scale.setScalar(.58);root.add(varal.g);gateModel=gate();gateModel.g.position.set(-.25,.08,3.3);gateModel.g.scale.setScalar(.65);root.add(gateModel.g)}
return mountScene(el,slide,component,{root,gateModel,varal});
}
