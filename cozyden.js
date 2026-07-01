"use strict";
/* =====================================================================
   COZYDEN — isometric room, free-walking avatar
   ===================================================================== */

/* ---------- ISO GEOMETRY ---------- */
const HW=92, HH=44;                  // half tile width / height (screen) — HH matches the
                                     // tile's top-face only (not its 3D thickness), so each
                                     // front tile overlaps and hides the edge behind it

const TW=205, TH=144;                // scaled floor tile image size
const TCX=104.4, TCY=78.4;           // floor-top-face centre within tile image
const COLS=6, ROWS=6;                // one line trimmed off each side of the floor
const OX=660, OY=430;                // back tile centre in world coords
const WORLD_W=1320, WORLD_H=1180;
const sx=(c,r)=>OX+(c-r)*HW;
const sy=(c,r)=>OY+(c+r)*HH;

const world   = document.getElementById("world");
const wallsSvg= document.getElementById("walls");
const lightsEl= document.getElementById("lights");

/* ---------- FOREST BACKDROP ----------
   The clearing art has a white iso "placemat" diamond meant to sit exactly under
   the house floor. We map the image's white-diamond corners onto the floor
   diamond's world corners. Floor diamond (world px): top(660,386) right(1212,650)
   bottom(660,914) left(108,650)  -> center (660,650), w 1104, h 528.
   White diamond (image px): left(851,1342) right(3278,1341) top(2066,725)
   bottom(2065,1971) -> center (2064.5,1348), w 2427, h 1246.            */
(function placeForest(){
  const IMG_W=4096, IMG_H=2304;
  const dW=2427, dH=1246, dcx=2064.5, dcy=1348;     // white diamond in image px
  const fW=1104, fH=528, fcx=660, fcy=650;          // floor diamond in world px
  const sX=fW/dW, sY=fH/dH;                          // independent scale -> exact corner match
  const bg=document.createElement("img");
  bg.id="forestBg";
  bg.src="uploads/forest-background-corrected.png";
  bg.style.position="absolute";
  bg.style.width=(IMG_W*sX)+"px";
  bg.style.height=(IMG_H*sY)+"px";
  bg.style.left=(fcx-dcx*sX)+"px";
  bg.style.top =(fcy-dcy*sY)+"px";
  bg.style.zIndex="0";
  bg.style.pointerEvents="none";
  bg.style.imageRendering="auto";
  world.insertBefore(bg, world.firstChild);
  // expose displayed bounds so the camera can frame the whole clearing
  window.__forestRect={ x:fcx-dcx*sX, y:fcy-dcy*sY, w:IMG_W*sX, h:IMG_H*sY };
})();

/* ---------- WALLS / ROOF (A-frame gable) ---------- */
const BT=[sx(0,0), sy(0,0)-HH];                 // back tip (top vertex of back tile)
const RT=[sx(COLS-1,0)+HW, sy(COLS-1,0)];       // right corner
const LT=[sx(0,ROWS-1)-HW, sy(0,ROWS-1)];       // left corner
const FT=[sx(COLS-1,ROWS-1), sy(COLS-1,ROWS-1)+HH]; // front tip
const WALL_H=158, PEAK_UP=62;
const PEAK=[OX, BT[1]-WALL_H-PEAK_UP];
const BT_top=[BT[0],BT[1]-WALL_H];
const RT_top=[RT[0],RT[1]-WALL_H];
const LT_top=[LT[0],LT[1]-WALL_H];
function poly(pts,fill,extra){return `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill}" ${extra||''}/>`;}
wallsSvg.innerHTML = `
  <defs>
    <linearGradient id="wlL" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5d6f57"/><stop offset="1" stop-color="#3f4d3b"/>
    </linearGradient>
    <linearGradient id="wlR" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#697b60"/><stop offset="1" stop-color="#4a5944"/>
    </linearGradient>
    <linearGradient id="rf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4a33"/><stop offset="1" stop-color="#4f3623"/>
    </linearGradient>
  </defs>
  ${/* roof slabs behind walls */''}
  ${poly([PEAK,[PEAK[0]-30,PEAK[1]+8],[LT_top[0]-34,LT_top[1]+10],LT_top],"url(#rf)")}
  ${poly([PEAK,[PEAK[0]+30,PEAK[1]+8],[RT_top[0]+34,RT_top[1]+10],RT_top],"url(#rf)")}
  ${/* left + right gable walls */''}
  ${poly([BT,LT,LT_top,PEAK],"url(#wlL)")}
  ${poly([BT,RT,RT_top,PEAK],"url(#wlR)")}
  ${/* skylight panes hinted on right slope */''}
  ${poly([[PEAK[0]+6,PEAK[1]+30],[RT_top[0]+10,RT_top[1]+24],[RT_top[0]+10,RT_top[1]+74],[PEAK[0]+6,PEAK[1]+80]],"rgba(150,180,200,.10)")}
`;

/* window hot-zone (HTML, clickable) — geometry computed from the right wall */
(function buildWindow(){
  const e1=[RT[0]-BT[0], RT[1]-BT[1]];
  const P=(u,v)=>[BT[0]+u*e1[0], BT[1]+u*e1[1]-v*WALL_H];
  // window.png is an iso window already oriented like the right wall.
  // Map its two top-frame outer corners onto the wall to derive uniform scale + offset.
  const IMG_W=1674, IMG_H=1494;
  const tl=[268,126], tr=[1395,683];          // top-left / top-right frame corners (image px)
  const wTL=P(0.25,0.88), wTR=P(0.60,0.88);  // where those corners sit on the wall
  const s=(wTR[0]-wTL[0])/(tr[0]-tl[0]);      // uniform scale from horizontal corner span
  const img=document.createElement("img");
  img.id="winImg";
  img.className="window-hot";
  img.src="uploads/window-view-1f799219.png";
  img.style.position="absolute";
  img.style.width=(IMG_W*s)+"px";
  img.style.height=(IMG_H*s)+"px";
  img.style.left=(wTL[0]-tl[0]*s)+"px";
  img.style.top =(wTL[1]-tl[1]*s)+"px";
  img.style.zIndex="6";
  img.style.imageRendering="pixelated";
  img.addEventListener("click",()=>trigger("look"));
  world.appendChild(img);

  // hover tooltip (matches furniture tips)
  const mid=[(wTL[0]+wTR[0])/2,(wTL[1]+wTR[1])/2];
  const tip=document.createElement("div");
  tip.className="hot-tip";
  tip.textContent="Look Outside";
  tip.style.left=mid[0]+"px";
  tip.style.top=(mid[1]-30)+"px";
  world.appendChild(tip);
  img.addEventListener("mouseenter",()=>tip.classList.add("show"));
  img.addEventListener("mouseleave",()=>tip.classList.remove("show"));
})();

