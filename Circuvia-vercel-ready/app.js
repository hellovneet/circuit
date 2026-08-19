let placed=[],wires=[],selected=null,nextId=1,dragState=null,wireState=null,running=false,zoomLevel=1;
const library=document.getElementById("library"),canvas=document.getElementById("canvas"),svg=document.getElementById("wires");
const inspector=document.getElementById("inspectorBody"),consoleEl=document.getElementById("console");

function log(t,cls=""){const d=document.createElement("div");d.className=cls;d.textContent="› "+t;consoleEl.appendChild(d);consoleEl.scrollTop=consoleEl.scrollHeight}
function updateCount(){document.getElementById("count").textContent=`${placed.length} components · ${wires.length} connections`}

const ASSET_MAP={}; // The distribution contains no asset files; keep the renderer self-contained.

// Physical-ish pin placement for the most common parts. This mirrors the
// Wokwi editor principle: every pin is attached to the component body edge.
const PIN_LAYOUTS={
  "resistor":[["left",.5],["right",.5]],
  "led":[["left",.5],["right",.5]],
  "diode":[["left",.5],["right",.5]],
  "capacitor":[["left",.5],["right",.5]],
  "button":[["left",.5],["right",.5]],
  "switch":[["left",.5],["right",.5]],
  "buzzer":[["left",.5],["right",.5]],
  "dc-motor":[["left",.5],["right",.5]],
  "servo":[["left",.25],["right",.25],["bottom",.5]],
  "potentiometer":[["left",.25],["right",.5],["left",.75]],
  "hcsr04":[["bottom",.15],["bottom",.38],["bottom",.62],["bottom",.85]],
  "dht11":[["bottom",.25],["bottom",.5],["bottom",.75]],
  "dht22":[["bottom",.25],["bottom",.5],["bottom",.75]],
  "pir":[["left",.25],["right",.5],["left",.75]],
  "ldr":[["left",.25],["right",.5],["left",.75],["right",.75]],
  "mpu6050":[["left",.2],["left",.4],["left",.6],["right",.4],["right",.6]],
  "oled":[["bottom",.15],["bottom",.38],["bottom",.62],["bottom",.85]],
  "i2clcd":[["bottom",.25],["bottom",.5],["bottom",.75],["bottom",.9]],
  "lcd16":[...Array(8).fill(0).map((_,i)=>["bottom",.05+i*.13]),...Array(8).fill(0).map((_,i)=>["top",.05+i*.13])],
  "sevenseg":[...Array(4).fill(0).map((_,i)=>["left",.15+i*.23]),...Array(5).fill(0).map((_,i)=>["right",.05+i*.22])],
};
function normalizePinLayout(layout){return layout.map(([side,offset])=>({side,offset}))}
function symbol(id){
  if(ASSET_MAP[id]) return `<img class="assetThumb" src="${ASSET_MAP[id]}" alt="">`;
  const icons={"arduino-uno":"▣","arduino-nano":"▥","arduino-mega":"▤","esp32-devkit":"◈","esp8266":"◈","breadboard":"▤","led":"●","resistor":"▰","capacitor":"▯","button":"●","buzzer":"◉","dc-motor":"M","servo":"S","hcsr04":"◉","dht11":"D","dht22":"D","pir":"◉","ldr":"☼","relay-module":"▣","l298n":"▦","mpu6050":"◆","oled":"▤","lcd16":"▤","neopixel":"●","battery":"▰"};
  return `<span class="libGlyph">${icons[id]||"◆"}</span>`;
}

