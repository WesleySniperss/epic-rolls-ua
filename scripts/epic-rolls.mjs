/** Epic Rolls v1.0.0 */
const MODULE_ID = "epic-rolls";

const ROLL_TYPES = [
  { id:"raw",        label:"Raw d20",               cat:"raw"                },
  { id:"str-check",  label:"Strength Check",        cat:"ability", key:"str" },
  { id:"dex-check",  label:"Dexterity Check",       cat:"ability", key:"dex" },
  { id:"con-check",  label:"Constitution Check",    cat:"ability", key:"con" },
  { id:"int-check",  label:"Intelligence Check",    cat:"ability", key:"int" },
  { id:"wis-check",  label:"Wisdom Check",          cat:"ability", key:"wis" },
  { id:"cha-check",  label:"Charisma Check",        cat:"ability", key:"cha" },
  { id:"str-save",   label:"Strength Save",         cat:"save",    key:"str" },
  { id:"dex-save",   label:"Dexterity Save",        cat:"save",    key:"dex" },
  { id:"con-save",   label:"Constitution Save",     cat:"save",    key:"con" },
  { id:"int-save",   label:"Intelligence Save",     cat:"save",    key:"int" },
  { id:"wis-save",   label:"Wisdom Save",           cat:"save",    key:"wis" },
  { id:"cha-save",   label:"Charisma Save",         cat:"save",    key:"cha" },
  { id:"acr-skill",  label:"Acrobatics",            cat:"skill",   key:"acr" },
  { id:"ani-skill",  label:"Animal Handling",       cat:"skill",   key:"ani" },
  { id:"arc-skill",  label:"Arcana",                cat:"skill",   key:"arc" },
  { id:"ath-skill",  label:"Athletics",             cat:"skill",   key:"ath" },
  { id:"dec-skill",  label:"Deception",             cat:"skill",   key:"dec" },
  { id:"his-skill",  label:"History",               cat:"skill",   key:"his" },
  { id:"ins-skill",  label:"Insight",               cat:"skill",   key:"ins" },
  { id:"itm-skill",  label:"Intimidation",          cat:"skill",   key:"itm" },
  { id:"inv-skill",  label:"Investigation",         cat:"skill",   key:"inv" },
  { id:"med-skill",  label:"Medicine",              cat:"skill",   key:"med" },
  { id:"nat-skill",  label:"Nature",                cat:"skill",   key:"nat" },
  { id:"prc-skill",  label:"Perception",            cat:"skill",   key:"prc" },
  { id:"prf-skill",  label:"Performance",           cat:"skill",   key:"prf" },
  { id:"per-skill",  label:"Persuasion",            cat:"skill",   key:"per" },
  { id:"rel-skill",  label:"Religion",              cat:"skill",   key:"rel" },
  { id:"slt-skill",  label:"Sleight of Hand",       cat:"skill",   key:"slt" },
  { id:"ste-skill",  label:"Stealth",               cat:"skill",   key:"ste" },
  { id:"sur-skill",  label:"Survival",              cat:"skill",   key:"sur" },
];

const SKILL_ABILITY = {
  acr:"dex",ani:"wis",arc:"int",ath:"str",dec:"cha",his:"int",
  ins:"wis",itm:"cha",inv:"int",med:"wis",nat:"int",prc:"wis",
  prf:"cha",per:"cha",rel:"int",slt:"dex",ste:"dex",sur:"wis"
};

const CAT_THEME = {
  ability:{ hue:45,  tint:"rgba(160,120,0,.45)",   glow:"rgba(255,210,0,.6)",  label:"#ffe566" }, // жовтий
  save:   { hue:120, tint:"rgba(15,100,40,.50)",   glow:"rgba(40,200,80,.6)",  label:"#80ff90" }, // зелений
  skill:  { hue:0,   tint:"rgba(160,25,25,.50)",   glow:"rgba(255,60,60,.6)",  label:"#ff8888" }, // червоний
  raw:    { hue:260, tint:"rgba(80,20,160,.50)",   glow:"rgba(160,80,255,.6)", label:"#c090ff" }, // фіолетовий
};

const getSetting = k => game.settings.get(MODULE_ID, k);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];

const CRIT_HIT_LINES = [
  "NATURAL TWENTY!", "UNBELIEVABLE!", "THE GODS SMILE UPON YOU!",
  "TABLE LEGEND!", "STOP AND BEHOLD!", "PERFECTION!",
  "ONCE IN A LIFETIME!", "TYMORA GRINS!", "UNMATCHED!",
  "FATE IS ON YOUR SIDE!", "AT THE PEAK OF MASTERY!", "ABSOLUTE TRIUMPH!",
  "THE STARS ALIGNED!", "IS THIS EVEN LEGAL?!", "CRITICALLY, FATALLY, EPICALLY!",
  "THE TAVERN WILL REMEMBER!", "LEGENDAARYY!", "ETERNAL GLORY!",
  "WRITTEN INTO THE ANNALS!", "TWENTY! TWENTY!", "THE BARD IS ALREADY WRITING!",
  "CRIT OR DEATH — TODAY: CRIT!", "LUCK? NO — SKILL.", "WOW!", "LUCKY!", "GOOOD BOY",
];
const CRIT_FAIL_LINES = [
  "FATE LOVES IRONY.", "HUH...", "CLERIC, GET READY..",
  "THE DM IS SMILING... THAT'S BAD.", "NATURAL. ABSOLUTELY NATURAL.",
  "HALL OF SHAME UPDATED.", "MAYBE REROLL? ...NO.",
  "UNFORTUNATELY, THIS IS CANON.", "AT LEAST IT'S SPECTACULAR.",
  "THANKS FOR PARTICIPATING.", '"*heavy sigh*"', "FIASCO.",
  "THE DICE HAVE SPOKEN.", "BESHABA LAUGHS.",
];

// ── Sounds ────────────────────────────────────────
function makeCtx(){ return new(window.AudioContext||window.webkitAudioContext)(); }

// Built-in sounds — fallback if setting is empty
const BUILTIN_SOUNDS = {
  impactShort:   "modules/epic-rolls/sounds/impact-short.mp3",
  impactAction:  "modules/epic-rolls/sounds/impact.mp3",
  impactActionL: "modules/epic-rolls/sounds/impact1.mp3",
  impactTension: "modules/epic-rolls/sounds/tension.mp3",
  ambientMusic:  "modules/epic-rolls/sounds/ambient1.mp3",
  failureMusic:  "modules/epic-rolls/sounds/failure.mp3",
  successMusic:  "modules/epic-rolls/sounds/success.mp3",
};
function getSoundUrl(key){ return getSetting(key) || BUILTIN_SOUNDS[key] || ""; }
function isSoundMuted(){ return !getSetting("soundEnabled") || getSetting("impactMode")==="mute"; }

// Playback via Foundry API (supports module paths)
async function playFoundrySound(path, volume=0.8, loop=false){
  if(!path||isSoundMuted())return null;
  try{
    // Foundry v13: AudioHelper.play returns Promise<Sound>
    const api = foundry?.audio?.AudioHelper ?? window.AudioHelper;
    const sound = await api.play({
      src: path,
      volume: Math.min(1, Math.max(0, volume)),
      loop: loop,
      autoplay: true
    }, false);
    return sound;
  }catch(e){
    console.warn(`${MODULE_ID} | Audio failed: "${path}"`, e);
    ui.notifications?.warn(`Epic Rolls UA: could not play sound. Check path in settings (e.g: modules/epic-rolls/sounds/file.mp3)`);
    return null;
  }
}

// Play impact/drum intro — mode-based built-in, custom override supported
function playDrumroll(){
  if(isSoundMuted()) return;
  const custom=getSetting("impactMusic");
  if(custom){ playFoundrySound(custom, 0.43); return; }
  const mode=getSetting("impactMode")||"action";
  const map={ short: BUILTIN_SOUNDS.impactShort, action: BUILTIN_SOUNDS.impactAction, actionlong: BUILTIN_SOUNDS.impactActionL, tension: BUILTIN_SOUNDS.impactTension };
  const url=map[mode]||"";
  if(url) playFoundrySound(url, 0.43);
}