/* ---------- STRING LIGHTS along both slopes ---------- */
function placeLights(){
  const mk=(a,b,flip)=>{
    const img=document.createElement("img");
    img.src="uploads/lights.png";
    const dx=b[0]-a[0], dy=b[1]-a[1];
    const len=Math.hypot(dx,dy);
    const ang=Math.atan2(dy,dx)*180/Math.PI;
    img.style.width=len+"px";
    img.style.left=a[0]+"px"; img.style.top=a[1]+"px";
    img.style.transformOrigin="top left";
    img.style.transform=`rotate(${ang}deg)`+(flip?" scaleY(-1)":"");
    img.style.opacity=".95";
    lightsEl.appendChild(img);
  };
  mk([PEAK[0]-6,PEAK[1]+44],[LT_top[0]+18,LT_top[1]+34],true);
  mk([PEAK[0]+6,PEAK[1]+44],[RT_top[0]-18,RT_top[1]+34],false);
}
/* sparkles riding the light strings */
function placeSparks(){
  const along=(a,b,n)=>{for(let i=1;i<n;i++){const t=i/n;
    const s=document.createElement("div");s.className="spark";
    s.style.left=(a[0]+(b[0]-a[0])*t-6)+"px";
    s.style.top=(a[1]+(b[1]-a[1])*t+10-6)+"px";
    s.style.animationDelay=(-(i*0.4)%2.6)+"s";
    s.style.animationDuration=(2.1+(i%5)*0.4)+"s";
    lightsEl.appendChild(s);}};
  along([PEAK[0]-6,PEAK[1]+44],[LT_top[0]+18,LT_top[1]+34],8);
  along([PEAK[0]+6,PEAK[1]+44],[RT_top[0]-18,RT_top[1]+34],8);
}
/* ---------- GLASS A-FRAME ROOF (image) ----------
   Placed so the art's lower-left / lower-right corner tips land exactly on the
   left and right wall top corners (LT_top, RT_top). Uniform scale keeps the
   roof undistorted. Roof corner tips in image px: left(188,900) right(2023,895). */
(function placeRoof(){
  const IMG_W=2229, IMG_H=1639;
  const lc=[188,900], rc=[2023,895];                 // roof corner tips (image px)
  const s=(RT_top[0]-LT_top[0])/(rc[0]-lc[0]);        // uniform scale from corner span
  const roof=document.createElement("img");
  roof.id="roofTop";
  roof.src="uploads/roof-top.png";
  roof.style.position="absolute";
  roof.style.width=(IMG_W*s)+"px";
  roof.style.height=(IMG_H*s)+"px";
  roof.style.left=(LT_top[0]-lc[0]*s)+"px";
  roof.style.top =(LT_top[1]-lc[1]*s)+"px";
  roof.style.zIndex="80";
  roof.style.pointerEvents="none";
  world.appendChild(roof);
})();

/* ---------- FLOOR TILES ---------- */
const tileLayer=document.createDocumentFragment();
for(let r=0;r<ROWS;r++){
  for(let c=0;c<COLS;c++){
    const t=document.createElement("div");
    t.className="tile";
    t.style.left=(sx(c,r)-TCX)+"px";
    t.style.top =(sy(c,r)-TCY)+"px";
    t.style.zIndex=String(c+r+1);
    t.dataset.c=c; t.dataset.r=r;
    t.innerHTML=`<img src="assets/floor_tile.png" alt=""><div class="hl"></div>`;
    t.addEventListener("click",()=>{ if(!moving) walkFree(+t.dataset.c,+t.dataset.r); });
    tileLayer.appendChild(t);
  }
}
world.appendChild(tileLayer);

/* ---------- FLOOR DECALS ---------- */
function diamond(cx,cy,wScale){
  const w=HW*2*wScale, h=HH*2*wScale;
  return {w,h,left:cx-w/2,top:cy-h/2};
}
function addDecal(col,row,wScale,fill,cls,onclick,label){
  const cx=sx(col,row), cy=sy(col,row);
  const d=diamond(cx,cy,wScale);
  const el=document.createElement("div");
  el.className="decal"+(cls?(" "+cls):"");
  el.style.left=d.left+"px"; el.style.top=d.top+"px";
  el.style.width=d.w+"px"; el.style.height=d.h+"px";
  el.style.zIndex=String(Math.round((col+row))*1+1)+"";
  el.style.zIndex=String(col+row+1);
  el.innerHTML=`<div class="face" style="background:${fill};clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);box-shadow:inset 0 0 24px rgba(0,0,0,.18);"></div>`;
  if(onclick){el.classList.add("click");el.style.cursor="pointer";el.addEventListener("click",onclick);
    el.title=label||"";}
  world.appendChild(el);
  return el;
}

/* ---------- FURNITURE ---------- */
const NAT={console:[369,298],ladder:[320,346],wallart:[225,299],fireplace:[440,584],
  bookshelf:[271,371],plant:[260,349],gong:[369,392],desk:[381,353],yoga:[723,378],
  poufP:[284,162],chairSit:[193,294],chairEmpty:[264,330]};