function renderLibrary(filter=""){
  library.innerHTML="";
  const groups={};
  COMPONENTS.filter(c=>(c.name+" "+c.cat).toLowerCase().includes(filter.toLowerCase())).forEach(c=>(groups[c.cat]??=[]).push(c));
  Object.entries(groups).forEach(([cat,items])=>{
    const h=document.createElement("div");h.className="groupTitle";h.innerHTML=`<span>${cat}</span><em>${items.length}</em>`;library.appendChild(h);
    items.forEach(c=>{
      const e=document.createElement("div");e.className="libCard";e.draggable=true;
      e.innerHTML=`<div class="libIcon ${c.kind}">${symbol(c.id)}</div><div class="libInfo"><b>${c.name}</b><small>${c.pins.length} pins</small></div><button class="addBtn" title="Add to canvas">＋</button><span class="dragDots">⋮⋮</span>`;
      e.addEventListener("dragstart",ev=>{ev.dataTransfer.effectAllowed="copy";ev.dataTransfer.setData("text/plain",c.id);ev.dataTransfer.setData("circuvia",c.id)});
      e.querySelector(".addBtn").addEventListener("click",ev=>{ev.stopPropagation();addFromLibrary(c.id)});
      library.appendChild(e);
    })
  })
}
renderLibrary();
document.getElementById("search").oninput=e=>renderLibrary(e.target.value);
document.querySelectorAll(".quickTabs button").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".quickTabs button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");renderLibrary(btn.textContent==="All"?"":btn.textContent)});
const totalBadge=document.querySelector(".sideHead small"); if(totalBadge) totalBadge.textContent=`${COMPONENTS.length} components · Click + or drag`;
canvas.addEventListener("dragenter",e=>{e.preventDefault();canvas.classList.add("dropActive")});
canvas.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="copy";canvas.classList.add("dropActive")});
canvas.addEventListener("dragleave",e=>canvas.classList.remove("dropActive"));
canvas.addEventListener("drop",e=>{
  e.preventDefault();
  canvas.classList.remove("dropActive");
  const id=e.dataTransfer.getData("circuvia")||e.dataTransfer.getData("text/plain");
  if(id){
    const r=canvas.getBoundingClientRect();
    addComponent(id,e.clientX-r.left+canvas.scrollLeft,e.clientY-r.top+canvas.scrollTop);
  }
});
function addFromLibrary(id){
  const r=canvas.getBoundingClientRect();
  const x=canvas.scrollLeft+r.width/2-80+(placed.length%4)*18;
  const y=canvas.scrollTop+r.height/2-50+(placed.length%3)*18;
  addComponent(id,x,y);
  log(`${componentById[id].name} placed on canvas`,"ok");
}
canvas.addEventListener("mousedown",e=>{if(e.target===canvas)select(null)});

function addComponent(defId,x,y){
  const def=componentById[defId];if(!def)return;
  const o={uid:nextId++,defId,x:Math.max(20,x-78),y:Math.max(20,y-50),props:{...def.props}};
  placed.push(o);draw(o);select(o.uid);document.querySelector(".dropHint").style.display="none";updateCount();log(`${def.name} added`,"ok")
}