function playSuccessMusic(){
  const url=getSoundUrl("successMusic");
  if(url) playFoundrySound(url, 0.5);
}

function playFailureMusic(){
  const url=getSoundUrl("failureMusic");
  if(url) playFoundrySound(url, 0.5);
}

function playCritSound(_isCrit){ /* file-only — no synthetic fallback */ }

// ── Аналіз ────────────────────────────────────────
function analyzeRoll(roll){
  if(!roll?.terms)return{type:"normal",total:roll?.total??0};
  const total=roll.total??0;
  let nat20=false,nat1=false,maxD=0;

  for(const term of roll.terms){
    const f=term.faces??0;if(!f)continue;
    if(f>maxD)maxD=f;
    // Перевіряємо лише АКТИВНІ (не відкинуті) результати
    for(const r of term.results??[]){
      // active:false = відкинутий кубик (kh/kl), пропускаємо
      if(r.active===false)continue;
      const v=r.result??r;
      if(f===20){if(v===20)nat20=true;if(v===1)nat1=true;}
    }
  }
  let type="normal";
  if(nat20)type="criticalHit";
  else if(nat1)type="criticalFail";
  else if(maxD>=20&&total>=(maxD*.8))type="highRoll";
  else if(maxD>=20&&total<=(maxD*.2))type="lowRoll";
  return{type,total,nat20,nat1};
}

// ── Кидок — рахуємо мод вручну, Roll напряму ────────
// НЕ викликаємо dnd5e діалоги — вони ховаються за сценою
async function doRoll(actor, rt, adv, dis){
  const is5e = game.system.id === "dnd5e";
  let mod = 0;

  if(is5e && rt.cat !== "raw"){
    try{
      if(rt.cat === "ability"){
        mod = actor.system?.abilities?.[rt.key]?.mod ?? 0;
      } else if(rt.cat === "save"){
        // save mod = ability mod + proficiency (якщо proficient)
        const ab = actor.system?.abilities?.[rt.key];
        mod = ab?.save ?? ab?.mod ?? 0;
      } else if(rt.cat === "skill"){
        const skill = actor.system?.skills?.[rt.key];
        const abilKey = SKILL_ABILITY[rt.key] ?? "dex";
        const abilMod = actor.system?.abilities?.[abilKey]?.mod ?? 0;
        const prof = actor.system?.attributes?.prof ?? 0;
        const multi = skill?.proficiencyMultiplier ?? skill?.value ?? 0;
        mod = abilMod + Math.floor(prof * multi);
      }
    }catch(e){ mod = 0; }
  }

  const dice   = adv ? "2d20kh" : dis ? "2d20kl" : "1d20";
  const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : "";
  const formula = `${dice}${modStr}`;

  const roll = new Roll(formula);
  await roll.evaluate();
  const total = roll.total ?? 0;
  const { type } = analyzeRoll(roll);

  // Show 3D dice (Dice So Nice)
  if(game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);

  // Post to chat
  const rollMode = game.settings.get("core","rollMode") ?? "roll";
  const label = rt.cat==="raw" ? "Raw d20" : rt.label;
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor:  `[Epic Rolls] ${label}${adv?" (Advantage)":dis?" (Disadvantage)":""}`,
    rollMode,
  });

  return { actorId:actor.id, actorName:actor.name, img:actor.img||null, total, formula, type, adv:!!adv, dis:!!dis };
}

// ── Слот-машина ───────────────────────────────────
function runSlot(el,final,ms=850){
  return new Promise(ok=>{
    const start=performance.now();
    let lastSwap=0;
    const step=(now)=>{
      const p=Math.min((now-start)/ms,1);
      if(p<1){
        if(now-lastSwap>30+p*140){el.textContent=Math.floor(Math.random()*20)+1;lastSwap=now;}
        requestAnimationFrame(step);
      }else{el.textContent=final;ok();}
    };
    requestAnimationFrame(step);
  });
}

// ── Особиста заставка ─────────────────────────────
let _drt=null;
function showPersonalDrama(result){
  const{type,total,actorName}=result;
  if(type!=="criticalHit"&&type!=="criticalFail")return;
  removeDrama();
  const isCrit=type==="criticalHit";
  const msg=pick(isCrit?CRIT_HIT_LINES:CRIT_FAIL_LINES);
  const el=document.createElement("div");
  el.id="eru-drama";
  el.className=`eru-drama eru-drama--${type}`;
  el.innerHTML=`
    <div class="eru-drama-icon">${isCrit?"★":"✕"}</div>
    <div class="eru-drama-num" id="dn">?</div>
    <div class="eru-drama-msg">${msg}</div>
    <div class="eru-drama-who">${actorName}</div>`;
  el.addEventListener("click",removeDrama);
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("eru-drama--in"));
  const dn=el.querySelector("#dn");
  if(dn)runSlot(dn,total,700).then(()=>dn.classList.add("eru-drama-num--final"));
  _drt=setTimeout(removeDrama,4500);
}
function removeDrama(){
  clearTimeout(_drt);_drt=null;
  const el=document.getElementById("eru-drama");
  if(!el)return;
  el.classList.remove("eru-drama--in");el.classList.add("eru-drama--out");
  setTimeout(()=>el.remove(),500);
}

// ── SVG монети ────────────────────────────────────
const D20_SVG=`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="cg${MODULE_ID}" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#d4a843"/>
      <stop offset="45%" stop-color="#8b6914"/>
      <stop offset="100%" stop-color="#3a2a06"/>
    </radialGradient>
    <radialGradient id="ig${MODULE_ID}" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#cg${MODULE_ID})" stroke="#5a3e0a" stroke-width="1"/>
  <circle cx="32" cy="32" r="24" fill="url(#ig${MODULE_ID})" stroke="#c8920a" stroke-width="1.2"/>
  <polygon points="32,10 50,20 50,44 32,54 14,44 14,20" fill="none" stroke="#c8920a" stroke-width="1.5"/>
  <polygon points="32,17 44,24 44,40 32,47 20,40 20,24" fill="none" stroke="rgba(200,146,10,.4)" stroke-width=".8"/>
</svg>`;

// ── Сцена ─────────────────────────────────────────
let _state=null;
const _results=new Map();
let _ambientAudio=null;

async function startAmbient(){
  const url=getSoundUrl("ambientMusic");
  if(!url||isSoundMuted())return;
  stopAmbient();
  try{
    // Foundry v12/v13: AudioHelper.play повертає Sound об'єкт
    const sound = await foundry.audio.AudioHelper.play({
      src: url, volume: 0.01, loop: true, autoplay: true
    }, false);
    if(!sound)return;
    _ambientAudio = sound;
    let v=0.01;
    const fade=setInterval(()=>{
      if(!_ambientAudio){clearInterval(fade);return;}
      v=Math.min(v+0.01, 0.25);
      try{
        if(_ambientAudio.gain) _ambientAudio.gain.value=v;
        else if(_ambientAudio.volume!==undefined) _ambientAudio.volume=v;
      }catch(e){}
      if(v>=0.5)clearInterval(fade);
    },80);
  }catch(e){
    console.warn(`${MODULE_ID} | ambient error:`,e);
  }
}

function stopAmbient(){
  if(!_ambientAudio)return;
  const s=_ambientAudio; _ambientAudio=null;
  try{ s.stop(); }catch(e){ try{ s.pause(); }catch(e2){} }
}