function addFurn(opt){
  const [nw,nh]=opt.nat;
  const w=opt.w, h=w*nh/nw;
  const cx=sx(opt.col,opt.row), cy=sy(opt.col,opt.row);
  const el=document.createElement("div");
  el.className="furn"+(opt.act?" click":"");
  el.style.width=w+"px";
  el.style.left=(cx-w/2+(opt.nx||0))+"px";
  el.style.top =(cy-h +(opt.ny||0))+"px";
  el.style.zIndex=String(100+Math.round((opt.col+opt.row)*10)+(opt.zb||0));
  el.innerHTML=`<img src="${opt.src}" alt="">`+(opt.act?`<div class="tip">${opt.tip}</div>`:"");
  if(opt.act) el.addEventListener("click",()=>trigger(opt.act));
  if(opt.clip){ el.classList.add("shaped"); el.querySelector("img").style.clipPath=opt.clip; }
  world.appendChild(el);
  return el;
}
addFurn({src:"uploads/console.png",     nat:NAT.console,  w:200, col:0.3, row:3.9, ny:16, act:"brain",  tip:"Brain Games"});
addFurn({src:"uploads/ladder-shelf.png",nat:NAT.ladder,   w:138, col:0.15,row:4.85, ny:8});
addFurn({src:"uploads/wall-art.png",    nat:NAT.wallart,  w:114, col:-0.6,row:0.5, ny:0, act:"zen", tip:"Daily Zen", zb:-40});
addFurn({src:"uploads/fireplace.png",   nat:NAT.fireplace,w:186, col:-0.5, row:1.6, ny:34, zb:-30});
addFurn({src:"uploads/radio.png",       nat:NAT.bookshelf,w:150, col:4.8, row:0.15, ny:12, act:"cosy", tip:"Cosy Beats"});
addFurn({src:"uploads/plant.png",       nat:NAT.plant,    w:108, col:0.35, row:0.0, ny:4});
addFurn({src:"uploads/gong.png",        nat:NAT.gong,     w:164, col:3.0, row:5.0, ny:12, act:"mindful", tip:"Mindful Breath"});
addFurn({src:"uploads/yoga-mat.png",    nat:NAT.yoga,     w:370, col:1.85, row:2.35, ny:24, zb:-25, act:"quick", tip:"Quick Stretch",
  clip:"polygon(14.9% 62.4%, 17.4% 62.2%, 19.9% 62.2%, 22.4% 59.8%, 24.9% 57.4%, 27.4% 53.7%, 29.9% 51.6%, 32.4% 49.7%, 34.9% 47.4%, 37.3% 45.0%, 39.8% 42.6%, 42.3% 40.2%, 44.8% 38.1%, 47.3% 35.7%, 49.8% 32.8%, 52.3% 31.0%, 54.8% 28.6%, 57.3% 25.4%, 59.8% 23.0%, 62.2% 20.6%, 64.7% 19.6%, 67.2% 22.2%, 69.7% 24.6%, 72.2% 27.0%, 74.7% 29.4%, 77.2% 31.5%, 79.7% 33.9%, 82.2% 36.2%, 84.6% 38.6%, 84.6% 41.8%, 82.2% 44.2%, 79.7% 46.6%, 77.2% 48.9%, 74.7% 51.3%, 72.2% 54.0%, 69.7% 56.1%, 67.2% 58.5%, 64.7% 60.6%, 62.2% 63.0%, 59.8% 65.9%, 57.3% 68.0%, 54.8% 70.4%, 52.3% 72.8%, 49.8% 75.1%, 47.3% 77.5%, 44.8% 79.9%, 42.3% 82.5%, 39.8% 84.7%, 37.3% 87.3%, 34.9% 89.4%, 32.4% 87.6%, 29.9% 85.4%, 27.4% 83.1%, 24.9% 80.4%, 22.4% 78.0%, 19.9% 75.7%, 17.4% 73.5%, 14.9% 70.9%)"});
const deskEl =addFurn({src:"uploads/desk.png", nat:NAT.desk, w:222, col:4.35,row:3.25, ny:8, act:"pomodoro", tip:"Pomodoro Timer"});

/* desk chair: seated girl (working) <-> empty office chair (away) */
const DESK_CELL={col:3.0,row:2.8};
const chairEl=document.createElement("div");
chairEl.className="furn";
chairEl.style.zIndex=String(100+Math.round((DESK_CELL.col+DESK_CELL.row)*10)+2);
world.appendChild(chairEl);
function renderChair(seated){
  const nat = seated?NAT.chairSit:NAT.chairEmpty;
  const w = seated?108:122;
  const h = w*nat[1]/nat[0];
  const cx=sx(DESK_CELL.col,DESK_CELL.row), cy=sy(DESK_CELL.col,DESK_CELL.row);
  chairEl.style.width=w+"px";
  chairEl.style.left=(cx-w/2+(seated?0:-2))+"px";
  chairEl.style.top =(cy-h+10)+"px";
  chairEl.innerHTML=`<img src="${seated?'uploads/chair.png':'uploads/chair-39ae6467.png'}" alt="">`;
}

/* =====================================================================
   SPRITE ANIMATION CONTROLLER
   ---------------------------------------------------------------------
   A small game-engine style controller. Every frame is a pre-normalised
   200x300 PNG: the character is scaled to a constant body height and its
   feet are anchored at (FEET_X, FEET_Y) within that canvas, so swapping
   frames never makes her jump or resize.

   - State machine:   player.state  = 'IDLE' | 'WALKING'
                      player.dir    = 'down' | 'up' | 'left' | 'right'
   - Frame ticker:    an independent requestAnimationFrame loop advances the
                      WALK frame index at a fixed cadence (FRAME_MS), decoupled
                      from spatial translation — so the legs cycle at a steady
                      rate regardless of how far/fast she travels.
   - Translation:     a separate tween moves the sprite box with translate3d.
   - On stop:         state snaps to IDLE and the matching directional idle
                      frame is shown (never frozen mid-stride).
   ===================================================================== */