function realisticVisual(d){
  const id=d.id;
  if(ASSET_MAP[id]) return `<div class="assetCanvas"><img src="${ASSET_MAP[id]}" alt="${d.name}"></div>`;
  if(id==="arduino-uno"||id==="arduino-nano"||id==="arduino-mega"){
    return `<div class="realBoard arduino"><div class="usb"></div><div class="usbShield"></div><div class="chip">ATmega<br><small>MCU</small></div><div class="crystal"></div><div class="reset">RST</div><div class="boardText">ARDUINO <strong>${id==="arduino-uno"?"UNO":id==="arduino-nano"?"NANO":"MEGA"}</strong></div><div class="headers top">${[1,2,3,4,5,6,7,8,9,10].map((x)=>"<i></i>").join("")}</div><div class="headers bottom">${[1,2,3,4,5,6,7,8,9,10].map((x)=>"<i></i>").join("")}</div></div>`;
  }
  if(id==="esp32-devkit"||id==="esp8266") return `<div class="realBoard esp"><div class="shield">ESP<br><b>32</b></div><div class="usb usbEsp"></div><div class="antenna">▰▰▰</div><div class="espText">${id==="esp32-devkit"?"ESP32 DEVKIT":"ESP8266 NODEMCU"}</div><div class="headers top">${Array(9).fill("<i></i>").join("")}</div><div class="headers bottom">${Array(9).fill("<i></i>").join("")}</div></div>`;
  if(id==="breadboard") return `<div class="realBread"><div class="rail red"></div><div class="rail blue"></div><div class="holes">${Array(5).fill(0).map(()=>`<div>${Array(30).fill("<i></i>").join("")}</div>`).join("")}</div><b>830 TIE-POINTS</b></div>`;
  if(id==="hcsr04") return `<div class="realModule ultrasonic"><div class="eye"></div><div class="eye"></div><div class="moduleText">HC-SR04</div><div class="modulePins"><i></i><i></i><i></i><i></i></div></div>`;
  if(id==="dht11"||id==="dht22") return `<div class="realModule dht"><div class="grill">${Array(8).fill("<i></i>").join("")}</div><div class="moduleText">${id.toUpperCase()}</div><div class="modulePins"><i></i><i></i><i></i></div></div>`;
  if(id==="led") return `<div class="realBasic ledReal"><div class="ledCap"></div><div class="leg"></div><div class="leg short"></div></div>`;
  if(id==="resistor") return `<div class="realBasic resistorReal"><div class="wire"></div><div class="body"><i></i><i></i><i></i><i></i></div><div class="wire"></div></div>`;
  if(id==="button") return `<div class="realBasic buttonReal"><div class="buttonCap"></div><div class="buttonBase"></div><div class="legs"><i></i><i></i><i></i><i></i></div></div>`;
  if(id==="potentiometer") return `<div class="realBasic potReal"><div class="potKnob"></div><div class="potBody">10K</div><div class="potLegs"><i></i><i></i><i></i></div></div>`;
  if(id==="dc-motor") return `<div class="realBasic motorReal"><div class="motorBody"><b>M</b></div><div class="motorShaft"></div><div class="motorLegs"><i></i><i></i></div></div>`;
  if(id==="servo") return `<div class="realBasic servoReal"><div class="servoBody"><b>SERVO</b></div><div class="servoHorn">⌁</div><div class="servoWire">▂▂▂</div></div>`;
  if(id==="l298n"||id==="relay-module"||id==="mpu6050") return `<div class="realModule greenBoard"><div class="moduleChip">${id==="l298n"?"L298N":id==="relay-module"?"RELAY":"MPU6050"}</div><div class="terminalRow">${Array(8).fill("<i></i>").join("")}</div><div class="boardLabel">${d.name}</div></div>`;
  if(id==="oled"||id==="lcd16") return `<div class="realDisplay"><div class="displayGlass">${id==="oled"?"CIRCUVIA":"16×2 DISPLAY"}</div><div class="displayPins">${Array(id==="oled"?4:12).fill("<i></i>").join("")}</div></div>`;
  if(id==="buzzer") return `<div class="realBasic buzzerReal"><div class="buzzerTop"><span>+</span></div><div class="buzzerBase"></div><div class="buzzerLegs"><i></i><i></i></div></div>`;
  if(id==="nmosfet"||id==="irfz44n"||id==="bc547"||id==="bc557"||id==="2n2222") return `<div class="realBasic transistorReal"><div class="to92"><b>${id.toUpperCase()}</b></div><div class="tlegs"><i></i><i></i><i></i></div></div>`;
  return `<div class="realGeneric"><div class="genericChip">${d.name}</div><div class="genericPins">${Array(Math.min(d.pins.length,10)).fill("<i></i>").join("")}</div></div>`;
}