function sceneOpen(payload){
  document.getElementById("eru-scene")?.remove();
  document.getElementById("eru-impact")?.remove();
  _state={...payload};_results.clear();
  const{rt,dc,actors}=payload;
  const theme=CAT_THEME[rt?.cat??"raw"]??CAT_THEME.raw;
  const bgUrl=getSetting("bannerBg")||"";
  const bannerImg=bgUrl||"modules/epic-rolls/assets/banner.jpg";
  // Формат: "DC 14 Dexterity Check" або "Acrobatics Check"
  const buildLabel=(rt,dc)=>{
    if(!rt)return"Group Roll";
    let name=rt.label;
    // Saves: "Strength Save" → "Strength Saving Throw"
    if(rt.cat==="save") name=name.replace(" Save"," Saving Throw");
    // Skills: просто назва, без "Check" (Acrobatics, Perception...)
    // Abilities: вже мають "Check" в label
    // Raw: прямо
    if(rt.cat==="raw") name="Raw d20 Roll";
    if(dc!=null) name=`DC ${dc} ${name}`;
    return name;
  };
  const label=buildLabel(rt,dc);
  const count=actors.length;

  const el=document.createElement("div");
  el.id="eru-scene";
  // data-count для CSS масштабування портретів
  el.dataset.count=count;
  el.innerHTML=`
    <div class="eru-banner" style="--hue:${theme.hue}deg;--glow:${theme.glow};--label-color:${theme.label};--count:${count}">
      <div class="eru-band-bg-img"></div>
      <div class="eru-band-tint" style="background:${theme.tint}"></div>
      <div class="eru-band-inner">
        <div class="eru-band-label eru-label--hidden" id="eru-main-label">${label}</div>
        <div class="eru-band-cards" id="eru-cards" style="display:none"></div>
      </div>
      <button class="eru-sound-toggle" id="eru-sound-toggle" title="Toggle my sound"></button>
    </div>
    <div id="eru-footer"></div>`;
  document.body.appendChild(el);
  const bgDiv=el.querySelector(".eru-band-bg-img");
  if(bgDiv)bgDiv.style.backgroundImage=`url("${bannerImg}")`;

  // Sound toggle button
  const stBtn=el.querySelector("#eru-sound-toggle");
  const updateSoundBtn=()=>{
    if(stBtn) stBtn.classList.toggle("eru-sound-toggle--off",!getSetting("soundEnabled"));
  };
  updateSoundBtn();
  stBtn?.addEventListener("click",e=>{
    e.stopPropagation();
    game.settings.set(MODULE_ID,"soundEnabled",!getSetting("soundEnabled"));
    updateSoundBtn();
  });

  // Крок 1: Impact frame + банер заїжджає (без звуку — він при кидку)
  showImpactFrame(theme.glow);
  requestAnimationFrame(()=>{
    el.classList.add("eru--in");
    setTimeout(()=>{
      el.classList.add("eru--shake");
      setTimeout(()=>el.classList.remove("eru--shake"),600);
    },80);
  });

  // Крок 2: Через 300ms — заголовок заїжджає зправа + whoosh + темні трасери
  const DRUMROLL_DUR=1.8;
  setTimeout(()=>{
    const lbl=document.getElementById("eru-main-label");
    if(lbl){
      lbl.classList.remove("eru-label--hidden");
      lbl.classList.add("eru-label--enter");
    }
    // Whoosh звук — текст влітає збоку
    playWhoosh();
    // Темні трасери що летять разом з текстом
    showTextTracers();
    // Кастомна impact музика або барабанний рол через 200мс
    setTimeout(()=>playDrumroll(), 250);
  },300);

  // Крок 3: Через drumroll — заголовок з'їжджає вліво, з'являються портрети
  const CARDS_DELAY=300+DRUMROLL_DUR*1000+200;
  setTimeout(()=>{
    const lbl=document.getElementById("eru-main-label");
    if(lbl) lbl.classList.add("eru-label--exit");
    setTimeout(()=>{
      if(lbl) lbl.style.display="none";
      const cardsEl=document.getElementById("eru-cards");
      if(cardsEl) cardsEl.style.display="";
      // Портрети заїжджають по черзі
      actors.forEach((a,i)=>setTimeout(()=>addPendingCard(a.id,a.name,a.img,count),i*180));
      // Запустити ambient після появи карток
      setTimeout(startAmbient, 200);
    },500);
  },CARDS_DELAY);
}

// Impact frame — спалах + лінії швидкості (аніме-стиль)
// Whoosh — кінематографічний звук "вжуух" при влітанні тексту
function playWhoosh(){
  if(isSoundMuted())return;
  try{
    const C=new(window.AudioContext||window.webkitAudioContext)();
    const dur=0.55;
    const buf=C.createBuffer(1,Math.floor(C.sampleRate*dur),C.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++){
      // Наростаючий + спадаючий шум
      const env=Math.pow(i/d.length,0.3)*Math.pow(1-i/d.length,0.8);
      d[i]=(Math.random()*2-1)*env;
    }
    const src=C.createBufferSource();
    src.buffer=buf;
    // Фільтри: формуємо "вжух" характер
    const hp=C.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=200;
    const lp=C.createBiquadFilter(); lp.type="lowpass";
    lp.frequency.setValueAtTime(800,C.currentTime);
    lp.frequency.exponentialRampToValueAtTime(4000,C.currentTime+0.15);
    lp.frequency.exponentialRampToValueAtTime(600,C.currentTime+dur);
    const g=C.createGain();
    g.gain.setValueAtTime(0,C.currentTime);
    g.gain.linearRampToValueAtTime(0.35,C.currentTime+0.08);
    g.gain.setValueAtTime(0.35,C.currentTime+0.2);
    g.gain.exponentialRampToValueAtTime(0.001,C.currentTime+dur);
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(C.destination);
    src.start(C.currentTime); src.stop(C.currentTime+dur+0.05);
  }catch(e){}
}

// Темні трасери вздовж траєкторії тексту (справа наліво)
function showTextTracers(){
  const el=document.createElement("div");
  el.id="eru-text-tracers";
  el.style.cssText="position:fixed;inset:0;z-index:99994;pointer-events:none;overflow:hidden;";
  const MID=window.innerHeight/2;
  const COUNT=18;
  for(let i=0;i<COUNT;i++){
    const ln=document.createElement("div");
    const yoff=(Math.random()-0.5)*120;
    const len=15+Math.random()*50;
    const thick=1+Math.random()*2.5;
    const delay=i*18+Math.random()*40;
    const dur=0.35+Math.random()*0.2;
    ln.style.cssText=`
      position:absolute;
      left:0; top:${MID+yoff}px;
      width:${len}vw; height:${thick}px;
      margin-top:${-thick/2}px;
      background:linear-gradient(90deg,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,0.7) 40%,
        rgba(30,30,30,0.9) 70%,
        rgba(0,0,0,0) 100%);
      animation: eru-text-tracer ${dur}s ease both ${delay}ms;
    `;
    el.appendChild(ln);
  }
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 800);
}

function showImpactFrame(glowColor){
  const el=document.createElement("div");
  el.id="eru-impact";
  el.style.setProperty("--impact-glow",glowColor);

  // Flash + ring
  el.innerHTML=`
    <div class="eru-impact-flash"></div>
    <div class="eru-impact-ring"></div>
    <div class="eru-impact-lines"></div>
    <div class="eru-impact-sparks"></div>`;

  // Трасери — горизонтальні лінії зліва, розкидані по висоті
  const lines=el.querySelector(".eru-impact-lines");
  const TRACERS=36;
  for(let i=0;i<TRACERS;i++){
    const ln=document.createElement("div");
    ln.className="eru-speed-line";
    // Горизонтальне зміщення по висоті — від центру розкидані
    const spreadH=window.innerHeight*0.45;
    const yoff=(Math.random()-0.5)*spreadH*2;
    const len=20+Math.random()*65;
    const thick=1+Math.random()*3;
    const delay=Math.random()*180;
    ln.style.cssText=`--yoff:${yoff}px;--len:${len}vw;--thick:${thick}px;--delay:${delay}ms;`;
    lines.appendChild(ln);
  }

  // Іскри — летять переважно вправо від лівого краю
  const sparks=el.querySelector(".eru-impact-sparks");
  for(let i=0;i<55;i++){
    const sp=document.createElement("div");
    sp.className="eru-spark";
    // Переважно горизонтально вправо, трохи по вертикалі
    const dx=80+Math.random()*400;
    const dy=(Math.random()-0.5)*200;
    const sz=2+Math.random()*7;
    const dur=0.3+Math.random()*0.5;
    const delay=Math.random()*200;
    sp.style.cssText=`--dx:${dx}px;--dy:${dy}px;--sz:${sz}px;--dur:${dur}s;--delay:${delay}ms;`;
    sparks.appendChild(sp);
  }

  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("eru-impact--in"));
  // Impact тримається 600мс потім зникає
  setTimeout(()=>{
    el.classList.add("eru-impact--out");
    setTimeout(()=>el.remove(),400);
  },600);
}