const SHEET_W=240, SHEET_H=320, FEET_X=120, FEET_Y=292;  // geometry of every baked frame

/* Verbatim walk frames (normalised to a constant body height with feet planted
   at FEET_X/FEET_Y). Each direction is a 4-step loop that threads the neutral
   standing frame between the two stride poses:  w1 → idle → w2 → idle → … */
const FRAMES={};
["down_idle","down_w1","down_w2","up_idle","up_w1","up_w2",
 "left_idle","left_w1","left_w2","right_idle","right_w1","right_w2"]
 .forEach(k=>{ FRAMES[k]="assets/walk/"+k+".png"; const i=new Image(); i.src=FRAMES[k]; });

const DIRS={
  // down  = walk front  → front      → walk front 2 → front
  down: {idle:"down_idle",  walk:["down_w1","down_idle","down_w2","down_idle"]},
  // up    = walk back   → back       → walk back 2  → back
  up:   {idle:"up_idle",    walk:["up_w1","up_idle","up_w2","up_idle"]},
  // left  = walk left   → stand left → walk left 2  → stand left
  left: {idle:"left_idle",  walk:["left_w1","left_idle","left_w2","left_idle"]},
  // right = walk right  → stand right→ walk right 2 → stand right
  right:{idle:"right_idle", walk:["right_w1","right_idle","right_w2","right_idle"]}
};
const FACE2DIR={standFront:"down",standBack:"up",standLeft:"left",standRight:"right"};

const CHAR_H=196;                  // on-screen height of the sprite box (world px)
const CHAR_W=CHAR_H*SHEET_W/SHEET_H;
const FOOT_DY=6;                   // sink feet slightly below the tile centre
const BOX_FEET_X=CHAR_W*FEET_X/SHEET_W;
const BOX_FEET_Y=CHAR_H*FEET_Y/SHEET_H;

const DIR_ROW={down:0, up:1, left:2, right:3};   // row order inside the combined sheet
const SHEET_ALL="assets/walk/sheet_all.png";
{ const i=new Image(); i.src=SHEET_ALL; }            // preload the single combined sheet

const FRAME_MS=120;                // ms per walk frame
const CYCLE_MS=FRAME_MS*4;         // full 4-frame loop duration

const charEl=document.createElement("div");
charEl.id="charSprite";
charEl.style.width=CHAR_W+"px";
charEl.style.height=CHAR_H+"px";
charEl.style.setProperty("--sheetw",(CHAR_W*4)+"px");   // 4 frame columns
charEl.style.setProperty("--sheeth",(CHAR_H*4)+"px");   // 4 direction rows
charEl.style.setProperty("--cw",CHAR_W+"px");           // one cell width (per-frame pan step)
charEl.style.setProperty("--cycle",CYCLE_MS+"ms");
charEl.style.backgroundImage=`url("${SHEET_ALL}")`;     // set ONCE, never swapped -> no flash
world.appendChild(charEl);

const char={c:DESK_CELL.col,r:DESK_CELL.row,atDesk:true};
const player={dir:"down"};
let moving=false, arriveTimer=null;

/* =====================================================================
   COMPOSITOR-DRIVEN AVATAR
   ---------------------------------------------------------------------
   Lesson learned the hard way: this preview pane throttles AND fully pauses
   every JS timer (requestAnimationFrame *and* setInterval) whenever it loses
   priority. Any JS-per-frame approach therefore stalls intermittently — the
   sprite glides while the legs freeze on one frame.

   So nothing here runs per-frame in JS. Both jobs live on the COMPOSITOR,
   which keeps animating even while JS is paused:
     • leg cycle — a CSS steps(4) keyframe animation pans a 4-cell sprite sheet
     • movement  — a CSS transform transition eases the box between tiles
   JS only: picks the direction (which sheet), toggles the .walking class, and
   sets the transform target. A single setTimeout snaps to standing on arrival
   (if it fires late under throttling she simply walks-in-place a touch longer —
   never a frozen glide).
   ===================================================================== */
function boxXY(c,r){ return {x:sx(c,r)-BOX_FEET_X, y:sy(c,r)+FOOT_DY-BOX_FEET_Y}; }
function placeAt(c,r,instant){
  if(instant) charEl.style.transition="none";
  const p=boxXY(c,r);
  charEl.style.transform=`translate3d(${p.x}px, ${p.y}px, 0)`;
  charEl.style.zIndex=String(100+Math.round((c+r)*10)+6);
}
function place(){ placeAt(char.c,char.r,true); }   // instant (re)placement at current cell
function liveBoxXY(){                              // current ON-SCREEN box position (mid-transition aware)
  const t=getComputedStyle(charEl).transform;
  if(!t||t==="none") return boxXY(char.c,char.r);
  const m=new DOMMatrixReadOnly(t);
  return {x:m.m41, y:m.m42};
}

function setRow(dir){             // pick the direction row via vertical offset (no image swap)
  player.dir=dir;
  charEl.style.setProperty("--row", `-${DIR_ROW[dir]*CHAR_H}px`);
}
function showIdle(dir){            // stop the cycle, show the neutral standing frame (col 1)
  setRow(dir);
  charEl.classList.remove("walking");
  charEl.style.backgroundPositionX=`-${CHAR_W}px`;        // neutral stand cell
}
function startWalk(dir){           // begin the looping CSS leg cycle for a direction
  setRow(dir);                     // direction = vertical offset only (no image swap)
  charEl.style.backgroundPositionX="0px";
  charEl.classList.add("walking");
}
/* back-compat helper used by callers that pass facing strings */
function setSprite(face){ showIdle(FACE2DIR[face]||"down"); }

function showChar(){charEl.style.display="block";}
function hideChar(){charEl.style.display="none";}