// Wokwi-style pin geometry: pins are connection points on the physical body,
// not a separate pin list underneath the component. Each definition may provide
// pinLayout: [{side:"left"|"right"|"top"|"bottom", offset:0..1}]. When it does
// not, we derive a stable layout from the pin count.
function pinLayout(def){
  if(def.pinLayout && def.pinLayout.length===def.pins.length) return def.pinLayout;
  if(PIN_LAYOUTS[def.id] && PIN_LAYOUTS[def.id].length===def.pins.length) return normalizePinLayout(PIN_LAYOUTS[def.id]);
  const n=def.pins.length, half=Math.ceil(n/2), out=[];
  for(let i=0;i<n;i++){
    const side=i<half?"left":"right";
    const idx=side==="left"?i:i-half, count=side==="left"?half:n-half;
    out.push({side,offset:count===1?.5:(idx/(count-1))});
  }
  return out;
}
function draw(o){
  const def=componentById[o.defId],el=document.createElement("div");
  el.className=`component ${def.kind}`;el.dataset.uid=o.uid;el.style.left=o.x+"px";el.style.top=o.y+"px";
  const pins=def.pins.map((p,i)=>`<div class="pin p${i}" data-pin-index="${i}" title="${p}"><span>${p}</span></div>`).join("");
  el.innerHTML=`<div class="compTitle"><div class="typeIcon ${def.kind}">${symbol(def.id)}</div><div><b>${def.name}</b><small>${def.kind}</small></div></div><div class="symbolBox">${realisticVisual(def)}<div class="pinLayer">${pins}</div></div>`;
  el.onmousedown=e=>{if(e.target.closest(".pin"))return;select(o.uid);startDrag(e,o.uid)};
  el.querySelectorAll(".pin").forEach((p,i)=>{
    p.onmousedown=e=>startWire(e,o.uid,i);
    p.ondblclick=e=>{e.stopPropagation();removeWireAt(o.uid,i)};
  });
  canvas.appendChild(el);layoutPins(el,def)
}
function layoutPins(el,def){
  const all=el.querySelectorAll(".pin"),layout=pinLayout(def);
  all.forEach((p,i)=>{
    const g=layout[i]||{side:"right",offset:.5}, off=Math.max(.04,Math.min(.96,g.offset));
    p.className=`pin p${i} ${g.side}`;
    p.style.left=p.style.right=p.style.top=p.style.bottom="";
    if(g.side==="left"||g.side==="right"){
      p.style.top=(off*100)+"%"; p.style[g.side]="-7px";
      const span=p.querySelector("span"); span.style.left=span.style.right="";
      span.style[g.side==="left"?"left":"right"]="15px";
    }else{
      p.style.left=(off*100)+"%"; p.style[g.side]="-7px";
      const span=p.querySelector("span"); span.style.left=span.style.right="";
      span.style[g.side==="top"?"top":"bottom"]="15px";
      span.style[g.side==="top"?"transform":"transform"]="translateX(-50%)";
    }
  });
}
function removeWireAt(uid,pinIndex){
  const before=wires.length;
  wires=wires.filter(w=>!(w.a===uid&&w.ap===pinIndex)&&!(w.b===uid&&w.bp===pinIndex));
  if(wires.length!==before){redraw();updateCount();log("Connection removed","warn")}
}
function startDrag(e,uid){dragState={uid,x:e.clientX,y:e.clientY};document.onmousemove=moveDrag;document.onmouseup=stopDrag}
function moveDrag(e){if(!dragState)return;const o=placed.find(x=>x.uid===dragState.uid);o.x+=e.clientX-dragState.x;o.y+=e.clientY-dragState.y;dragState.x=e.clientX;dragState.y=e.clientY;const el=document.querySelector(`[data-uid="${o.uid}"]`);el.style.left=o.x+"px";el.style.top=o.y+"px";redraw()}
function stopDrag(){dragState=null;document.onmousemove=null;document.onmouseup=null}
function startWire(e,uid,pinIndex){e.stopPropagation();wireState={uid,pinIndex};document.onmousemove=previewWire;document.onmouseup=endWire}
function pinCenter(uid,index){
  const el=document.querySelector(`[data-uid="${uid}"] .p${index}`);
  if(!el)return null;
  const r=canvas.getBoundingClientRect(),q=el.getBoundingClientRect();
  return {
    x:q.left-r.left+canvas.scrollLeft+q.width/2,
    y:q.top-r.top+canvas.scrollTop+q.height/2
  };
}
function previewWire(e){
  const r=canvas.getBoundingClientRect();
  redraw({x:e.clientX-r.left+canvas.scrollLeft,y:e.clientY-r.top+canvas.scrollTop});
}
function endWire(e){
  const target=e.target.closest(".pin");
  if(target){
    const parent=target.closest(".component"),uid=+parent.dataset.uid;
    const idx=Number(target.dataset.pinIndex);
    if(uid!==wireState.uid || idx!==wireState.pinIndex){
      const duplicate=wires.some(w=>(w.a===wireState.uid&&w.ap===wireState.pinIndex&&w.b===uid&&w.bp===idx)||(w.a===uid&&w.ap===idx&&w.b===wireState.uid&&w.bp===wireState.pinIndex));
      if(!duplicate){
        wires.push({a:wireState.uid,ap:wireState.pinIndex,b:uid,bp:idx});
        log(`Connected ${componentById[placed.find(x=>x.uid===wireState.uid)?.defId]?.name||"pin"} → ${componentById[placed.find(x=>x.uid===uid)?.defId]?.name||"pin"}`,"ok");
      }
    }
  }
  wireState=null;document.onmousemove=null;document.onmouseup=null;redraw();updateCount()
}
function redraw(preview=null){
  svg.innerHTML="";
  wires.forEach((w,i)=>drawLine(pinCenter(w.a,w.ap),pinCenter(w.b,w.bp),false,i));
  if(preview&&wireState)drawLine(pinCenter(wireState.uid,wireState.pinIndex),preview,true);
}
function drawLine(a,b,temp=false,index=-1){
  if(!a||!b)return;
  const p=document.createElementNS("http://www.w3.org/2000/svg","path");
  const midX=Math.round((a.x+b.x)/2), midY=Math.round((a.y+b.y)/2);
  // Wokwi-style Manhattan routing: horizontal/vertical segments only.
  let d;
  if(Math.abs(b.x-a.x)>=Math.abs(b.y-a.y))
    d=`M${a.x} ${a.y} H${midX} V${b.y} H${b.x}`;
  else
    d=`M${a.x} ${a.y} V${midY} H${b.x} V${b.y}`;
  p.setAttribute("d",d);p.classList.add(temp?"tempWire":"wire");
  p.dataset.wireIndex=index;
  if(!temp){
    p.addEventListener("dblclick",e=>{e.stopPropagation();if(index>=0){wires.splice(index,1);redraw();updateCount();log("Connection removed","warn")}});
  }
  svg.appendChild(p);
}
function select(uid){selected=uid;document.querySelectorAll(".component").forEach(e=>e.classList.toggle("selected",+e.dataset.uid===uid));renderInspector()}
function renderInspector(){
  if(!selected){inspector.innerHTML='<div class="emptyInspector"><div class="emptyIcon">⌁</div><b>Select a component</b><span>Its pins and properties will appear here.</span></div>';return}
  const o=placed.find(x=>x.uid===selected),d=componentById[o.defId];
  inspector.innerHTML=`<div class="selectedHeader"><div class="selectedIcon ${d.kind}">${symbol(d.id)}</div><div><b>${d.name}</b><small>${d.cat}</small></div></div>
  <div class="insSection"><div class="insTitle">PINS <span>${d.pins.length}</span></div><div class="pinList">${d.pins.map((p,i)=>`<div><i></i><b>${p}</b><small>${pinInfo(d,p)}</small></div>`).join("")}</div></div>
  <div class="insSection"><div class="insTitle">PROPERTIES</div>${Object.entries(o.props).map(([k,v])=>`<label>${k}<input data-prop="${k}" value="${v}"></label>`).join("")}</div>
  <button id="delete" class="delete">Delete component</button>`;
  inspector.querySelectorAll("[data-prop]").forEach(inp=>inp.oninput=()=>o.props[inp.dataset.prop]=inp.value);
  inspector.querySelector("#delete").onclick=deleteSelected
}
function pinInfo(d,p){if(/GND|K|-/.test(p))return"Ground";if(/VCC|VIN|3V3|5V|VBAT|VS/.test(p))return"Power";if(/PWM|~/.test(p))return"Digital / PWM";if(/AO|VRX|VRY/.test(p))return"Analog";if(/SDA/.test(p))return"I²C SDA";if(/SCL/.test(p))return"I²C SCL";if(/TX|RX/.test(p))return"UART";return d.kind==="sensor"?"Signal":"Digital I/O"}
function deleteSelected(){if(!selected)return;placed=placed.filter(o=>o.uid!==selected);wires=wires.filter(w=>w.a!==selected&&w.b!==selected);document.querySelector(`[data-uid="${selected}"]`)?.remove();selected=null;renderInspector();redraw();updateCount();log("Component deleted","warn")}
document.addEventListener("keydown",e=>{
  if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName))return;
  if(e.key==="Escape"&&wireState){wireState=null;document.onmousemove=null;document.onmouseup=null;redraw();return}
  if((e.key==="Delete"||e.key==="Backspace")&&selected){deleteSelected();return}
  if(selected&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
    const o=placed.find(x=>x.uid===selected); if(!o)return;
    const step=e.shiftKey?10:2;
    if(e.key==="ArrowLeft")o.x=Math.max(0,o.x-step);
    if(e.key==="ArrowRight")o.x+=step;
    if(e.key==="ArrowUp")o.y=Math.max(0,o.y-step);
    if(e.key==="ArrowDown")o.y+=step;
    const el=document.querySelector(`[data-uid="${o.uid}"]`);
    if(el){el.style.left=o.x+"px";el.style.top=o.y+"px"}
    redraw();e.preventDefault();
  }
});
document.getElementById("runBtn").onclick=()=>{running=!running;document.getElementById("status").textContent=running?"Running":"Ready";document.getElementById("status").className=running?"running":"ready";document.getElementById("runBtn").textContent=running?"■ Stop":"▶ Run";log(running?"Simulation started":"Simulation stopped",running?"ok":"warn")};
document.getElementById("compile").onclick=()=>{log("Code compiled for simulator preview","ok");log(`${placed.length} components · ${wires.length} connections`)};
document.getElementById("clearConsole").onclick=()=>consoleEl.innerHTML="<div>● Console cleared</div>";
document.getElementById("newBtn").onclick=()=>{if(confirm("Clear this circuit?")){placed=[];wires=[];selected=null;document.querySelectorAll(".component").forEach(e=>e.remove());document.querySelector(".dropHint").style.display="grid";renderInspector();redraw();updateCount();log("New circuit")}};
document.getElementById("saveBtn").onclick=()=>{localStorage.setItem("circuvia-v3",JSON.stringify({placed,wires,nextId}));log("Project saved locally","ok")};
document.getElementById("loadBtn").onclick=()=>{const s=localStorage.getItem("circuvia-v3");if(!s)return log("No saved project","warn");const d=JSON.parse(s);placed=d.placed||[];wires=d.wires||[];nextId=d.nextId||1;document.querySelectorAll(".component").forEach(e=>e.remove());placed.forEach(draw);document.querySelector(".dropHint").style.display=placed.length?"none":"grid";redraw();updateCount();log("Project loaded","ok")};
document.getElementById("zoomIn").onclick=()=>setZoom(Math.min(1.4,zoomLevel+.1));
document.getElementById("zoomOut").onclick=()=>setZoom(Math.max(.7,zoomLevel-.1));
document.getElementById("center").onclick=()=>{canvas.scrollLeft=0;canvas.scrollTop=0;setZoom(1)};
function setZoom(v){zoomLevel=v;document.getElementById("zoom").textContent=Math.round(v*100)+"%";canvas.style.setProperty("--zoom",v)}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")document.getElementById("compile").click()});
window.onresize=redraw;

// Start with a compact, useful demo circuit.
addComponent("arduino-uno",150,170);
addComponent("resistor",400,180);
addComponent("led",620,180);
select(null);updateCount()