function addPendingCard(actorId,actorName,img,count=4){
  const cont=document.getElementById("eru-cards");
  if(!cont)return;
  const card=document.createElement("div");
  card.className="eru-card eru-card--pending";
  card.dataset.id=actorId;
  card.dataset.count=count;
  card.innerHTML=`
    <div class="eru-card-name-top">${actorName}</div>
    <div class="eru-card-portrait">
      <img src="${img||"icons/svg/mystery-man.svg"}" alt="${actorName}"/>
    </div>
    <div class="eru-coin-wrap" id="coin-${actorId}">
      <div class="eru-coin eru-coin--pending">${D20_SVG}</div>
    </div>`;
  cont.appendChild(card);
  requestAnimationFrame(()=>card.classList.add("eru-card--in"));
}

function addDiceControls(actorId, actor, rt){
  const tryAdd=(n=0)=>{
    const coin=document.getElementById(`coin-${actorId}`);
    if(!coin){if(n<80)setTimeout(()=>tryAdd(n+1),150);return;}
    if(coin.querySelector(".eru-coin--clickable"))return;
    coin.innerHTML=`
      <div class="eru-coin eru-coin--clickable" id="d20btn-${actorId}">${D20_SVG}</div>
      <div class="eru-side-btns">
        <button class="eru-side-btn eru-dis-btn" title="Disadvantage">DIS</button>
        <button class="eru-side-btn eru-adv-btn" title="Advantage">ADV</button>
      </div>`;
    // ADV/DIS toggle state
    let _adv=false, _dis=false;
    const advBtn=coin.querySelector(".eru-adv-btn");
    const disBtn=coin.querySelector(".eru-dis-btn");
    advBtn?.addEventListener("click",e=>{
      e.stopPropagation();
      _adv=!_adv; _dis=false;
      advBtn.classList.toggle("eru-side-btn--active",_adv);
      disBtn.classList.remove("eru-side-btn--active");
    });
    disBtn?.addEventListener("click",e=>{
      e.stopPropagation();
      _dis=!_dis; _adv=false;
      disBtn.classList.toggle("eru-side-btn--active",_dis);
      advBtn.classList.remove("eru-side-btn--active");
    });
    const roll=async(adv,dis)=>{
      const d20=document.getElementById(`d20btn-${actorId}`);
      if(!d20||d20.dataset.rolling)return;
      d20.dataset.rolling="1";
      d20.classList.add("eru-coin--rolling");
      // Reset toggle state
      _adv=false; _dis=false;
      advBtn?.classList.remove("eru-side-btn--active");
      disBtn?.classList.remove("eru-side-btn--active");
      // Звук кидка
      if(!isSoundMuted()){
        try{
          const C=new(window.AudioContext||window.webkitAudioContext)();
          const now=C.currentTime;
          const hits=2+Math.floor(Math.random()*3);
          for(let h=0;h<hits;h++){
            const ht=now+h*(0.06+Math.random()*0.05);
            const bufLen=Math.floor(C.sampleRate*0.04);
            const buf=C.createBuffer(1,bufLen,C.sampleRate);
            const d=buf.getChannelData(0);
            for(let i=0;i<bufLen;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/bufLen,2.5);
            const noise=C.createBufferSource(); noise.buffer=buf;
            const bp=C.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1200+Math.random()*1800; bp.Q.value=0.8+Math.random()*1.5;
            const hp=C.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=400;
            const gain=C.createGain(); gain.gain.setValueAtTime(0.175+Math.random()*0.125,ht); gain.gain.exponentialRampToValueAtTime(0.001,ht+0.06);
            noise.connect(bp);bp.connect(hp);hp.connect(gain);gain.connect(C.destination);
            noise.start(ht);noise.stop(ht+0.07);
          }
        }catch(e){}
      }
      try{
        const result=await doRoll(actor,rt,adv,dis);
        delete d20.dataset.rolling;
        d20.classList.remove("eru-coin--rolling");

        // Contest mode vs Group mode
        if(_contestState){
          const card=document.querySelector(`#eru-scene .eru-card[data-id="${actorId}"]`);
          const side=card?.dataset?.side||"a";
          const cResult={...result,side};
          _contestResults[side].set(actorId,cResult);
          applyContestResult(cResult);
          showPersonalDrama(cResult);
          emit("contestResult",cResult);
          if(game.user.isGM){
            const total=(_contestState.sideA?.length??0)+(_contestState.sideB?.length??0);
            setTimeout(()=>{
              if(_contestResults.a.size+_contestResults.b.size>=total)showContestPanel();
            },950);
          }
        }else{
          _results.set(result.actorId,result);
          applyResult(result);
          showPersonalDrama(result);
          emit("result",result);
          if(game.user.isGM&&_state){
            setTimeout(()=>{
              if(_results.size>=(_state?.actors?.length??0))showGMPanel();
            },950);
          }
        }
      }catch(e){
        console.error(`${MODULE_ID}|roll error:`,e);
        delete d20.dataset.rolling;
        d20.classList.remove("eru-coin--rolling");
      }
    };
    coin.querySelector(`#d20btn-${actorId}`)?.addEventListener("click",e=>{e.stopPropagation();roll(_adv,_dis);});
  };
  tryAdd();
}


function applyResult(result){
  const{actorId,actorName,img,total,formula,type}=result;
  const card=document.querySelector(`#eru-cards .eru-card[data-id="${actorId}"]`);
  if(!card)return;
  const count=card.dataset.count||"4";
  card.className=`eru-card eru-card--${type} eru-card--in eru-card--result`;
  card.dataset.count=count;
  const advBadge = result.adv ? '<span class="eru-adv-badge">ADV</span>' : result.dis ? '<span class="eru-dis-badge">DIS</span>' : '';
  card.innerHTML=`
    <div class="eru-card-name-top">${actorName}${advBadge}</div>
    <div class="eru-card-portrait"><img src="${img||"icons/svg/mystery-man.svg"}" alt="${actorName}"/></div>
    <div class="eru-coin-wrap">
      <div class="eru-coin eru-coin--result eru-coin--${type}">
        ${D20_SVG}
        <span class="eru-coin-num" id="slot-${actorId}">?</span>
      </div>
    </div>`;
  const numEl=card.querySelector(`#slot-${actorId}`);
  if(numEl)runSlot(numEl,total,900).then(()=>numEl.classList.add("eru-slot-final"));
}

function applyVerdict(actorId,verdict){
  const card=document.querySelector(`#eru-cards .eru-card[data-id="${actorId}"]`);
  if(card){card.classList.toggle("eru-card--pass",verdict==="pass");card.classList.toggle("eru-card--fail",verdict==="fail");}
  const coin=card?.querySelector(".eru-coin");
  if(coin){coin.classList.remove("eru-coin--pass","eru-coin--fail");coin.classList.add(`eru-coin--${verdict}`);}
}

