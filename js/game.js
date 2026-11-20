// AEON / PRIVATE SUITE — game script (Canvas 2D, no engine).
// Movement, animation timing and afterimage VFX are the approved v0.8.7 code, unchanged.
'use strict';
const PATHS={suite:'assets/suite.jpg',atlas:'assets/atlas.png',atlasSubtle:'assets/atlasSubtle.png',portrait:'assets/portrait.jpg',upperWalk:'assets/upperWalk.png',upperRun:'assets/upperRun.png',interactSubtle:'assets/interactSubtle.png'};
const byId=id=>document.getElementById(id);
const canvas=byId('game'),ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;
const H=720,WORLD=3200,FLOOR=600;
// Visible slice of the world (world units). The canvas always fills its band, so the width follows
// the window's shape and small screens show a slightly closer view. Set by layout().
let VW=1280,VY=0,VH=720,K=1,cssScale=1,uiF=1;
const frame=byId('frame'),band=byId('band');
const imgs={};let loaded=0;let ready=false;
Object.entries(PATHS).forEach(([key,url])=>{let im=new Image();im.onload=()=>{loaded++;if(loaded===Object.keys(PATHS).length){ready=true;imgs.lounge=imgs.suite;const b=byId('startBtn');b.disabled=false;b.textContent='ENTER THE SUITE　→';render();}};im.onerror=()=>console.warn('Asset unavailable:',url);im.src=url;imgs[key]=im;});
byId('portrait').src=PATHS.portrait;
const GAME_SPEED=1.5;
// v0.8.7: original v0.8.1 movement/timing plus dash+jump trails and revised subtle interact sprites using the original character art.
const atlas={width:229,height:229,columns:6,scale:1.3,footY:224,frames:{idle:[0,1,2,3,4,5],walk:[6,7,8,9,10,9,8,7],run:[12,13,14,15,16,17,18,19],jump:[20,21,22,23,24,25],interact:[26,27,28,29]}};
const atlasSubtle={width:229,height:229,columns:6,scale:1.3,footY:224,frames:{idle:[0,1,2,3,4,5],walk:[6,7,8,9,10,11],run:[12,13,14,15,16,17],jump:[18,19,20,21,22,23],interact:[24,25,26,27,28,29]}};
const interactSubtle={width:229,height:229,columns:3,scale:1.3,footY:224,frames:{interact:[0,1,2,3,4,5]}};
let locomotionMode=1;const LOCOMOTION_MODES=['SPRITE V0.5','SPRITE SUBTLE v0.8.1','RIG REFINED'];let mode='intro',frameN=0,lastT=0,elapsed=0,fps=60,cam=0,night=false,dialogTime=0,noticeTimeout=0,ambientF=0;
let currentNear=null,dialogTarget=null,visited=new Set(),doorOpened=false,finished=false;
// Additive cyan afterimage trail — configurable independently from character movement.
const TRAIL_LEVELS=[
 {name:'OFF',count:0,alpha:0,interval:0.068,life:0.34,glow:0},
 {name:'SOFT',count:3,alpha:0.22,interval:0.079,life:0.34,glow:8},
 {name:'STANDARD',count:5,alpha:0.36,interval:0.062,life:0.43,glow:13},
 {name:'BRIGHT',count:6,alpha:0.46,interval:0.053,life:0.46,glow:18}
];
let trailLevel=2, trailElapsed=0, trailLastX=null, trailHistory=[];
const trailSpriteCache=new Map();
function resetTrail(){trailElapsed=0;trailLastX=null;trailHistory.length=0;}
function switchTrail(){trailLevel=(trailLevel+1)%TRAIL_LEVELS.length;resetTrail();showNotice('青い残像: '+TRAIL_LEVELS[trailLevel].name);}

