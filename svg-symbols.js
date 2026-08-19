// Circuvia original SVG component symbols
// Developer: Vineet Sharma
function svgSymbol(def){
  const id=def.id;
  const base=(body,extra="")=>`<svg class="compSvg" viewBox="0 0 180 90" aria-label="${def.name}">${body}${extra}</svg>`;
  const pin=(x,y,label,side="left")=>`<g class="svgPin" data-pin="${label}"><circle cx="${x}" cy="${y}" r="4"></circle><text x="${side==="left"?x+8:x-8}" y="${y+3}" text-anchor="${side==="left"?"start":"end"}">${label}</text></g>`;
  if(id==="led") return base(`<path d="M75 25h30v30H75z" class="part"/><path d="M82 55v12m16-12v12" class="line"/><path d="M78 18l8-7m6 7 8-7" class="line"/>`,pin(82,72,"A")+pin(98,72,"K","right"));
  if(id==="resistor") return base(`<path d="M55 45h12l6-15 12 30 12-30 12 30 12-15h6" class="line"/><path d="M45 45h10m70 0h10" class="line"/>`,pin(45,45,"A")+pin(135,45,"B","right"));
  if(id==="diode"||id==="flyback") return base(`<path d="M65 30l35 15-35 15z" class="part"/><path d="M105 30v30" class="line"/><path d="M45 45h20m40 0h30" class="line"/>`,pin(45,45,"A")+pin(135,45,"K","right"));
  if(id==="dc-motor") return base(`<circle cx="90" cy="45" r="28" class="part"/><text x="90" y="51" text-anchor="middle" class="bigText">M</text><path d="M35 45h27m56 0h27" class="line"/>`,pin(35,45,"+")+pin(145,45,"-","right"));
  if(id==="battery") return base(`<path d="M70 25v40m-12-30v20m32-20v20m12-30v40" class="line"/><path d="M45 45h13m44 0h33" class="line"/>`,pin(45,45,"+")+pin(135,45,"-","right"));
  if(id==="dht11"||id==="dht22") return base(`<rect x="55" y="20" width="70" height="50" rx="7" class="part"/><path d="M68 30v30m10-30v30m10-30v30m10-30v30m10-30v30" class="line"/>`,pin(55,30,"VCC")+pin(55,45,"DATA")+pin(55,60,"GND"));
  if(id==="hcsr04") return base(`<rect x="42" y="20" width="96" height="50" rx="7" class="part"/><circle cx="70" cy="45" r="15" class="part"/><circle cx="110" cy="45" r="15" class="part"/>`,pin(42,28,"VCC")+pin(42,45,"TRIG")+pin(42,60,"ECHO")+pin(138,60,"GND","right"));
  if(id==="servo") return base(`<rect x="62" y="18" width="60" height="54" rx="6" class="part"/><path d="M92 18V8m-8 8h16" class="line"/><text x="92" y="51" text-anchor="middle">SERVO</text>`,pin(62,28,"VCC")+pin(62,45,"SIG")+pin(62,60,"GND"));
  if(id==="bc547"||id==="bc557"||id==="2n2222") return base(`<path d="M90 25v40m0-20h30m-30 0L65 35m25 10L65 55" class="line"/><path d="M65 35l8 3m-8 17 8-3" class="line"/>`,pin(55,35,"B")+pin(125,45,"C","right")+pin(55,55,"E"));
  if(id==="nmosfet"||id==="irfz44n") return base(`<path d="M100 22v46m-18-35v24m18-12h25M82 35H65m17 10H65m17 10H65" class="line"/><path d="M65 35v20" class="line"/>`,pin(55,45,"G")+pin(135,33,"D","right")+pin(135,57,"S","right"));
  if(id==="arduino-uno") return base(`<rect x="48" y="8" width="84" height="74" rx="8" class="board"/><rect x="68" y="25" width="45" height="27" class="chip"/><text x="90" y="70" text-anchor="middle">UNO</text><circle cx="120" cy="18" r="4" class="ledDot"/>`);
  if(id==="esp32-devkit") return base(`<rect x="57" y="7" width="66" height="76" rx="8" class="board"/><rect x="70" y="27" width="40" height="25" class="chip"/><text x="90" y="70" text-anchor="middle">ESP32</text>`);
  if(id==="l298n") return base(`<rect x="45" y="12" width="90" height="66" rx="6" class="board"/><rect x="72" y="28" width="36" height="28" class="chip"/><text x="90" y="70" text-anchor="middle">L298N</text>`);
  if(id==="pir") return base(`<rect x="55" y="20" width="70" height="50" rx="7" class="part"/><circle cx="90" cy="43" r="17" class="dome"/>`,pin(55,30,"VCC")+pin(55,45,"OUT")+pin(55,60,"GND"));
  if(id==="ldr") return base(`<circle cx="90" cy="45" r="24" class="part"/><path d="M77 32l-8-8m15 6-4-10m15 10 4-10" class="line"/>`,pin(45,45,"VCC")+pin(135,45,"AO","right"));
  if(id==="mpu6050"||id==="bmp280"||id==="oled"||id==="i2clcd") return base(`<rect x="55" y="20" width="70" height="50" rx="5" class="board"/><rect x="78" y="34" width="24" height="20" class="chip"/><text x="90" y="65" text-anchor="middle">${id==="oled"?"OLED":"I²C"}</text>`);
  if(id==="lcd16") return base(`<rect x="35" y="20" width="110" height="50" rx="5" class="board"/><rect x="55" y="30" width="70" height="25" class="screen"/><text x="90" y="47" text-anchor="middle">16×2</text>`);
  if(id==="buzzer") return base(`<path d="M65 32h18l14-12v50L83 58H65z" class="part"/><path d="M103 32q18 13 0 26m7-32q27 19 0 38" class="line"/>`,pin(55,45,"+")+pin(125,45,"-","right"));
  return base(`<rect x="55" y="20" width="70" height="50" rx="7" class="part"/><text x="90" y="49" text-anchor="middle">${(def.name||"COMP").slice(0,10)}</text>`);
}