function showFinalScreen(verdict){
  const el=document.getElementById("eru-scene");
  if(!el)return;
  stopAmbient();
  const isPass=verdict==="pass";
  el.querySelector(".eru-banner")?.classList.add(isPass?"eru-banner--success":"eru-banner--fail");
  if(isPass) playSuccessMusic(); else playFailureMusic();
  el.classList.add("eru--shake");
  setTimeout(()=>el.classList.remove("eru--shake"),600);
  const fin=document.createElement("div");
  fin.className=`eru-final-overlay eru-final--${isPass?"pass":"fail"}`;
  fin.innerHTML=`<span class="eru-final-word">${isPass?"SUCCESS":"FAILURE"}</span>`;
  el.appendChild(fin);
  setTimeout(sceneClose,5500);
}

function showGMPanel(){
  if(!game.user.isGM)return;
  const items=[..._results.values()];

  // Замінюємо coin-wrap на групу: [✓] [монета] [✗]
  items.forEach(r=>{
    const card=document.querySelector(`#eru-cards .eru-card[data-id="${r.actorId}"]`);
    if(!card||card.querySelector(".eru-verdict-row"))return;
    const coinWrap=card.querySelector(".eru-coin-wrap");
    if(!coinWrap)return;
    // Зберігаємо вміст монети
    const coinInner=coinWrap.innerHTML;
    // Замінюємо на горизонтальну групу
    coinWrap.className="eru-verdict-row";
    coinWrap.innerHTML=`
      <div class="eru-coin-in-row">${coinInner}</div>
      <div class="eru-verdict-btns">
        <button class="eru-cv-btn eru-cv-pass" data-id="${r.actorId}" title="Pass">✓</button>
        <button class="eru-cv-btn eru-cv-fail" data-id="${r.actorId}" title="Fail">✗</button>
      </div>`;
    coinWrap.querySelector(".eru-cv-pass").addEventListener("click",e=>{e.stopPropagation();emitVerdict(r.actorId,"pass");});
    coinWrap.querySelector(".eru-cv-fail").addEventListener("click",e=>{e.stopPropagation();emitVerdict(r.actorId,"fail");});
  });

  // Глобальні кнопки — тільки один раз внизу
  const footer=document.getElementById("eru-footer");
  if(!footer||footer.querySelector(".eru-gm-actions"))return;
  const acts=document.createElement("div");
  acts.className="eru-gm-actions";
  acts.innerHTML=`
    <button class="eru-final-pass">SUCCESS</button>
    <button class="eru-final-fail">FAILURE</button>
    <button class="eru-close-btn">✕ Close</button>`;
  footer.appendChild(acts);
  acts.querySelector(".eru-final-pass")?.addEventListener("click",e=>{e.stopPropagation();emitFinalScreen("pass");});
  acts.querySelector(".eru-final-fail")?.addEventListener("click",e=>{e.stopPropagation();emitFinalScreen("fail");});
  acts.querySelector(".eru-close-btn")?.addEventListener("click",e=>{e.stopPropagation();emitClose();});
}

function sceneClose(){
  stopAmbient();
  // Очистити contest state теж
  _contestState=null;
  _contestResults.a.clear();
  _contestResults.b.clear();
  const el=document.getElementById("eru-scene");
  if(!el)return;
  el.classList.add("eru--out");
  setTimeout(()=>el.remove(),600);
  _state=null;_results.clear();
}

// ── Сокет ─────────────────────────────────────────
function emit(action,payload){game.socket.emit(`module.${MODULE_ID}`,{action,payload});}
function emitVerdict(actorId,verdict){applyVerdict(actorId,verdict);emit("verdict",{actorId,verdict});}
function emitFinalScreen(verdict){showFinalScreen(verdict);emit("finalScreen",{verdict});}
function emitClose(){sceneClose();emit("close",{});}

function setupSocket(){
  game.socket.on(`module.${MODULE_ID}`,async msg=>{
    switch(msg.action){
      case "open":{
        sceneOpen(msg.payload);
        // rt приходить як plain JSON — відновлюємо з ROLL_TYPES по id
        const rtObj = ROLL_TYPES.find(r=>r.id===msg.payload.rt?.id) ?? msg.payload.rt;
        const CARDS_START = 2800;
        msg.payload.actors.forEach((ad,i)=>{
          const delay = CARDS_START + i*180 + 200;
          setTimeout(()=>{
            const actor=game.actors.get(ad.id);
            if(!actor)return;
            if(game.user.isGM||actor.isOwner)
              addDiceControls(ad.id,actor,rtObj);
          }, delay);
        });
        break;
      }
      case "result":{
        const res=msg.payload;
        const myActor=game.actors.get(res.actorId);
        // Гравець-власник вже обробив локально — але все одно зберігаємо в _results
        if(!(myActor?.isOwner && !game.user.isGM)){
          _results.set(res.actorId,res);
          applyResult(res);
        }
        // GM завжди бачить драму і перевіряє completeness
        if(game.user.isGM){
          _results.set(res.actorId,res);
          showPersonalDrama(res);
          // Затримка 950мс — слот-машина (900мс) має завершитись
          setTimeout(()=>{
            if(_state && _results.size>=(_state.actors?.length??0)) showGMPanel();
          }, 950);
        }
        break;
      }
      case "verdict":applyVerdict(msg.payload.actorId,msg.payload.verdict);break;
      case "finalScreen":showFinalScreen(msg.payload.verdict);break;
      case "close":sceneClose();break;
      // ── Contest ────────────────────────────────────
      case "contestOpen":{
        const p=msg.payload;
        contestOpen(p);
        const rtObj=ROLL_TYPES.find(r=>r.id===p.rt?.id)??p.rt;
        const CARDS_START=2800;
        [...p.sideA,...p.sideB].forEach((ad,i)=>{
          setTimeout(()=>{
            const actor=game.actors.get(ad.id);
            if(!actor)return;
            if(game.user.isGM||actor.isOwner) addDiceControls(ad.id,actor,rtObj);
          },CARDS_START+i*180+200);
        });
        break;
      }
      case "contestResult":{
        const res=msg.payload;
        const myActor=game.actors.get(res.actorId);
        if(!(myActor?.isOwner&&!game.user.isGM)){
          _contestResults[res.side].set(res.actorId,res);
          applyContestResult(res);
        }
        if(game.user.isGM){
          _contestResults[res.side].set(res.actorId,res);
          showPersonalDrama(res);
          const total=(_contestState?.sideA?.length??0)+(_contestState?.sideB?.length??0);
          setTimeout(()=>{
            if(_contestResults.a.size+_contestResults.b.size>=total)showContestPanel();
          },950);
        }
        break;
      }
      case "contestWinner":showContestWinner(msg.payload.winner);break;
    }
  });
}

// ── GM Діалог ─────────────────────────────────────
// ── Хелпери ──────────────────────────────────────────────────────
function buildRollTypeSelect(){
  const groups=[
    ["── General ──",      r=>r.cat==="raw"],
    ["── Ability Checks ──",r=>r.cat==="ability"],
    ["── Saving Throws ──", r=>r.cat==="save"],
    ["── Skills ──",        r=>r.cat==="skill"],
  ];
  let sel="";
  for(const[lbl,fn]of groups){
    sel+=`<optgroup label="${lbl}">`;
    ROLL_TYPES.filter(fn).forEach(r=>sel+=`<option value="${r.id}">${r.label}</option>`);
    sel+=`</optgroup>`;
  }
  return sel;
}

function buildActorGrid(actors, inputName=""){
  if(!actors.length) return `<p class="eru-empty">No actors found</p>`;
  return actors.map(a=>`
    <label class="eru-a" data-id="${a.id}">
      <input type="checkbox" name="${inputName}" value="${a.id}"/>
      <img src="${a.img||"icons/svg/mystery-man.svg"}"/>
      <span>${a.name}</span>
    </label>`).join("");
}