function leaveDesk(){
  if(char.atDesk){ char.atDesk=false; renderChair(false); showChar(); }
}
function dirFromVector(dxs,dys){
  // Diagonal arbitration: iso horizontal moves have a shallow screen angle, so
  // favour the left/right profile unless the leg is clearly steeper than wide
  // (then use the vertical up/down walk). Prevents awkward sideways sliding.
  return Math.abs(dys) > Math.abs(dxs)*1.25 ? (dys<0?"up":"down") : (dxs<0?"left":"right");
}

function walk(tc,tr,face,done){
  leaveDesk();
  clearTimeout(arriveTimer);

  // Start from the LIVE on-screen position so re-entry / interrupts never teleport
  // her to the previous target (the "reappears across the room" bug).
  const cur = moving ? liveBoxXY() : boxXY(char.c,char.r);
  const tgt = boxXY(tc,tr);
  const dxs = tgt.x-cur.x, dys = tgt.y-cur.y;
  const dist = Math.hypot(dxs,dys);

  if(dist<3){                       // already there — no walk, just face & stand
    moving=false;
    char.c=tc; char.r=tr; placeAt(tc,tr,true);
    showIdle(FACE2DIR[face]||"down");
    if(done)done();
    return;
  }
  const dir=dirFromVector(dxs,dys);
  const speed=235;                  // world px / second
  const dur=Math.round(Math.max(650, dist/speed*1000));

  // Pin the transform to the CURRENT visual position with NO transition first —
  // this is a no-op move (cur === where she already is) so there is no flash and
  // no jump, even when interrupting an in-flight walk.
  charEl.style.transition="none";
  charEl.style.transform=`translate3d(${cur.x}px, ${cur.y}px, 0)`;
  charEl.style.zIndex=String(100+Math.round((tc+tr)*10)+6);   // sit above by destination depth
  startWalk(dir);                   // legs start cycling (compositor); same sheet -> no decode flash
  moving=true;
  char.c=tc; char.r=tr;             // logical position is now the target
  void charEl.offsetWidth;          // commit the start transform before transitioning
  charEl.style.transition=`transform ${dur}ms linear`;
  charEl.style.transform=`translate3d(${tgt.x}px, ${tgt.y}px, 0)`;   // ease to target (compositor)

  arriveTimer=setTimeout(()=>{
    moving=false;
    placeAt(tc,tr,true);            // exact final placement + correct depth z-index
    showIdle(dir);                  // snap to the matching standing image
    if(done)done();
  }, dur+20);
}
function walkFree(c,r){ walk(c,r,"standFront"); }
function returnToDesk(done){
  walk(DESK_CELL.col,DESK_CELL.row,"standFront",()=>{
    hideChar(); char.atDesk=true; renderChair(true); if(done)done();
  });
}

/* init at desk, working */
renderChair(true); setSprite("standFront"); place(); hideChar();

/* ---------- WORLD SCALE (fill width, keep floor in frame) ---------- */
const stage=document.getElementById("stage");
const worldScale=document.getElementById("worldScale");
/* Scale anchor = the HOUSE. Its left/right corners (world x 108 & 1212) are
   pinned to the stage's left and right edges at every browser size; the forest
   simply bleeds past the edges. Vertically the floor is anchored near the bottom
   so the room + avatar stay in view (the roof peak crops first on short
   viewports). */
const PAD=92;                                  // small forest gutter (world px) on each side
const HOUSE={x:108-PAD, w:1104+PAD*2, y:-52, h:968};
function fit(){
  const W=stage.clientWidth, H=stage.clientHeight;
  const pad = window.innerWidth <= 768 ? -90 : PAD;
  const hx = 108 - pad, hw = 1104 + pad*2;
  const s=W/hw;
  const cx=W/2-(hx+hw/2)*s;
  const scaledH=HOUSE.h*s;
  const cy = scaledH>H
    ? H-(HOUSE.y+HOUSE.h)*s-28
    : H/2-(HOUSE.y+HOUSE.h/2)*s;
  worldScale.style.transform=`translate(${cx}px,${cy}px) scale(${s})`;
}
window.addEventListener("resize",fit);
window.addEventListener("load",fit);
if(window.ResizeObserver){ new ResizeObserver(fit).observe(stage); }
requestAnimationFrame(()=>requestAnimationFrame(fit));
fit();

/* =====================================================================
   ACTIVITIES
   ===================================================================== */
const ACT={
  cosy:    {title:"Cosy Beats",     icon:"cosy",     color:"#bcaedb"},
  mindful: {title:"Mindful Breath", icon:"mindful",  color:"#9ec7c2"},
  quick:   {title:"Quick Stretch",  icon:"quick",    color:"#e8c98a"},
  pomodoro:{title:"Pomodoro Timer", icon:"pomodoro", color:"#df9d86"},
  brain:   {title:"Brain Games",    icon:"brain",    color:"#a9c79b"},
  look:    {title:"Look Outside",   icon:"look",     color:"#9dbdd9"},
  zen:     {title:"Daily Zen",      icon:"zen",      color:"#ecdfc0"}
};
/* floor cell the avatar walks to for each activity + facing */
const SPOTS={
  cosy:    {c:4.0, r:1.5,  face:"standRight"},
  mindful: {c:3.0, r:4.1,  face:"standFront"},
  quick:   {c:2.1, r:2.6,  face:"standFront"},
  pomodoro:{sit:true},
  brain:   {c:1.5, r:4.0,  face:"standLeft"},
  look:    {c:2.2, r:1.2, face:"standBack"},
  zen:     {c:0.9, r:0.8,  face:"standBack"}
};

const backdrop=document.getElementById("backdrop");
const modal=document.getElementById("modal");
const modalHead=document.getElementById("modalHead");
const modalIcon=document.getElementById("modalIcon");
const modalTitle=document.getElementById("modalTitle");
const modalBody=document.getElementById("modalBody");
let actCleanup=null;