const p={x:135,y:0,vx:0,vy:0,grounded:true,facing:1,animation:'idle',animClock:0,gaitPhase:0,freeze:0};
const keys={left:false,right:false,run:false};
// Touch stick state, plus the station the player is walking to after tapping its marker.
const stick={id:null,ox:0,oy:0,axis:0,run:false};
let running=false,autoTarget=null,dialogHeld=false;
function inputAxis(){return stick.axis||Number(keys.right)-Number(keys.left);}
const stations=[
 {id:'terminal',x:230,name:'メインコンソール',subtitle:'HOLOGRAPHIC CONSOLE',description:'スイート内の照明と空調を管理する端末。壁面のホログラフィックパネルが淡い青色に応答する。照明モードを切り替えられる。',required:true},
 {id:'window',x:680,name:'パノラマウィンドウ',subtitle:'PANORAMA OBSERVATION',description:'眼下には滝と山岳都市が広がる。窓辺の空気は静かで、遠くの光だけがゆっくり瞬く。',required:true},
 {id:'lounge',x:875,name:'ラウンジ・ソファ',subtitle:'PRIVATE LOUNGE',description:'柔らかなクッションと低いテーブル。ここは長い任務の後にくつろぐための、プライベートな休息スペース。',required:true},
 {id:'bed',x:1260,name:'レスト・ポッド',subtitle:'RESTING QUARTERS',description:'温度調整機能を備えた高級レスト・ポッド。静音モードが作動し、床下の照明がふっと落ち着く。',required:true},
 {id:'airlock',x:1515,name:'スイート区画の扉',subtitle:'ACCESS GATE / SECTOR 02',description:'4つの室内設備を確認すると、次のラウンジ区画へのセキュリティロックが解除される。',required:false},
 {id:'archive',x:1860,name:'アーカイブ端末',subtitle:'PERSONAL ARCHIVE',description:'過去の滞在ログ、景観プリセット、音楽ライブラリが格納されたコンソール。データはすべて個人用に暗号化されている。',required:false},
 {id:'wardrobe',x:2260,name:'ドレッシングエリア',subtitle:'WARDROBE SYSTEM',description:'スーツの整備と衣装管理を行う収納区画。透明なハンガーレールには整然と装備が掛けられている。',required:false},
 {id:'master',x:2990,name:'マスターパネル',subtitle:'SUITE CENTRAL CONTROL',description:'施設全体の管理パネル。すべての点検項目が完了していることを確認すると、今回の探索は終了する。',required:false}
];
const req=stations.filter(s=>s.required).length;
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function smooth(a,b,t){return a+(b-a)*t}
function updateUI(){let count=stations.filter(s=>s.required&&visited.has(s.id)).length;byId('missionCount').textContent=count+' / '+req;byId('missionBar').style.width=(count/req*100)+'%';byId('missionText').textContent=count===req?'すべての設備を確認済み · 扉へ向かう':'室内設備を調査する';mapPips.forEach((el,i)=>el.classList.toggle('done',visited.has(stations[i].id)));}
function showNotice(t){byId('notice').textContent=t;byId('notice').classList.add('show');noticeTimeout=2.8;}
function setMode(m){mode=m;frame.dataset.mode=m;if(m!=='play')autoTarget=null;if(m==='dialog'){dialogTime=0;dialogHeld=inputAxis()!==0;}byId('useBtn').classList.toggle('ready',m==='dialog');byId('intro').classList.toggle('show',m==='intro');byId('pause').classList.toggle('show',m==='pause');byId('ending').classList.toggle('show',m==='ending');byId('hud').classList.toggle('show',m!=='intro');byId('dialogWrap').classList.toggle('show',m==='dialog');if(m!=='play')byId('proximity').classList.remove('show');if(m==='play'){canvas.focus({preventScroll:true});p.animClock=0;}}
function start(){if(!ready)return;if(isTouch&&!fullscreenElement())toggleFullscreen();setMode('play');showNotice('4つの設備を調べて、区画ゲートへ向かおう');}
function reset(){resetTrail();p.x=135;p.y=0;p.vx=p.vy=0;p.grounded=true;p.facing=1;visited.clear();doorOpened=false;finished=false;night=false;cam=0;p.gaitPhase=0;updateUI();setMode('play');showNotice('MISSION RESTARTED');}
byId('startBtn').addEventListener('click',start);byId('resumeBtn').addEventListener('click',()=>setMode('play'));byId('restartBtn').addEventListener('click',reset);
byId('exploreBtn').addEventListener('click',()=>setMode('play'));byId('againBtn').addEventListener('click',reset);// (ignore the click that belongs to the same tap that opened the panel under the finger)
byId('dialog').addEventListener('click',()=>{if(mode==='dialog'&&dialogTime>.25)setMode('play');});
function nearest(){let nearest=null,d=112;for(const s of stations){let delta=Math.abs(p.x-s.x);if(delta<d){nearest=s;d=delta;}}return nearest;}
function interact(target){if(mode==='intro'){start();return;}if(mode==='dialog'){setMode('play');return;}if(mode==='ending'){setMode('play');return;}if(mode!=='play')return;if(!p.grounded){showNotice('着地してから調べよう');return;}
 const s=target||nearest();if(!s){showNotice('近くに調べられる設備がありません');return;}
 if(s.id==='airlock'&&!doorOpened){let done=stations.filter(s=>s.required&&visited.has(s.id)).length;if(done<req){openDialog(s,'LOCKED · '+(req-done)+' CHECKPOINTS REMAIN','セキュリティロックが掛かっている。室内の4つの設備を確認すると解錠される。',false);return;} doorOpened=true;openDialog(s,'ACCESS GRANTED','セクター02への通路が解放された。右へ進んで、隣接するラウンジ区画を探索できる。',false);return;}
 if(s.id==='master'&&stations.filter(s=>s.required&&visited.has(s.id)).length===req){visited.add('master');finished=true;setMode('ending');return;}
 if(s.required&&!visited.has(s.id)){visited.add(s.id);updateUI();if(stations.filter(s=>s.required&&visited.has(s.id)).length===req)showNotice('ALL CHECKPOINTS CLEAR · 右端のゲートへ');}
 if(s.id==='terminal')night=!night;
 openDialog(s,visited.has(s.id)?'SCAN COMPLETE // '+s.subtitle:s.subtitle,s.description+(s.id==='terminal'?'　現在の照明: '+(night?'ナイトモード':'デイモード')+'。':''),true);
}
function openDialog(s,tag,txt,scanned){dialogTarget=s;byId('dialogTag').textContent=tag;byId('dialogTitle').textContent=s.name;byId('dialogText').textContent=txt;byId('dialogFootText').textContent=scanned?'✓ SCAN LOG UPDATED':'FACILITY ACCESS STATUS';p.freeze=.5;p.vx=0;p.animation='interact';p.animClock=0;setMode('dialog');}
function keyHandler(e,down){let code=e.code;if(['KeyA','KeyD','KeyW','ArrowLeft','ArrowRight','ArrowUp','Space','ShiftLeft','ShiftRight','KeyE','Enter','Escape','KeyR','F3','F2','KeyG'].includes(code))e.preventDefault();
 if(code==='KeyA'||code==='ArrowLeft')keys.left=down;if(code==='KeyD'||code==='ArrowRight')keys.right=down;if(code==='ShiftLeft'||code==='ShiftRight')keys.run=down;
 if(!down||e.repeat)return;
 if(code==='Space'||code==='KeyW'||code==='ArrowUp')jump();
 if(code==='KeyE'||code==='Enter')interact();
 if(code==='Escape'){if(mode==='dialog')setMode('play');else if(mode==='pause')setMode('play');else if(mode==='play')setMode('pause');}
 if(code==='KeyR'&&mode==='pause')reset();
 if(code==='F2'){locomotionMode=(locomotionMode+1)%LOCOMOTION_MODES.length;p.animClock=0;resetTrail();showNotice('移動アニメ：'+LOCOMOTION_MODES[locomotionMode]);}
 if(code==='F3'){byId('stats').hidden=!byId('stats').hidden;}
 if(code==='KeyG'){switchTrail();}
}
window.addEventListener('keydown',e=>keyHandler(e,true));window.addEventListener('keyup',e=>keyHandler(e,false));function releaseInputs(){keys.left=keys.right=keys.run=false;stickEnd();}
window.addEventListener('blur',()=>{releaseInputs();if(mode==='play')setMode('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseInputs();if(mode==='play')setMode('pause');}});
function jump(){if(mode==='dialog'){setMode('play');return;}autoTarget=null;if(mode==='play'&&p.grounded){p.vy=-690*GAME_SPEED;p.grounded=false;p.animClock=0;showParticles(p.x,FLOOR,10,'#b5edff');}}
let particles=[];
function showParticles(x,y,n,color){for(let i=0;i<n;i++)particles.push({x,y,dx:(Math.random()-.5)*100,dy:-Math.random()*80,life:Math.random()*.28+.22,max:.5,color});}
function update(dt){elapsed+=dt;ambientF+=dt;trailHistory=trailHistory.filter(g=>elapsed-g.born<g.life);if(noticeTimeout>0){noticeTimeout-=dt;if(noticeTimeout<=0)byId('notice').classList.remove('show');}
 if(mode==='dialog'){p.animClock+=dt;dialogTime+=dt;
  // Pressing a direction (a fresh press, not one held from before) closes the panel and walks on.
  if(inputAxis()===0)dialogHeld=false;else if(!dialogHeld&&dialogTime>.2)setMode('play');
  if(mode!=='play')return;}
 if(mode!=='play')return;
 if(p.freeze>0)p.freeze-=dt;
 let axis=inputAxis();running=stick.axis?stick.run:keys.run;
 if(axis!==0)autoTarget=null;
 else if(autoTarget){const d=autoTarget.x-p.x;
  if(Math.abs(d)<26){if(p.grounded){const t=autoTarget;autoTarget=null;p.vx=0;interact(t);if(mode!=='play')return;}}
  else{axis=Math.sign(d);running=Math.abs(d)>420;}}
 const speed=(running?315:172)*GAME_SPEED;
 let target=axis*speed;
 p.vx=smooth(p.vx,target,clamp(dt*(axis?10:15),0,1));if(axis!==0)p.facing=axis;
 const oldPX=p.x; p.x=clamp(p.x+p.vx*dt,45,WORLD-55);if(!doorOpened&&p.x>1522){p.x=1522;p.vx=0;if(autoTarget&&autoTarget.x>1530){autoTarget=null;showNotice('扉がロックされている');}} const moveDX=Math.abs(p.x-oldPX);
 if(!p.grounded){p.vy+=1570*GAME_SPEED*dt;p.y+=p.vy*dt;if(p.y>=0){p.y=0;p.vy=0;p.grounded=true;showParticles(p.x,FLOOR,6,'#99d9e8');}}
 let anim=!p.grounded?'jump':(Math.abs(p.vx)<18*GAME_SPEED?'idle':Math.abs(p.vx)>225*GAME_SPEED?'run':'walk');
 if((anim==='walk'||anim==='run')&&moveDX>0){const stride=anim==='run'?58:36; p.gaitPhase=(p.gaitPhase+moveDX/(2*stride*1.12)*Math.PI*2)%(Math.PI*2);}
 if(anim!==p.animation){p.animClock=0;p.animation=anim;}else p.animClock+=dt;
 // Record fixed world-space snapshots during dash and jump for additive cyan afterimages.
 const trailCfg=TRAIL_LEVELS[trailLevel];
 const canTrail=trailCfg.count>0 && locomotionMode!==2;
 const isDashing=canTrail && running && p.grounded && anim==='run' && moveDX>0.2;
 const isJumping=canTrail && !p.grounded && anim==='jump' && Math.abs(p.vy)>60;
 if(isDashing||isJumping){
   const trailInterval=isJumping?trailCfg.interval*1.15:trailCfg.interval;
   const trailLife=isJumping?trailCfg.life*0.92:trailCfg.life;
   const trailCap=isJumping?Math.max(3,trailCfg.count-1):trailCfg.count;
   trailElapsed+=dt;
   if(trailLastX===null)trailLastX=p.x-42*p.facing;
   const movedEnough=isJumping?Math.abs(p.y)>6||Math.abs(p.x-trailLastX)>=8:Math.abs(p.x-trailLastX)>=14;
   if(trailElapsed>=trailInterval && movedEnough){
     trailElapsed=0;
     trailLastX=p.x;
     trailHistory.unshift({x:p.x,y:p.y,frame:getFrame(),facing:p.facing,locomotionMode,born:elapsed,life:trailLife});
     trailHistory.length=Math.min(trailHistory.length,trailCap);
   }
 }else{trailElapsed=0;trailLastX=null;}

 cam=smooth(cam,clamp(p.x-VW*.41,0,Math.max(0,WORLD-VW)),Math.min(1,7.5*dt));
 let near=p.grounded?nearest():null;currentNear=near;
 if(near){if(promptFor!==near){promptFor=near;byId('nearTitle').textContent=near.name;}promptEl.classList.add('show');placePrompt(near);}else{promptFor=null;promptEl.classList.remove('show');}
 byId('useBtn').classList.toggle('ready',!!near);
 mapMe.style.left=(p.x/WORLD*100).toFixed(2)+'%';
 for(const q of particles){q.x+=q.dx*dt;q.y+=q.dy*dt;q.dy+=120*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);
 frameN++;if(frameN%15===0&&!byId('stats').hidden)byId('stats').textContent='STATE: '+p.animation.toUpperCase()+' · '+LOCOMOTION_MODES[locomotionMode]+' · X: '+String(Math.round(p.x)).padStart(4,'0')+' · '+Math.round(fps)+' FPS';
}
function drawBg(){
 ctx.fillStyle='#101a2d';ctx.fillRect(0,0,VW,H);
 if(imgs.suite?.complete&&imgs.suite.naturalWidth)ctx.drawImage(imgs.suite,-cam,0,1600,H);
 if(imgs.lounge?.complete&&imgs.lounge.naturalWidth)ctx.drawImage(imgs.lounge,1600-cam,0,1600,H);
 // faint cold glass tint, refined contrast
 let grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'rgba(4,17,34,.11)');grd.addColorStop(.65,'rgba(4,15,31,0)');grd.addColorStop(1,'rgba(4,10,21,.32)');ctx.fillStyle=grd;ctx.fillRect(0,0,VW,H);
 if(night){ctx.fillStyle='rgba(5,14,43,.37)';ctx.fillRect(0,0,VW,H);}
 // glowing transition threshold, hides the panorama seam
 const s=1600-cam;if(s>-120&&s<VW+120){let a=ctx.createLinearGradient(s-52,0,s+52,0);a.addColorStop(0,'rgba(17,31,49,0)');a.addColorStop(.46,'rgba(9,24,40,.9)');a.addColorStop(.50,'rgba(92,218,255,.8)');a.addColorStop(.54,'rgba(9,24,40,.9)');a.addColorStop(1,'rgba(17,31,49,0)');ctx.fillStyle=a;ctx.fillRect(s-52,0,104,H);ctx.fillStyle='#98e7ff';ctx.globalAlpha=.55;ctx.fillRect(s-1,90,2,520);ctx.globalAlpha=1;}
 // clean walkable floor glow and front dark zone
 let fg=ctx.createLinearGradient(0,FLOOR-20,0,H);fg.addColorStop(0,'rgba(8,25,38,0)');fg.addColorStop(.3,'rgba(7,16,30,.12)');fg.addColorStop(1,'rgba(5,13,23,.32)');ctx.fillStyle=fg;ctx.fillRect(0,FLOOR-20,VW,H-FLOOR+20);
 ctx.strokeStyle='rgba(122,225,251,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,FLOOR+3);ctx.lineTo(VW,FLOOR+3);ctx.stroke();
 // architectural foreground struts for depth
 for(let x=0;x<WORLD;x+=400){let px=x-cam;if(px<-30||px>VW+30)continue;ctx.fillStyle='rgba(3,14,29,.13)';ctx.fillRect(px-6,0,10,FLOOR-20);}
}
function drawShadow(x,y,scale=1){ctx.save();ctx.translate(x-cam,FLOOR+3);ctx.scale(scale,1);let r=ctx.createRadialGradient(0,0,3,0,0,69);r.addColorStop(0,'rgba(1,8,16,.6)');r.addColorStop(1,'rgba(0,8,20,0)');ctx.fillStyle=r;ctx.beginPath();ctx.ellipse(0,0,68,11,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawMarker(s){let sx=s.x-cam;if(sx<-100||sx>VW+100)return;
 const active=visited.has(s.id),near=currentNear===s;
 const y=345+Math.sin(elapsed*2+s.x)*7;
 ctx.save();ctx.translate(sx,y);ctx.scale(uiF,uiF);ctx.globalAlpha=near?1:active?.63:.86;
 const r=near?23:17;ctx.shadowBlur=20;ctx.shadowColor=active?'#72ffce':'#7bedff';ctx.strokeStyle=active?'#8bffdc':'#8eeaff';ctx.lineWidth=near?2:1.5;ctx.rotate(Math.PI/4);ctx.strokeRect(-r/2,-r/2,r,r);ctx.rotate(-Math.PI/4);ctx.fillStyle=active?'#aafbdc':'#a8f5ff';ctx.beginPath();ctx.arc(0,0,3.3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.textAlign='center';ctx.font='11px "Noto Sans JP",sans-serif';ctx.fillStyle='rgba(226,248,255,.97)';ctx.strokeStyle='rgba(2,15,23,.9)';ctx.lineWidth=4;if(!near){ctx.strokeText(s.name,0,-21);ctx.fillText(s.name,0,-21);}
 if(active){ctx.font='bold 10px sans-serif';ctx.fillText('✓',17,-8)}ctx.restore();}
// 0.7.1 HOTFIX: use ONLY animation-appropriate frames. Never mix idle into walk,
// or walk into run. The alternate sprite mode has a separate timing curve.
const SUBTLE_FRAMES={
 idle:atlasSubtle.frames.idle,
 walk:atlasSubtle.frames.walk,
 run:atlasSubtle.frames.run,
 jump:atlasSubtle.frames.jump,
 interact:interactSubtle.frames.interact
};
function weightedFrame(list, weights, progression){
 const len=weights.reduce((s,v)=>s+v,0);
 let t=((progression%len)+len)%len;
 for(let i=0;i<list.length;i++){t-=weights[i]; if(t<0)return list[i];}
 return list[list.length-1];
}
function getFrame(){
 const state=p.animation;
 if(locomotionMode===1){
   if(state==='idle') return SUBTLE_FRAMES.idle[Math.floor(p.animClock*3.0)%SUBTLE_FRAMES.idle.length];
   if(state==='jump'){
     const list=SUBTLE_FRAMES.jump, t=p.vy;
     return list[t< -370?0:t< -80?1:t<150?2:t<420?3:t<650?4:5];
   }
   if(state==='walk'){
     // Smaller arm/hip swing, clearer left-right alternation, longer contact poses
     const frames=[6,7,8,9,10,11,10,9];
     const weights=[1.45,0.78,0.82,1.35,1.45,0.78,0.82,1.35];
     return weightedFrame(frames,weights,p.animClock*(5.35*GAME_SPEED));
   }
   if(state==='run'){
     // Dash-like cadence: compress, extend, HOLD the stretched pose, recover.
     // Ending on compact poses smooths the loop and reduces the 'paka' hitch.
     const frames=[12,13,14,15,15,15,16,17];
     const weights=[0.95,0.95,1.05,1.55,1.55,1.25,0.92,0.92];
     return weightedFrame(frames,weights,p.animClock*(7.55*GAME_SPEED));
   }
   if(state==='interact'){
     // Keep the index finger extended for the entire dialog.
     // The earlier 0..5 loop repeatedly lowered and raised the arm.
     return SUBTLE_FRAMES.interact[3];
   }
 }
 if(state==='idle')return atlas.frames.idle[0];
 const standard=atlas.frames[state]||atlas.frames.idle;
 if(state==='jump'){
   const t=p.vy;
   return standard[t< -370?0:t<0?1:t<400?2:t<600?3:4];
 }
 const fps=({idle:3,walk:7.8,run:11.2,interact:7.0}[state]||7)*GAME_SPEED;
 return standard[Math.floor(p.animClock*fps)%standard.length];
}
// Helper functions accidentally dropped by the v0.7 patch. Restore them.
function smoothstep(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function footPose(phase,offset,stride,lift,run){
 const u=((phase/(Math.PI*2)+offset)%1+1)%1;
 const stance=run?.72:.76;
 if(u<stance){
   const t=u/stance;
   return {x:stride*(.5-t),y:224,stance:true,roll:-4+8*t};
 }
 const t=(u-stance)/(1-stance);
 return {x:stride*(-.5+smoothstep(t)),y:224-lift*Math.sin(Math.PI*t),stance:false,roll:-2+4*t};
}
function solveKnee(hip,ankle,upper=74,lower=72,bend=1){
 const vx=ankle.x-hip.x,vy=ankle.y-hip.y;
 const dist=clamp(Math.hypot(vx,vy),0.001,upper+lower-.2);
 const ux=vx/Math.max(Math.hypot(vx,vy),.001), uy=vy/Math.max(Math.hypot(vx,vy),.001);
 const along=(upper*upper-lower*lower+dist*dist)/(2*dist);
 const h=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
 return {x:hip.x+ux*along+uy*h, y:hip.y+uy*along-ux*h};
}
function segment(a,b,width,far){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy));
 const nx=-dy/len,ny=dx/len;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle=far?'#353443':'#414252';ctx.lineWidth=width+3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 const shine=ctx.createLinearGradient(a.x-nx*width/2,a.y-ny*width/2,a.x+nx*width/2,a.y+ny*width/2);
 if(far){shine.addColorStop(0,'#625b74');shine.addColorStop(.32,'#9c8eac');shine.addColorStop(.68,'#c6b9cd');shine.addColorStop(1,'#6f677c');}
 else{shine.addColorStop(0,'#84768d');shine.addColorStop(.28,'#dac8dc');shine.addColorStop(.57,'#f9e9f2');shine.addColorStop(1,'#91849c');}
 ctx.strokeStyle=shine;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 ctx.lineWidth=width*.12;ctx.strokeStyle=far?'rgba(214,206,237,.30)':'rgba(255,255,255,.58)';ctx.beginPath();ctx.moveTo(a.x+nx*width*.12,a.y+ny*width*.12);ctx.lineTo(b.x+nx*width*.12,b.y+ny*width*.12);ctx.stroke();
 ctx.restore();
}
function drawProceduralLeg(phase,off,stride,lift,hip,far,moving){
 const foot=footPose(phase,off,stride,lift,moving);
 const footX=hip.x+foot.x;
 const ankle={x:footX-3,y:foot.y-9};
 const knee=solveKnee(hip,ankle,far?72:75,far?70:73, moving?0.88:0.82);
 segment(hip,knee,far?22:26,far);
 segment(knee,ankle,far?13:15,far);
 ctx.save();
 ctx.fillStyle=far?'#aea2bb':'#e7d8e4';ctx.strokeStyle=far?'#454154':'#50485c';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(knee.x,knee.y,far?8:9,far?8:9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(knee.x-2,knee.y-5);ctx.lineTo(knee.x+3,knee.y+4);ctx.stroke();
 ctx.translate(footX,foot.y-1);ctx.rotate(foot.roll*Math.PI/180);
 ctx.fillStyle=far?'#8e859e':'#d7c9da';ctx.strokeStyle='#555064';ctx.lineJoin='round';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.moveTo(-10,-14);ctx.quadraticCurveTo(-7,-3,-7,-1);ctx.lineTo(16,-1);ctx.quadraticCurveTo(20,-2,15,-6);ctx.lineTo(2,-12);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(13,-5);ctx.stroke();
 ctx.restore();
}
function drawRiggedLocomotion(){
 const running=p.animation==='run';
 // Narrower stride/lift to keep leg length perception stable.
 const stride=running?19:12.5, lift=running?5.2:2.7;
 const phase=p.gaitPhase;
 const bob=(running?0.9:0.38)*Math.cos(2*phase);
 const hip={x:130,y:118+bob};
 ctx.save();
 drawProceduralLeg(phase,.5,stride,lift,{x:126,y:119+bob},true,running);
 drawProceduralLeg(phase,0,stride,lift,hip,false,running);
 const upper=running?imgs.upperRun:imgs.upperWalk;
 if(upper&&upper.naturalWidth){
   const sway=Math.sin(phase)*(running?0.028:0.014);
   const liftY=Math.cos(phase*2)*(running?0.75:0.28);
   const lean=running?-2.5:-1.0;
   ctx.save();
   ctx.translate(130,118+bob+liftY);
   ctx.rotate(sway);
   ctx.translate(-130,-118);
   ctx.drawImage(upper,0,0);
   // subtle chest/shoulder counter-move to sell locomotion without enlarging leg motion
   ctx.restore();
 }
 ctx.restore();
}

// Render a cyan silhouette from the exact source frame (not a generated sprite).
// Cache at original frame resolution. Remove near-transparent generator residue
// so colored halos do not become huge bright blocks under additive blending.
function ghostSprite(mode,frame){
 const key=mode+':'+frame;
 if(trailSpriteCache.has(key))return trailSpriteCache.get(key);
 const def=mode===1?atlasSubtle:atlas;
 const src=mode===1?imgs.atlasSubtle:imgs.atlas;
 if(!src||!src.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=def.width;c.height=def.height;
 const cctx=c.getContext('2d',{willReadFrequently:true});
 cctx.drawImage(src,(frame%def.columns)*def.width,Math.floor(frame/def.columns)*def.height,def.width,def.height,0,0,def.width,def.height);
 let im;try{im=cctx.getImageData(0,0,def.width,def.height);}catch(_){trailSpriteCache.set(key,null);return null;}
 const a=im.data;
 for(let i=0;i<a.length;i+=4){
   const raw=a[i+3];
   if(raw<75){a[i+3]=0;continue;}
   // white-blue tint. Alpha from the original art, with a soft edge threshold.
   a[i]=35;a[i+1]=175;a[i+2]=255;
   a[i+3]=Math.round(Math.min(255,(raw-65)/155*255));
 }
 cctx.putImageData(im,0,0);
 trailSpriteCache.set(key,c);
 return c;
}
function drawAfterimages(){
 if(!trailHistory.length||TRAIL_LEVELS[trailLevel].count===0)return;
 const cfg=TRAIL_LEVELS[trailLevel];
 // Oldest to newest: nearest silhouette remains brightest.
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=trailHistory.length-1;i>=0;i--){
   const g=trailHistory[i],age=elapsed-g.born;
   const t=clamp(1-age/g.life,0,1);
   if(t<=0)continue;
   const sprite=ghostSprite(g.locomotionMode,g.frame);
   if(!sprite)continue;
   const d=g.locomotionMode===1?atlasSubtle:atlas;
   const screenX=g.x-cam;
   ctx.save();
   ctx.globalAlpha=cfg.alpha*Math.pow(t,1.35);
   ctx.shadowColor='#21adff';ctx.shadowBlur=cfg.glow;
   ctx.translate(screenX,FLOOR+g.y-d.footY*d.scale);
   ctx.scale(g.facing*d.scale,d.scale);
   ctx.drawImage(sprite,-d.width/2,0,d.width,d.height);
   ctx.restore();
 }
 ctx.restore();
}

function drawPlayer(){
 drawShadow(p.x,FLOOR,clamp(1+p.y/440,.45,1));
 const useSubtleInteract=locomotionMode===1 && p.animation==='interact';
 const activeAtlas=useSubtleInteract?interactSubtle:(locomotionMode===1?atlasSubtle:atlas);
 const activeImg=useSubtleInteract?imgs.interactSubtle:(locomotionMode===1?imgs.atlasSubtle:imgs.atlas);
 if(!activeImg?.naturalWidth)return;
 const frame=getFrame(),sx=(frame%activeAtlas.columns)*activeAtlas.width,sy=Math.floor(frame/activeAtlas.columns)*activeAtlas.height;
 const x=p.x-cam;
 ctx.save();ctx.translate(x,FLOOR+p.y-activeAtlas.footY*activeAtlas.scale);
 ctx.scale(p.facing*activeAtlas.scale,activeAtlas.scale);ctx.translate(-activeAtlas.width/2,0);
 if(locomotionMode===2&&p.grounded&&(p.animation==='walk'||p.animation==='run'))drawRiggedLocomotion();
 else ctx.drawImage(activeImg,sx,sy,activeAtlas.width,activeAtlas.height,0,0,activeAtlas.width,activeAtlas.height);
 // Far-side upper arm and forearm now read clearly; pulse at the far fingertip.
 if(useSubtleInteract && mode==='dialog'){
   const t=elapsed*3.4;
   ctx.save();ctx.globalCompositeOperation='lighter';
   ctx.strokeStyle='#69d9ff';ctx.lineWidth=1.2;
   ctx.globalAlpha=.16+.10*(.5+.5*Math.sin(t));
   ctx.shadowColor='#26baff';ctx.shadowBlur=8;
   ctx.beginPath();ctx.arc(164,93,6.5+1.5*Math.sin(t),0,Math.PI*2);ctx.stroke();
   ctx.restore();
 }
 ctx.restore();
 const rr=ctx.createLinearGradient(0,FLOOR+12,0,FLOOR+90);rr.addColorStop(0,'rgba(115,223,253,.09)');rr.addColorStop(1,'rgba(115,223,253,0)');ctx.fillStyle=rr;ctx.fillRect(x-22,FLOOR+10,44,74);
}
function drawEffects(){// restrained dust motes, no noisy full-screen particles
 for(let i=0;i<24;i++){let x=(i*191.8+ambientF*(3+i%5))%VW;let y=90+(i*87.2)%490;let radius=.7+(i%3)*.35;ctx.globalAlpha=.13+Math.sin(elapsed*1.2+i)*.08;ctx.fillStyle=i%4?'#d8f6ff':'#e9cb93';ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;
 for(const q of particles){ctx.save();ctx.globalAlpha=clamp(q.life/q.max,0,1)*.5;ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x-cam,q.y,2,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function render(){ctx.setTransform(K,0,0,K,0,-VY*K);drawBg();stations.forEach(drawMarker);drawAfterimages();drawPlayer();drawEffects();}
function tick(ms){if(!lastT)lastT=ms;const dt=clamp((ms-lastT)/1000,0,.033);lastT=ms;if(dt>0)fps=smooth(fps,1/dt,.12);update(dt);render();requestAnimationFrame(tick);}

// ---------------------------------------------------------------------------------------------
// Layout: the canvas fills the window. Wide windows show more of the room; short screens show a
// closer view (down to 600 of the 720 world rows) so the character is not tiny on a phone.
// Tall windows get the game as a band at the top, leaving the lower part for text and thumbs.
// ---------------------------------------------------------------------------------------------
let isTouch=matchMedia('(pointer:coarse)').matches;
function setTouch(v){if(isTouch===v&&document.body.classList.contains('touch')===v)return;isTouch=v;document.body.classList.toggle('touch',v);layout();}
function layout(){
 const fw=frame.clientWidth,fh=frame.clientHeight;if(!fw||!fh)return;
 let vh=clamp(600+(fh-430)/250*120,600,720),vw=vh*fw/fh,bw=fw,bh=fh;
 const bandMode=fh/fw>1.25;
 if(bandMode){vh=fw<=520?600:720;bh=Math.round(Math.min(fw*vh/640,fh*.56));vw=vh*fw/bh;}
 if(vw>2100){vw=2100;bw=Math.round(bh*vw/vh);}
 VW=vw;VH=vh;VY=(H-vh)*.83;cssScale=bw/vw;uiF=clamp(1.09/cssScale,1,1.9);
 frame.classList.toggle('band-mode',bandMode);frame.style.setProperty('--band-h',bh+'px');
 band.style.left=Math.round((fw-bw)/2)+'px';band.style.width=bw+'px';band.style.height=bh+'px';
 let pr=Math.min(window.devicePixelRatio||1,2.5);const maxPixels=isTouch?1.5e6:2.3e6;
 if(bw*bh*pr*pr>maxPixels)pr=Math.sqrt(maxPixels/(bw*bh));
 const cw=Math.round(bw*pr),ch=Math.round(bh*pr);
 if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 K=cw/vw;cam=clamp(cam,0,Math.max(0,WORLD-VW));
 if(ready)render();
}
let layoutQueued=false;
function queueLayout(){if(layoutQueued)return;layoutQueued=true;requestAnimationFrame(()=>{layoutQueued=false;layout();});}
window.addEventListener('resize',queueLayout);
window.addEventListener('orientationchange',()=>{releaseInputs();queueLayout();});
if(window.visualViewport)visualViewport.addEventListener('resize',queueLayout);

// Mini map (part of the mission panel) and the interact prompt that floats above the object.
const mapMe=byId('mapMe');
const mapPips=stations.map(s=>{const i=document.createElement('i');i.style.left=(s.x/WORLD*100)+'%';byId('minimap').insertBefore(i,mapMe);return i;});
const promptEl=byId('proximity');let promptFor=null;
function placePrompt(s){
 const half=promptEl.offsetWidth/2+8;
 promptEl.style.left=clamp((s.x-cam)*cssScale,half,Math.max(half,band.clientWidth-half))+'px';
 promptEl.style.top=Math.max((345-42*uiF-VY)*cssScale-8,promptEl.offsetHeight+62)+'px';
}
promptEl.addEventListener('click',()=>interact());
byId('pauseBtn').addEventListener('click',()=>{if(mode==='play'||mode==='dialog')setMode('pause');});

// Fullscreen: entered on start on touch devices (hides the browser bars), and from the pause menu.
function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement;}
function toggleFullscreen(){
 try{
  if(fullscreenElement()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
  const el=document.documentElement,fn=el.requestFullscreen||el.webkitRequestFullscreen;if(!fn)return;
  const r=fn.call(el,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{});
 }catch(_){}
}
if(document.fullscreenEnabled||document.webkitFullscreenEnabled){const b=byId('fsBtn');b.hidden=false;b.addEventListener('click',toggleFullscreen);}
document.addEventListener('fullscreenchange',queueLayout);

// ---------------------------------------------------------------------------------------------
// Pointer input.
//  - Touch on the left half: a stick appears under the thumb. A small push walks, a full push
//    dashes (same two speeds as the keyboard). The base follows the thumb, so reversing is quick.
//  - Tap or click a marker: walk there and inspect it. Any manual input cancels the walk.
//  - Tap anywhere while a panel is open: close it.
// ---------------------------------------------------------------------------------------------
const stickEl=byId('stick'),knob=byId('stickKnob'),taps=new Map();
function stickReach(){return (stickEl.offsetWidth||116)*.31;}
function stickStart(e){
 const half=(stickEl.offsetWidth||116)/2+6;stick.id=e.pointerId;
 stick.ox=clamp(e.clientX,half,frame.clientWidth*.5);stick.oy=clamp(e.clientY,half,frame.clientHeight-half);
 stickEl.style.left=stick.ox+'px';stickEl.style.top=stick.oy+'px';stickEl.classList.add('active');stickMove(e);
}
function stickMove(e){
 const R=stickReach(),lim=R*1.25;let dx=e.clientX-stick.ox;
 if(Math.abs(dx)>lim){stick.ox=e.clientX-Math.sign(dx)*lim;stickEl.style.left=stick.ox+'px';dx=Math.sign(dx)*lim;}
 const m=Math.min(1,Math.abs(dx)/R);stick.axis=m<.24?0:Math.sign(dx);stick.run=m>.78;
 knob.style.transform='translate('+clamp(dx,-R,R)+'px,'+clamp(e.clientY-stick.oy,-R*.4,R*.4)+'px)';
 stickEl.classList.toggle('run',stick.run&&stick.axis!==0);
}
function stickEnd(){stick.id=null;stick.axis=0;stick.run=false;stickEl.classList.remove('active','run');stickEl.style.left=stickEl.style.top='';knob.style.transform='';}
function stationAt(cx,cy){
 const r=band.getBoundingClientRect();if(cy<r.top||cy>r.bottom)return null;
 const wx=cam+(cx-r.left)/cssScale,wy=VY+(cy-r.top)/cssScale;let best=null,bd=62*uiF;
 for(const s of stations){const d=Math.abs(wx-s.x);if(d<bd&&wy>345-72*uiF&&wy<345+48*uiF){best=s;bd=d;}}
 return best;
}
function tap(cx,cy){
 if(mode==='dialog'){setMode('play');return;}
 if(mode!=='play')return;
 const s=stationAt(cx,cy);if(!s)return;
 if(Math.abs(s.x-p.x)<100&&p.grounded)interact(s);else autoTarget=s;
}
frame.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch')setTouch(true);
 if(e.target.closest('button,.dialog,.overlay'))return;
 if(mode!=='play'&&mode!=='dialog')return;
 e.preventDefault();
 taps.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()});
 if(e.pointerType==='touch'&&stick.id===null&&e.clientX<frame.clientWidth*.5)stickStart(e);
});
window.addEventListener('pointermove',e=>{
 if(e.pointerId===stick.id)stickMove(e);
 else if(e.pointerType==='mouse')canvas.style.cursor=(mode==='play'&&stationAt(e.clientX,e.clientY))?'pointer':'';
});
function pointerEnd(e){
 if(e.pointerId===stick.id)stickEnd();
 const t=taps.get(e.pointerId);taps.delete(e.pointerId);
 if(t&&e.type==='pointerup'&&Math.hypot(e.clientX-t.x,e.clientY-t.y)<12&&performance.now()-t.t<350)tap(e.clientX,e.clientY);
}
window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);
for(const [id,fn] of [['jumpBtn',()=>jump()],['useBtn',()=>interact()]]){
 const b=byId(id);
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.classList.add('active');fn();});
 for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>b.classList.remove('active'));
}
frame.addEventListener('contextmenu',e=>e.preventDefault());

document.body.classList.toggle('touch',isTouch);
frame.dataset.mode=mode;
layout();updateUI();requestAnimationFrame(tick);