// ─────────────────────────────────────────────────────────────────
//  GroupRollDialog — Group Roll + Contest в одному діалозі
// ─────────────────────────────────────────────────────────────────
class GroupRollDialog extends Application{
  static get defaultOptions(){
    return foundry.utils.mergeObject(super.defaultOptions,{
      id:"eru-gm-dialog", title:"Epic Rolls UA",
      width:520, height:"auto", resizable:false, classes:["eru-dialog"],
    });
  }

  async _renderInner(){
    const actors=game.actors.filter(a=>["character","npc"].includes(a.type));
    const sel=buildRollTypeSelect();
    const acGrid=buildActorGrid(actors,"g-actor");
    const acGridA=buildActorGrid(actors,"c-actor-a");
    const acGridB=buildActorGrid(actors,"c-actor-b");

    const div=document.createElement("div");
    div.innerHTML=`
      <div class="eru-db">

        <!-- Таби -->
        <div class="eru-tabs">
          <button class="eru-tab eru-tab--active" data-tab="group">Group Roll</button>
          <button class="eru-tab" data-tab="contest">Contest</button>
        </div>

        <!-- Спільна секція: тип кидку + фон -->
        <div class="eru-df">
          <div class="eru-dl">ROLL TYPE</div>
          <select id="g-type" class="eru-ds">${sel}</select>
        </div>
        <div class="eru-drow">
          <div class="eru-df" style="flex:0 0 88px">
            <div class="eru-dl">DC</div>
            <input type="number" id="g-dc" class="eru-ddc" placeholder="—" min="1" max="40"/>
          </div>
          <div class="eru-df" style="flex:1">
            <div class="eru-dl">BANNER IMAGE (URL)</div>
            <input type="text" id="g-bg" class="eru-dinput" placeholder="optional"/>
          </div>
        </div>

        <!-- Звук імпакту -->
        <div class="eru-df eru-df--sound">
          <div class="eru-dl">OPENING SOUND</div>
          <div class="eru-sound-btns" id="g-sound-btns">
            <button type="button" class="eru-sound-btn" data-mode="short">Short</button>
            <button type="button" class="eru-sound-btn" data-mode="action">Action</button>
            <button type="button" class="eru-sound-btn" data-mode="actionlong">Action Long</button>
            <button type="button" class="eru-sound-btn" data-mode="tension">Tension</button>
            <button type="button" class="eru-sound-btn eru-sound-btn--mute" data-mode="mute">Mute</button>
          </div>
        </div>

        <!-- GROUP ROLL панель -->
        <div class="eru-panel" id="eru-panel-group">
          <div class="eru-df">
            <div class="eru-dl">
              PARTICIPANTS
              <button type="button" id="g-all"  class="eru-dq">All</button>
              <button type="button" id="g-none" class="eru-dq">None</button>
              <button type="button" id="g-pc"   class="eru-dq">PC</button>
            </div>
            <div class="eru-actors" id="g-actors">${acGrid}</div>
          </div>
          <button type="button" id="g-launch" class="eru-dgo">Launch Group Roll</button>
        </div>

        <!-- CONTEST панель -->
        <div class="eru-panel eru-panel--hidden" id="eru-panel-contest">
          <div class="eru-contest-sides">
            <div class="eru-contest-col">
              <div class="eru-dl eru-side-a-label">
                SIDE A
                <button type="button" class="eru-dq c-all-a">All</button>
                <button type="button" class="eru-dq c-none-a">None</button>
                <button type="button" class="eru-dq c-pc-a">PC</button>
              </div>
              <div class="eru-actors eru-actors-a">${acGridA}</div>
            </div>
            <div class="eru-contest-divider">VS</div>
            <div class="eru-contest-col">
              <div class="eru-dl eru-side-b-label">
                SIDE B
                <button type="button" class="eru-dq c-all-b">All</button>
                <button type="button" class="eru-dq c-none-b">None</button>
                <button type="button" class="eru-dq c-pc-b">PC</button>
              </div>
              <div class="eru-actors eru-actors-b">${acGridB}</div>
            </div>
          </div>
          <button type="button" id="c-launch" class="eru-dgo eru-dgo--contest">Start Contest</button>
        </div>

      </div>`;
    return $(div);
  }

  activateListeners(jq){
    super.activateListeners(jq);
    const r=jq[0];

    // Таби
    r.querySelectorAll(".eru-tab").forEach(tab=>{
      tab.addEventListener("click",()=>{
        r.querySelectorAll(".eru-tab").forEach(t=>t.classList.remove("eru-tab--active"));
        tab.classList.add("eru-tab--active");
        const name=tab.dataset.tab;
        r.querySelectorAll(".eru-panel").forEach(p=>p.classList.add("eru-panel--hidden"));
        r.querySelector(`#eru-panel-${name}`)?.classList.remove("eru-panel--hidden");
      });
    });

    // Sound mode buttons
    const soundBtns=r.querySelectorAll(".eru-sound-btn");
    const curMode=getSetting("impactMode")||"action";
    soundBtns.forEach(btn=>{
      if(btn.dataset.mode===curMode) btn.classList.add("eru-sound-btn--active");
      btn.addEventListener("click",()=>{
        soundBtns.forEach(b=>b.classList.remove("eru-sound-btn--active"));
        btn.classList.add("eru-sound-btn--active");
        game.settings.set(MODULE_ID,"impactMode",btn.dataset.mode);
      });
    });

    // Group helpers
    const cbs=()=>r.querySelectorAll("#g-actors input[type='checkbox']");
    r.querySelector("#g-all")?.addEventListener("click",()=>cbs().forEach(c=>c.checked=true));
    r.querySelector("#g-none")?.addEventListener("click",()=>cbs().forEach(c=>c.checked=false));
    r.querySelector("#g-pc")?.addEventListener("click",()=>
      r.querySelectorAll("#g-actors .eru-a").forEach(l=>
        l.querySelector("input").checked=game.actors.get(l.dataset.id)?.type==="character"
      )
    );

    // Contest helpers
    const cbsA=()=>r.querySelectorAll(".eru-actors-a input[type='checkbox']");
    const cbsB=()=>r.querySelectorAll(".eru-actors-b input[type='checkbox']");
    r.querySelector(".c-all-a")?.addEventListener("click",()=>cbsA().forEach(c=>c.checked=true));
    r.querySelector(".c-none-a")?.addEventListener("click",()=>cbsA().forEach(c=>c.checked=false));
    r.querySelector(".c-pc-a")?.addEventListener("click",()=>
      r.querySelectorAll(".eru-actors-a .eru-a").forEach(l=>
        l.querySelector("input").checked=game.actors.get(l.dataset.id)?.type==="character"
      )
    );
    r.querySelector(".c-all-b")?.addEventListener("click",()=>cbsB().forEach(c=>c.checked=true));
    r.querySelector(".c-none-b")?.addEventListener("click",()=>cbsB().forEach(c=>c.checked=false));
    r.querySelector(".c-pc-b")?.addEventListener("click",()=>
      r.querySelectorAll(".eru-actors-b .eru-a").forEach(l=>
        l.querySelector("input").checked=game.actors.get(l.dataset.id)?.type==="character"
      )
    );

    r.querySelector("#g-launch")?.addEventListener("click",()=>this._launchGroup(r));
    r.querySelector("#c-launch")?.addEventListener("click",()=>this._launchContest(r));
  }

  _getRT(r){ return ROLL_TYPES.find(x=>x.id===r.querySelector("#g-type").value)??ROLL_TYPES[0]; }
  _getBg(r){ const v=r.querySelector("#g-bg")?.value?.trim()||""; if(v)game.settings.set(MODULE_ID,"bannerBg",v); else game.settings.set(MODULE_ID,"bannerBg",""); return v; }