function setActivePill(act){
  document.querySelectorAll("#sidebar .pill").forEach(p=>p.classList.toggle("active",p.dataset.act===act));
}
function trigger(act){
  if(!ACT[act]||moving) return;
  if(act==="pomodoro"){ setActivePill("pomodoro"); returnToDesk(openPomo); return; }
  if(act==="brain"){
    setActivePill("brain");
    const sp=SPOTS.brain;
    walk(sp.c, sp.r, sp.face, ()=>{ location.href="games/index.html"; });
    return;
  }
  setActivePill(act);
  const sp=SPOTS[act];
  if(sp.sit){
    returnToDesk(()=>openModal(act));
  }else{
    walk(sp.c,sp.r,sp.face,()=>openModal(act));
  }
}
function openModal(act){
  closeContent();
  const a=ACT[act];
  modalIcon.src="assets/icons/"+a.icon+".png";
  modalTitle.textContent=a.title;
  modalHead.style.background=a.color;
  modal.classList.toggle("wide", act==="brain");
  modal.classList.toggle("big", act==="look");
  modalBody.innerHTML="";
  (RENDER[act]||(()=>{}))(modalBody);
  backdrop.classList.add("open");
}
function closeContent(){ if(actCleanup){actCleanup();actCleanup=null;} }
function closeActivity(){
  closeContent();
  modalBody.innerHTML="";   // tear down embedded videos/iframes so they stop playing
  backdrop.classList.remove("open");
  setActivePill(null);
  if(!char.atDesk) returnToDesk();
}
document.getElementById("modalClose").addEventListener("click",closeActivity);
backdrop.addEventListener("click",e=>{ if(e.target===backdrop) closeActivity(); });
window.addEventListener("keydown",e=>{ if(e.key==="Escape"&&backdrop.classList.contains("open")) closeActivity(); });
document.querySelectorAll("#sidebar .pill").forEach(p=>p.addEventListener("click",()=>trigger(p.dataset.act)));

/* =====================================================================
   MODAL RENDERERS
   ===================================================================== */
