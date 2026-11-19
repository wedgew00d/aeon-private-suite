/* AEON PRIVATE SUITE v0.8.8 mobile control adapter.
   Runs AFTER original v0.8.7 game script. Does not alter game art or core physics.
   X analog input is patched into the movement axis by the release build only. */
(function () {
 'use strict';
 const host = document.querySelector('.mobile-keys');
 if (!host || host.dataset.aeonMobile === 'v0.8.8') return;
 host.dataset.aeonMobile = 'v0.8.8';
 host.innerHTML = `
  <div id="aeonJoystick" class="aeon-joystick" role="application" aria-label="移動スティック：左右へドラッグ">
    <div id="aeonJoystickKnob" class="aeon-joystick-knob"></div>
  </div>
  <div class="aeon-actions">
    <button id="runTouch" class="aeon-action" aria-label="ダッシュ：押している間、移動速度アップ" type="button"><span class="action-icon">»</span><span class="action-label">DASH</span></button>
    <button id="jumpTouch" class="aeon-action" aria-label="ジャンプ" type="button"><span class="action-icon">↑</span><span class="action-label">JUMP</span></button>
  </div>
  <button id="useTouch" class="aeon-action" aria-label="調べる・会話を進める" type="button"><span class="action-icon">◇</span><span class="action-label">USE</span></button>
  <button id="pauseTouch" class="aeon-pause" aria-label="ポーズメニュー" type="button">Ⅱ</button>`;
 const frame = document.getElementById('gameFrame');
 const hint = document.createElement('div');
 hint.className = 'mobile-rotate-hint';
 hint.setAttribute('role', 'status');
 hint.innerHTML = '<div class="rotate-symbol" aria-hidden="true">▯ ↻</div><div>スマートフォンを横向きにしてください</div><small>AEON / PRIVATE SUITE<br>横画面でのプレイに最適化しています</small>';
 frame.appendChild(hint);
 const joystick = document.getElementById('aeonJoystick');
 const knob = document.getElementById('aeonJoystickKnob');
 const dash = document.getElementById('runTouch');
 const jumpButton = document.getElementById('jumpTouch');
 const useButton = document.getElementById('useTouch');
 const pauseButton = document.getElementById('pauseTouch');
 let stickPointer = null;
 let dashPointer = null;
 window.__aeonTouchAxis = 0;
 function clampStick(v, min, max){return Math.min(max, Math.max(min, v));}
 function updateStick(clientX, clientY){
   const r = joystick.getBoundingClientRect();
   const dx = clientX - (r.left + r.width/2);
   const dy = clientY - (r.top + r.height/2);
   const maximum = Math.min(r.width,r.height)*0.37;
   const distance = Math.hypot(dx,dy);
   const fraction = distance > maximum ? maximum/distance : 1;
   const x = dx*fraction/maximum;
   const y = dy*fraction/maximum;
   const deadzone = 0.16;
   const axis = Math.abs(x) <= deadzone ? 0 : Math.sign(x)*((Math.abs(x)-deadzone)/(1-deadzone));
   window.__aeonTouchAxis = clampStick(axis,-1,1);
   knob.style.transform = `translate(calc(-50% + ${dx*fraction}px),calc(-50% + ${dy*fraction}px))`;
 }
 function releaseStick(){
   stickPointer = null;
   window.__aeonTouchAxis = 0;
   knob.style.transform='translate(-50%,-50%)';
   joystick.classList.remove('active');
 }
 joystick.addEventListener('pointerdown', e => {
   if(stickPointer !== null) return;
   e.preventDefault();
   stickPointer=e.pointerId;
   joystick.setPointerCapture(e.pointerId);
   joystick.classList.add('active');
   updateStick(e.clientX,e.clientY);
 });
 joystick.addEventListener('pointermove', e => {
   if(stickPointer !== e.pointerId) return;
   e.preventDefault();
   updateStick(e.clientX,e.clientY);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
   joystick.addEventListener(type, e => {if(stickPointer===e.pointerId){e.preventDefault();releaseStick();}});
 }
 dash.addEventListener('pointerdown', e=>{
   if(dashPointer!==null)return;
   e.preventDefault(); dashPointer=e.pointerId;
   dash.setPointerCapture(e.pointerId);
   keys.run=true; dash.classList.add('active');
 });
 function releaseDash(e){if(dashPointer!==e.pointerId)return;e.preventDefault();dashPointer=null;keys.run=false;dash.classList.remove('active');}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])dash.addEventListener(type,releaseDash);
 function tapButton(button, callback){
   button.addEventListener('pointerdown',e=>{
     e.preventDefault();
     button.classList.add('active');
     button.setPointerCapture(e.pointerId);
     callback();
   });
   for(const type of ['pointerup','pointercancel','lostpointercapture']){
     button.addEventListener(type,()=>button.classList.remove('active'));
   }
 }
 tapButton(jumpButton,()=>jump());
 tapButton(useButton,()=>interact());
 tapButton(pauseButton,()=>{
   if(mode==='play')setMode('pause');
   else if(mode==='pause'||mode==='dialog')setMode('play');
 });
 // Higher-resolution backing canvas while keeping the original 1280x720 world coordinates.
 // Cap resolution for phone GPU performance and avoid stretching aspect ratio.
 let resizePending=false;
 function resizeCanvas(){
   resizePending=false;
   const bounds=canvas.getBoundingClientRect();
   if(!bounds.width||!bounds.height)return;
   const dpr=window.devicePixelRatio||1;
   const mobile=matchMedia('(pointer:coarse)').matches;
   const cap=mobile?1.25:1.5;
   const scale=clampStick(Math.min(bounds.width*dpr/W,bounds.height*dpr/H),.5,cap);
   const w=Math.round(W*scale),h=Math.round(H*scale);
   if(canvas.width===w&&canvas.height===h)return;
   canvas.width=w;canvas.height=h;
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   ctx.setTransform(w/W,0,0,h/H,0,0);
   if(ready)render();
 }
 function scheduleResize(){if(resizePending)return;resizePending=true;requestAnimationFrame(resizeCanvas);}
 window.addEventListener('resize',scheduleResize,{passive:true});
 window.addEventListener('orientationchange',()=>{releaseStick();keys.run=false;dash.classList.remove('active');dashPointer=null;scheduleResize();},{passive:true});
 window.addEventListener('blur',()=>{releaseStick();keys.run=false;dashPointer=null;dash.classList.remove('active');});
 if(typeof ResizeObserver==='function') new ResizeObserver(scheduleResize).observe(canvas);
 scheduleResize();
})();