  async _launchGroup(r){
    const ids=[...r.querySelectorAll("#g-actors input:checked")].map(c=>c.value);
    if(!ids.length){ui.notifications.warn("Select at least one participant!");return;}
    const rt=this._getRT(r);
    this._getBg(r);
    const dcRaw=parseInt(r.querySelector("#g-dc").value);
    const dc=isNaN(dcRaw)?null:dcRaw;
    const actors=ids.map(id=>{const a=game.actors.get(id);return a?{id:a.id,name:a.name,img:a.img||null}:null;}).filter(Boolean);
    const payload={rt,dc,showDC:dc!=null,actors};
    _results.clear();
    sceneOpen(payload);
    emit("open",payload);
    const CARDS_START=2800;
    actors.forEach((ad,i)=>setTimeout(()=>{
      const actor=game.actors.get(ad.id);
      if(actor)addDiceControls(ad.id,actor,rt);
    },CARDS_START+i*180+200));
    this.close();
  }

  async _launchContest(r){
    const idsA=[...r.querySelectorAll(".eru-actors-a input:checked")].map(c=>c.value);
    const idsB=[...r.querySelectorAll(".eru-actors-b input:checked")].map(c=>c.value);
    if(!idsA.length||!idsB.length){ui.notifications.warn("Select at least one participant on each side!");return;}
    const overlap=idsA.filter(id=>idsB.includes(id));
    if(overlap.length){ui.notifications.warn("Same actor can't be on both sides!");return;}
    const rt=this._getRT(r);
    this._getBg(r);
    const toActor=id=>{const a=game.actors.get(id);return a?{id:a.id,name:a.name,img:a.img||null}:null;};
    const sideA=idsA.map(toActor).filter(Boolean);
    const sideB=idsB.map(toActor).filter(Boolean);
    const payload={rt,sideA,sideB,mode:"contest"};
    _contestResults.a.clear();_contestResults.b.clear();
    contestOpen(payload);
    const CARDS_START=2800;
    [...sideA,...sideB].forEach((ad,i)=>setTimeout(()=>{
      const actor=game.actors.get(ad.id);
      if(actor)addDiceControls(ad.id,actor,rt);
    },CARDS_START+i*180+200));
    emit("contestOpen",payload);
    this.close();
  }
}

// ── Кнопка в лівій панелі ─────────────────────────
// ── VTools ───────────────────────────────────────────────────────
Hooks.once("vtools.ready", () => {
  VTools.register({
    name:    "epic-rolls",
    title:   "Group Roll",
    icon:    "fas fa-dice-d20",
    onClick: () => new GroupRollDialog().render(true),
  });

  if (game.modules.get("tension-pool-2")?.active) {
    const TP_LS_KEY = "epic-rolls.tension-pool-hidden";
    VTools.register({
      name:    "tension-pool-2",
      title:   "Tension Pool",
      icon:    "fas fa-skull",
      onClick: () => {
        const app = foundry.applications.instances.get("tension-pool");
        if (!app) return;
        const el = app.element;
        if (!el) { app.render({ force: true }); return; }
        const hiding = el.style.display !== "none";
        el.style.display = hiding ? "none" : "";
        localStorage.setItem(TP_LS_KEY, hiding ? "1" : "0");
      },
    });

    // Відновити прихований стан після рендеру tension pool
    if (localStorage.getItem(TP_LS_KEY) === "1") {
      const tryHide = () => {
        const app = foundry.applications.instances.get("tension-pool");
        if (app?.element) { app.element.style.display = "none"; return; }
        setTimeout(tryHide, 100);
      };
      Hooks.once("ready", () => setTimeout(tryHide, 0));
    }
  }
});

// ── Налаштування ──────────────────────────────────
function registerSettings(){
  game.settings.register(MODULE_ID,"soundEnabled",{
    name:"Sound Effects",scope:"client",config:true,type:Boolean,default:true,
  });
  game.settings.register(MODULE_ID,"impactMode",{
    name:"Impact Sound Mode",scope:"world",config:false,type:String,default:"action",
  });
  game.settings.register(MODULE_ID,"bannerBg",{
    name:"Banner Background Image (URL)",
    hint:"Direct URL. Leave empty to use the built-in banner.",
    scope:"world",config:true,type:String,default:"",
  });
  game.settings.register(MODULE_ID,"successMusic",{
    name:"Success Music",
    hint:"Plays on success announcement. MP3/OGG. E.g.: modules/epic-rolls/sounds/success.mp3",
    scope:"world",config:true,type:String,default:"",
  });
  game.settings.register(MODULE_ID,"failureMusic",{
    name:"Failure Music",
    hint:"Plays on failure announcement. MP3/OGG. E.g.: modules/epic-rolls/sounds/failure.mp3",
    scope:"world",config:true,type:String,default:"",
  });
  game.settings.register(MODULE_ID,"impactMusic",{
    name:"Impact Music",
    hint:"Plays during the roll title reveal. E.g.: modules/epic-rolls/sounds/impact.mp3",
    scope:"world",config:true,type:String,default:"",
  });
  game.settings.register(MODULE_ID,"ambientMusic",{
    name:"Ambient Music (during rolls)",
    hint:"Loops in background while players roll. Stops at result. E.g.: modules/epic-rolls/sounds/ambient.mp3",
    scope:"world",config:true,type:String,default:"",
  });
}

Hooks.once("init",()=>registerSettings());
Hooks.once("ready",()=>{
  setupSocket();
  console.log(`${MODULE_ID} | ready`);
});

// ── API ───────────────────────────────────────────
window.EpicRollsUA={
  open:()=>new GroupRollDialog().render(true),
  close:emitClose,
  testScene:()=>{
    const rt=ROLL_TYPES.find(r=>r.id==="prc-skill");
    const actors=[{id:"a",name:"Akra",img:null},{id:"b",name:"Faind",img:null},{id:"c",name:"Zorya",img:null},{id:"d",name:"Shadow",img:null}];
    _results.clear();sceneOpen({rt,dc:14,showDC:true,actors});
    emit("open",{rt,dc:14,showDC:true,actors});
    [{actorId:"a",actorName:"Akra",img:null,total:20,formula:"1d20+5",type:"criticalHit"},
     {actorId:"b",actorName:"Faind",img:null,total:4,formula:"1d20",type:"lowRoll"},
     {actorId:"c",actorName:"Zorya",img:null,total:18,formula:"1d20+3",type:"highRoll"},
     {actorId:"d",actorName:"Shadow",img:null,total:1,formula:"1d20",type:"criticalFail"},
    ].forEach((res,i)=>setTimeout(()=>{
      _results.set(res.actorId,res);applyResult(res);showPersonalDrama(res);emit("result",res);
      if(i===3)showGMPanel();
    },1200+i*1000));
  },
};

// ═══════════════════════════════════════════════════════════════
//  CONTEST MODE — Side A vs Side B
// ═══════════════════════════════════════════════════════════════
let _contestState = null;
const _contestResults = { a: new Map(), b: new Map() };