const RENDER={};
const YT="https://www.youtube.com/embed/";
const VID={ mindful:"inpok4MKVLM", quick:"Kvoq4luIYVc", pomodoro:"mNvU0NqHmIk", look:"liRbVmWEn-Y" };
function ytEmbed(id,extra){return `<div class="videoframe"><iframe src="${YT}${id}?rel=0${extra||""}" title="video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;}

const STATIONS=[
  {name:"Forest Chill",          src:"uploads/lofidreams-forest-chill-lofi-365945.mp3"},
  {name:"Essence of the Forest", src:"uploads/purrplecat-essence-of-the-forest-457465.mp3"},
  {name:"Rainy Day",             src:"uploads/clavier-music-rainy-day-lofi-guitar-drums-piano-216566.mp3"},
  {name:"Lo-Fi Rain",            src:"uploads/saavane-lofi-rain-198277.mp3"},
  {name:"Damp Earth Zen",        src:"uploads/cfl_turningpages-damp-earth-zen-lofi-469298.mp3"},
  {name:"Chillhood",            src:"uploads/lofium-lofi-relax-chillhood-by-lofium-123327.mp3"}
];
RENDER.cosy=(b)=>{
  b.innerHTML=`<div class="cosy">
    <div class="vinyl" id="vinyl"></div>
    <div class="nowp" id="nowp">${STATIONS[radioState.station].name}</div>
    <div class="stations" id="stations">${STATIONS.map((s,i)=>`<button class="chip${i===radioState.station?" sel":""}" data-i="${i}">${s.name}</button>`).join("")}</div>
    <div class="row"><button class="btn primary" id="play">${radioState.playing?"Pause":"Play"}</button></div>
    <div class="vol"><span style="font-size:18px">🔈</span><input type="range" id="vol" min="0" max="100" value="${Math.round(radioState.volume*100)}"><span style="font-size:18px">🔊</span></div>
    <div class="note">Pick a record to set the mood — each one loops while you settle in.</div>
  </div>`;
  const vinyl=b.querySelector("#vinyl"),playBtn=b.querySelector("#play"),nowp=b.querySelector("#nowp");
  function refresh(){vinyl.classList.toggle("spin",radioState.playing);playBtn.textContent=radioState.playing?"Pause":"Play";nowp.textContent=STATIONS[radioState.station].name;}
  refresh();
  playBtn.addEventListener("click",()=>{radioState.playing?stopRadio():startRadio();refresh();});
  b.querySelectorAll(".chip").forEach(c=>c.addEventListener("click",()=>{
    radioState.station=+c.dataset.i;b.querySelectorAll(".chip").forEach(x=>x.classList.toggle("sel",x===c));
    tuneRadio();nowp.textContent=STATIONS[radioState.station].name;}));
  b.querySelector("#vol").addEventListener("input",e=>{radioState.volume=e.target.value/100;applyVolume();});
};
RENDER.mindful=(b)=>{
  b.innerHTML=`<div class="breath">
    <div class="circle" id="circle">Ready</div>
    <div class="row"><button class="btn primary" id="bgo">Begin breathing</button></div>
  </div>`;
  const circle=b.querySelector("#circle"),go=b.querySelector("#bgo");
  let on=false,iv=null,phase=0;
  const phases=[{t:"Breathe in",s:1.22},{t:"Hold",s:1.22},{t:"Breathe out",s:0.74},{t:"Hold",s:0.74}];
  function stepf(){const p=phases[phase%phases.length];circle.textContent=p.t;circle.style.transform="scale("+p.s+")";phase++;}
  function start(){on=true;go.textContent="Stop";phase=0;stepf();iv=setInterval(stepf,4000);}
  function stop(){on=false;go.textContent="Begin breathing";circle.textContent="Ready";circle.style.transform="scale(1)";if(iv)clearInterval(iv);}
  go.addEventListener("click",()=>on?stop():start());
  actCleanup=()=>{if(iv)clearInterval(iv);};
};
RENDER.quick=(b)=>{ b.innerHTML=ytEmbed(VID.quick,"&start=12")+`<div class="note">A few minutes to loosen up — stretch along whenever you need a break.</div>`; };
function bellChime(){
  try{
    const a=new (window.AudioContext||window.webkitAudioContext)();
    const now=a.currentTime;
    // two soft strikes, each a decaying bell — about 3 seconds total
    [0,0.7].forEach((start,strike)=>{
      [880,1320,1760].forEach((f,i)=>{
        const o=a.createOscillator(),g=a.createGain();
        o.type="sine"; o.frequency.value=f;
        o.connect(g); g.connect(a.destination);
        const t=now+start+i*0.16, peak=(0.2/(i+1))*(1-strike*0.18);
        g.gain.setValueAtTime(0,t);
        g.gain.linearRampToValueAtTime(peak,t+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,t+2.3);
        o.start(t); o.stop(t+2.4);
      });
    });
  }catch(e){}
}

let pomoBuilt=false;
function buildPomo(b){
  const MODES={focus:{label:"Focus",min:25,col:"#df9d86"},short:{label:"Short Break",min:5,col:"#a9c79b"},long:{label:"Long Break",min:15,col:"#9dbdd9"}};
  let mode="focus", left=MODES.focus.min*60, total=left, iv=null, running=false;
  b.innerHTML=`<div class="pomo">
    <div class="pmodes">
      ${Object.entries(MODES).map(([k,m])=>`<button class="pmode${k==="focus"?" on":""}" data-m="${k}">${m.label}</button>`).join("")}
    </div>
    <div class="pdial">
      <svg viewBox="0 0 220 220"><circle class="ptrack" cx="110" cy="110" r="100"/><circle class="pfill" cx="110" cy="110" r="100"/></svg>
      <div class="ptime"><div class="pclock">25:00</div><div class="pstate">Focus</div></div>
    </div>
    <div class="row">
      <button class="btn primary" id="pstart">Start</button>
      <button class="btn sm" id="preset">Reset</button>
    </div>
  </div>`;
  const clock=b.querySelector(".pclock"), state=b.querySelector(".pstate"),
        fill=b.querySelector(".pfill"), dial=b.querySelector(".pdial"),
        startBtn=b.querySelector("#pstart"), C=2*Math.PI*100;
  fill.style.strokeDasharray=C;
  function paint(){
    const m=Math.floor(left/60), s=left%60;
    clock.textContent=`${m}:${String(s).padStart(2,"0")}`;
    fill.style.strokeDashoffset=C*(1-left/total);
    fill.style.stroke=MODES[mode].col; dial.style.setProperty("--pc",MODES[mode].col);
  }
  function stop(){ clearInterval(iv); iv=null; running=false; startBtn.textContent="Start"; }
  function setMode(k){ mode=k; total=left=MODES[k].min*60; state.textContent=MODES[k].label;
    b.querySelectorAll(".pmode").forEach(x=>x.classList.toggle("on",x.dataset.m===k)); stop(); paint(); }
  function tick(){ if(left>0){ left--; paint(); } else { stop(); bellChime(); } }
  startBtn.addEventListener("click",()=>{ if(running){ stop(); }
    else { if(left===0){ left=total; } running=true; startBtn.textContent="Pause"; iv=setInterval(tick,1000); } });
  b.querySelector("#preset").addEventListener("click",()=>{ stop(); left=total; paint(); });
  b.querySelectorAll(".pmode").forEach(x=>x.addEventListener("click",()=>setMode(x.dataset.m)));
  paint();
  // expose a stop hook so closing the widget halts the timer
  buildPomo.stop=stop;
}
function openPomo(){
  const w=document.getElementById("pomoWidget");
  if(!pomoBuilt){ buildPomo(document.getElementById("pwBody")); pomoBuilt=true; }
  w.classList.add("open"); w.setAttribute("aria-hidden","false");
}
function closePomo(){
  const w=document.getElementById("pomoWidget");
  if(buildPomo.stop) buildPomo.stop();
  w.classList.remove("open"); w.setAttribute("aria-hidden","true");
  if(document.querySelector('#sidebar .pill[data-act="pomodoro"]'))
    document.querySelector('#sidebar .pill[data-act="pomodoro"]').classList.remove("active");
}
document.getElementById("pwClose").addEventListener("click",closePomo);
RENDER.look=(b)=>{ b.innerHTML=`<div class="videoframe"><iframe src="https://www.youtube.com/embed/liRbVmWEn-Y?si=aiRvkZDAqRJCaNu2&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`+`<div class="note">A calm view to rest your eyes on for a while.</div>`; };

const GAMES=[
  {name:"Memory Match", tag:"Built-in", emoji:"🧠", builtin:true},
  // Temporarily removed — don't work well on mobile. Re-add when ready:
  // {name:"Tetris",    tag:"Embed", emoji:"🟦", url:"https://tetris.com/play-tetris"},
  // {name:"Sudoku",    tag:"Embed", emoji:"🔢", url:"https://sudoku.com/"},
  // {name:"Solitaire", tag:"Embed", emoji:"🃏", url:"https://www.solitr.com/"},
];
RENDER.brain=(b)=>{
  function gallery(){
    b.innerHTML=`<div class="games">${GAMES.map((g,i)=>`
      <div class="gcard" data-i="${i}"><div class="gthumb">${g.emoji}</div>
      <div class="gname">${g.name}</div><div class="gtag">${g.tag}</div></div>`).join("")}</div>`;
    b.querySelectorAll(".gcard").forEach(c=>c.addEventListener("click",()=>open(+c.dataset.i)));
  }
  function open(i){
    const g=GAMES[i];
    if(g.builtin){memoryGame(b,gallery);return;}
    if(g.placeholder){
      b.innerHTML=`<button class="btn sm" id="back">‹ Back</button>
        <div class="note" style="margin-top:14px">Paste your monetised game embed URL into the GAMES array (the <i>url</i> field). It opens right here in a frame.</div>`;
      b.querySelector("#back").addEventListener("click",gallery);return;}
    b.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <button class="btn sm" id="back">‹ Back</button><b style="font-family:'Baloo 2'">${g.name}</b></div>
      <div class="videoframe" style="aspect-ratio:4/3"><iframe src="${g.url}" title="${g.name}" allow="fullscreen"></iframe></div>`;
    b.querySelector("#back").addEventListener("click",gallery);
  }
  gallery();
};
function memoryGame(b,back){
  const ics=[0,1,2,3,4,5,6,7];   // mem-tile-N.png images
  const deck=ics.concat(ics).map(ic=>({ic})).sort(()=>Math.random()-0.5);
  b.innerHTML=`<div class="mem-top"><button class="btn sm" id="back">‹ Back</button><span>Moves: <b id="mv">0</b></span><button class="btn sm" id="rst">New</button></div>
    <div class="mem" id="mem"></div><div class="win" id="win" style="display:none">Matched them all! 🌿</div>`;
  const mem=b.querySelector("#mem"),mv=b.querySelector("#mv"),win=b.querySelector("#win");
  let first=null,lock=false,moves=0,matched=0;
  deck.forEach(c=>{
    const card=document.createElement("div");card.className="mcard";card.dataset.ic=c.ic;
    card.innerHTML=`<img src="uploads/mem-tile-${c.ic}.png" alt="">`;
    card.addEventListener("click",()=>{
      if(lock||card.classList.contains("flip")||card.classList.contains("matched"))return;
      card.classList.add("flip");
      if(!first){first=card;return;}
      moves++;mv.textContent=moves;
      if(first.dataset.ic===card.dataset.ic){first.classList.add("matched");card.classList.add("matched");first=null;matched+=2;if(matched===deck.length)win.style.display="block";}
      else{lock=true;const f=first;first=null;setTimeout(()=>{f.classList.remove("flip");card.classList.remove("flip");lock=false;},650);}
    });
    mem.appendChild(card);
  });
  b.querySelector("#back").addEventListener("click",back);
  b.querySelector("#rst").addEventListener("click",()=>memoryGame(b,back));
}
const QUOTES=[
  "Breathe. You are exactly where you need to be.",
  "Small steps still move you forward.",
  "Rest is productive, too.",
  "Let this moment be enough.",
  "You can begin again, right now.",
  "Soften your shoulders. Unclench your jaw.",
  "Progress, not perfection.",
  "The quiet is yours to keep.",
  "Do less, but better.",
  "Tend to yourself like a garden."
];
RENDER.zen=(b)=>{
  const day=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000);
  const i=day%QUOTES.length;
  const dstr=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  b.innerHTML=`<div class="zen"><div class="meta">${dstr}</div><div class="q">“${QUOTES[i]}”</div></div>`;
};

/* =====================================================================
   AUDIO (lo-fi records via <audio>)
   ===================================================================== */
const bgm=document.getElementById("bgm");
const radioState={playing:false,station:0,volume:0.5,muted:false};
function loadStation(){ const s=STATIONS[radioState.station];
  if(bgm.getAttribute("src")!==s.src){ bgm.src=s.src; } }
function applyVolume(){ bgm.muted=radioState.muted; bgm.volume=radioState.volume; }
function startRadio(){ loadStation();
  // hitting Play is an explicit "I want sound" — clear any global mute
  if(radioState.muted){ radioState.muted=false;
    const mb=document.getElementById("btnMute"); if(mb) mb.classList.remove("on"); }
  applyVolume(); radioState.playing=true; bgm.play().catch(()=>{}); }
function tuneRadio(){ loadStation(); applyVolume(); if(radioState.playing) bgm.play().catch(()=>{}); }
function stopRadio(){ radioState.playing=false; bgm.pause(); }

/* =====================================================================
   TOP BAR
   ===================================================================== */
document.getElementById("btnMute").addEventListener("click",e=>{
  radioState.muted=!radioState.muted;bgm.muted=radioState.muted;
  e.currentTarget.classList.toggle("on",radioState.muted);applyVolume();
});
document.getElementById("btnTheme") && document.getElementById("btnTheme").addEventListener("click",e=>{
  stage.classList.toggle("night");e.currentTarget.classList.toggle("on",stage.classList.contains("night"));
});
const picker=document.getElementById("picker");
document.getElementById("btnChar").addEventListener("click",e=>{
  picker.classList.toggle("open");e.currentTarget.classList.toggle("on",picker.classList.contains("open"));
});
const CHAR_FILTER={mauve:"none",sage:"hue-rotate(115deg) saturate(.85)",honey:"hue-rotate(-32deg) saturate(1.15) brightness(1.03)"};
picker.querySelectorAll(".av").forEach(av=>av.addEventListener("click",()=>{
  picker.querySelectorAll(".av").forEach(a=>a.classList.remove("sel"));av.classList.add("sel");
  charEl.style.filter=CHAR_FILTER[av.dataset.av];
}));
document.addEventListener("click",e=>{
  if(picker.classList.contains("open")&&!picker.contains(e.target)&&!e.target.closest("#btnChar")){
    picker.classList.remove("open");document.getElementById("btnChar").classList.remove("on");}
});

/* ---------- MOBILE: bottom-sheet menu toggle ---------- */
(function(){
  const openMenu =()=>document.body.classList.add("menu-open");
  const closeMenu=()=>document.body.classList.remove("menu-open");
  document.getElementById("menuFab").addEventListener("click",openMenu);
  document.getElementById("drawerGrip").addEventListener("click",closeMenu);
  document.getElementById("menuScrim").addEventListener("click",closeMenu);
  /* picking an activity closes the sheet so the room is visible behind the modal */
  document.querySelectorAll("#sidebar .pill").forEach(p=>p.addEventListener("click",closeMenu));
})();