// ── Стан змагання ───────────────────────────────────────────────
function contestOpen(payload) {
  document.getElementById("eru-scene")?.remove();
  document.getElementById("eru-impact")?.remove();
  _contestState = { ...payload };
  _contestResults.a.clear();
  _contestResults.b.clear();

  const { rt, sideA, sideB } = payload;
  const theme = CAT_THEME[rt?.cat ?? "raw"] ?? CAT_THEME.raw;
  const bgUrl = getSetting("bannerBg") || "";
  const bannerImg = bgUrl || "modules/epic-rolls/assets/banner.jpg";

  // Назва: "Strength Check — Contest"
  const rollName = buildContestLabel(rt);

  const el = document.createElement("div");
  el.id = "eru-scene";
  const totalCount = sideA.length + sideB.length;
  el.dataset.count = totalCount;
  el.innerHTML = `
    <div class="eru-banner" style="--hue:${theme.hue}deg;--glow:${theme.glow};--label-color:${theme.label}">
      <div class="eru-band-bg-img"></div>
      <div class="eru-band-tint" style="background:${theme.tint}"></div>
      <div class="eru-band-inner">
        <div class="eru-band-label eru-label--hidden" id="eru-main-label">${rollName}</div>
        <div class="eru-contest-stage" id="eru-contest-stage" style="display:none">
          <div class="eru-contest-side eru-side-a" id="eru-side-a">
            <div class="eru-side-label">A</div>
            <div class="eru-band-cards" id="eru-cards-a"></div>
          </div>
          <div class="eru-contest-vs">VS</div>
          <div class="eru-contest-side eru-side-b" id="eru-side-b">
            <div class="eru-side-label">B</div>
            <div class="eru-band-cards" id="eru-cards-b"></div>
          </div>
        </div>
      </div>
    </div>
    <div id="eru-footer"></div>`;

  document.body.appendChild(el);
  const bgDiv = el.querySelector(".eru-band-bg-img");
  if (bgDiv) bgDiv.style.backgroundImage = `url("${bannerImg}")`;

  showImpactFrame(theme.glow);

  requestAnimationFrame(() => {
    el.classList.add("eru--in");
    setTimeout(() => {
      el.classList.add("eru--shake");
      setTimeout(() => el.classList.remove("eru--shake"), 600);
    }, 80);
  });

  // Анімація заголовку
  const DRUMROLL_DUR = 1.8;
  setTimeout(() => {
    const lbl = document.getElementById("eru-main-label");
    if (lbl) { lbl.classList.remove("eru-label--hidden"); lbl.classList.add("eru-label--enter"); }
    playWhoosh();
    showTextTracers();
    setTimeout(() => playDrumroll(), 250);
  }, 300);

  const CARDS_DELAY = 300 + DRUMROLL_DUR * 1000 + 200;
  setTimeout(() => {
    const lbl = document.getElementById("eru-main-label");
    if (lbl) lbl.classList.add("eru-label--exit");
    setTimeout(() => {
      if (lbl) lbl.style.display = "none";
      document.getElementById("eru-contest-stage").style.display = "";
      sideA.forEach((a, i) => setTimeout(() => addContestCard(a.id, a.name, a.img, "a", totalCount), i * 180));
      sideB.forEach((b, i) => setTimeout(() => addContestCard(b.id, b.name, b.img, "b", totalCount), i * 180 + 80));
      setTimeout(startAmbient, 200);
    }, 500);
  }, CARDS_DELAY);
}

function buildContestLabel(rt) {
  if (!rt) return "Contest";
  let name = rt.label;
  if (rt.cat === "save") name = name.replace(" Save", " Saving Throw");
  if (rt.cat === "raw") name = "Raw d20 Roll";
  return name + " — Contest";
}

function addContestCard(actorId, actorName, img, side, totalCount) {
  const cont = document.getElementById(`eru-cards-${side}`);
  if (!cont) return;
  const card = document.createElement("div");
  card.className = "eru-card eru-card--pending";
  card.dataset.id = actorId;
  card.dataset.side = side;
  card.dataset.count = totalCount;
  card.innerHTML = `
    <div class="eru-card-name-top">${actorName}</div>
    <div class="eru-card-portrait">
      <img src="${img || "icons/svg/mystery-man.svg"}" alt="${actorName}"/>
    </div>
    <div class="eru-coin-wrap" id="coin-${actorId}">
      <div class="eru-coin eru-coin--pending">${D20_SVG}</div>
    </div>`;
  cont.appendChild(card);
  requestAnimationFrame(() => card.classList.add("eru-card--in"));
}

function applyContestResult(result) {
  const { actorId, actorName, img, total, type } = result;
  const card = document.querySelector(`#eru-scene .eru-card[data-id="${actorId}"]`);
  if (!card) return;
  const side = card.dataset.side || "a";
  const count = card.dataset.count || "4";
  card.className = `eru-card eru-card--${type} eru-card--in eru-card--result`;
  card.dataset.count = count;
  card.dataset.side = side;
  card.innerHTML = `
    <div class="eru-card-name-top">${actorName}</div>
    <div class="eru-card-portrait"><img src="${img || "icons/svg/mystery-man.svg"}" alt="${actorName}"/></div>
    <div class="eru-coin-wrap">
      <div class="eru-coin eru-coin--result eru-coin--${type}">
        ${D20_SVG}
        <span class="eru-coin-num" id="slot-${actorId}">?</span>
      </div>
    </div>`;
  const numEl = card.querySelector(`#slot-${actorId}`);
  if (numEl) runSlot(numEl, total, 900).then(() => numEl.classList.add("eru-slot-final"));
}

// Показати результат змагання
function showContestWinner(winner) {
  // winner: "a" | "b" | "tie"
  const el = document.getElementById("eru-scene");
  if (!el) return;

  // Підсвітити переможця
  const sideA = document.getElementById("eru-side-a");
  const sideB = document.getElementById("eru-side-b");
  if (winner === "a") {
    sideA?.classList.add("eru-side--winner");
    sideB?.classList.add("eru-side--loser");
    playSuccessMusic();
  } else if (winner === "b") {
    sideB?.classList.add("eru-side--winner");
    sideA?.classList.add("eru-side--loser");
    playFailureMusic();
  } else {
    sideA?.classList.add("eru-side--tie");
    sideB?.classList.add("eru-side--tie");
  }

  // Final text — fullscreen overlay
  {
    const txt = winner === "a" ? "VICTORY" : winner === "b" ? "VICTORY" : "TIE";
    const cls = winner === "tie" ? "eru-final--tie" : winner === "a" ? "eru-final--pass" : "eru-final--fail";
    const fin = document.createElement("div");
    fin.className = `eru-final-overlay ${cls}`;
    fin.innerHTML = `<span class="eru-final-word">${txt}</span>`;
    el.appendChild(fin);
    el.classList.add("eru--shake");
    setTimeout(()=>el.classList.remove("eru--shake"),600);
  }
  setTimeout(sceneClose, 5000);
}

// GM вирішує переможця або авто-підрахунок
function showContestPanel() {
  if (!game.user.isGM) return;
  const footer = document.getElementById("eru-footer");
  if (!footer || footer.querySelector(".eru-contest-panel")) return;

  const resA = [..._contestResults.a.values()];
  const resB = [..._contestResults.b.values()];
  const totalA = resA.reduce((s, r) => s + r.total, 0);
  const totalB = resB.reduce((s, r) => s + r.total, 0);
  const autoWinner = totalA > totalB ? "a" : totalA < totalB ? "b" : "tie";

  footer.innerHTML = `
    <div class="eru-contest-panel">
      <div class="eru-contest-score">
        <span class="eru-score-a">A: ${totalA}</span>
        <span class="eru-score-vs">vs</span>
        <span class="eru-score-b">B: ${totalB}</span>
      </div>
      <div class="eru-gm-actions">
        <button class="eru-final-pass" id="eru-win-a">Side A Wins</button>
        <button class="eru-all-pass"   id="eru-win-tie">Tie</button>
        <button class="eru-final-fail" id="eru-win-b">Side B Wins</button>
        <button class="eru-close-btn"  id="eru-con-close">Close</button>
      </div>
      <div class="eru-contest-hint">Auto-result: ${autoWinner === "a" ? "Side A" : autoWinner === "b" ? "Side B" : "Tie"}</div>
    </div>`;

  footer.querySelector("#eru-win-a")?.addEventListener("click", e => { e.stopPropagation(); emitContestWinner("a"); });
  footer.querySelector("#eru-win-b")?.addEventListener("click", e => { e.stopPropagation(); emitContestWinner("b"); });
  footer.querySelector("#eru-win-tie")?.addEventListener("click", e => { e.stopPropagation(); emitContestWinner("tie"); });
  footer.querySelector("#eru-con-close")?.addEventListener("click", e => { e.stopPropagation(); emitClose(); });
}

function emitContestWinner(winner) {
  showContestWinner(winner);
  emit("contestWinner", { winner });
}