(() => {
"use strict";

const KEY="moneyphilo_master_v4";
const quotes=[
"Your job is not to win every session. Your job is to follow the plan.",
"Protect the bankroll first. Opportunity comes later.",
"Discipline is doing what the plan says when emotions say otherwise.",
"A stop loss is a boundary, not an invitation to chase.",
"Small consistent decisions matter more than one big result.",
"Plan the exit before the session begins.",
"Patience is a position too.",
"Do not increase risk just because the last result hurt.",
"Record the behavior, not only the money.",
"Your bankroll is a resource. Treat it with respect.",
"Emotion makes decisions fast; discipline makes decisions clear.",
"Know your maximum loss before you start.",
"Missing a setup is better than forcing one.",
"Stay alive first. Performance comes second.",
"One bad decision does not need a second bad decision.",
"Follow the process even when the outcome is uncertain.",
"Risk management is about surviving your own mistakes.",
"Goals need rules, and rules need discipline."
];

const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const nowTime=()=>new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const signed=n=>(n>=0?"+":"−")+money(Math.abs(n));
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const $=id=>document.getElementById(id);

function fresh(){
  const a={id:uid(),name:"Account 1",start:1000,balance:1000,win:5,loss:15.5,compoundDays:10,events:[],sessions:[],created:todayISO()};
  return {version:4,accounts:[a],active:a.id,sound:true,historyFilter:"all",month:new Date().getMonth(),year:new Date().getFullYear()};
}
let D;
try{D=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){D=null}
if(!D||!Array.isArray(D.accounts)||!D.accounts.length)D=fresh();

function save(){localStorage.setItem(KEY,JSON.stringify(D))}
function active(){return D.accounts.find(a=>a.id===D.active)||D.accounts[0]}
function events(a=active()){return a.events||[]}
function wins(a){return events(a).filter(e=>e.result==="win")}
function losses(a){return events(a).filter(e=>e.result==="loss")}
function eventFor(a,date){return events(a).find(e=>e.date===date)}
function pnl(a){return events(a).reduce((s,e)=>s+Number(e.pnl||0),0)}
function peak(a){
  let b=a.start,p=a.start;
  events(a).slice().sort((x,y)=>(x.time||"").localeCompare(y.time||"")).forEach(e=>{b+=Number(e.pnl||0);p=Math.max(p,b)});
  return p;
}
function drawdown(a){
  const p=peak(a),cur=a.balance;
  return p?Math.max(0,(p-cur)/p*100):0;
}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(showToast.x);showToast.x=setTimeout(()=>t.classList.remove("show"),2200)}
function beep(kind="win"){
  if(!D.sound)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=new C(),o=c.createOscillator(),g=c.createGain();
    o.type=kind==="loss"?"sawtooth":"sine";
    o.frequency.setValueAtTime(kind==="loss"?180:620,c.currentTime);
    o.frequency.exponentialRampToValueAtTime(kind==="loss"?90:920,c.currentTime+.22);
    g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.42);
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.43);
  }catch(e){}
}
function vibrate(pattern){if(navigator.vibrate)try{navigator.vibrate(pattern)}catch(e){}}

function renderAll(){
  renderAccountsSelect();renderHome();renderCalendar();renderAccounts();renderHistory();renderReports();renderTimerHistory();
  $("soundToggle").textContent=D.sound?"🔊":"🔇";
  save();
}
function renderAccountsSelect(){
  const s=$("accountSelect");s.innerHTML="";
  D.accounts.forEach(a=>{const o=document.createElement("option");o.value=a.id;o.textContent=a.name;s.appendChild(o)});
  s.value=active().id;
}
function renderHome(){
  const a=active(), p=pnl(a);
  $("currentBankroll").textContent=money(a.balance);$("startBankroll").textContent=money(a.start);$("netPnl").textContent=signed(p);
  const winAmt=a.balance*(1+a.win/100), lossAmt=Math.max(0,a.balance*(1-a.loss/100));
  $("winRate").textContent=a.win+"%";$("lossRate").textContent=a.loss+"%";
  $("winTarget").textContent=money(winAmt);$("lossTarget").textContent=money(lossAmt);
  $("winFrom").textContent=money(a.balance);$("lossFrom").textContent=money(a.balance);
  $("winDelta").textContent="+"+money(winAmt-a.balance);$("lossDelta").textContent="−"+money(a.balance-lossAmt);
  $("compoundStart").value=a.start;$("compoundRate").value=a.win;$("compoundDays").value=a.compoundDays;
  $("wins").textContent=wins(a).length;$("losses").textContent=losses(a).length;$("pnlStat").textContent=signed(p);$("drawdown").textContent=drawdown(a).toFixed(1)+"%";
  const ev=eventFor(a,todayISO());const status=$("todayStatus");
  status.className="today-status "+(ev?.result==="win"?"win":ev?.result==="loss"?"loss":"neutral");
  status.textContent=ev?(ev.result==="win"?`🟢 Target hit • ${signed(ev.pnl)} • bankroll ${money(ev.balanceAfter)}`:ev.result==="loss"?`🔴 Stop loss • ${signed(ev.pnl)} • bankroll ${money(ev.balanceAfter)}`:"⬜ No trade"): "No session recorded today";
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short",year:"numeric"});
  const qIndex=(new Date().getFullYear()*1000+new Date().getMonth()*31+new Date().getDate())%quotes.length;
  $("dailyQuote").textContent=quotes[qIndex];
  $("noteInput").value=ev?.note||"";
  $("undoBtn").disabled=!a.lastAction;
  buildPlan();
}
function buildPlan(){
  const a=active(),start=Number($("compoundStart").value||a.start),rate=Number($("compoundRate").value||a.win),days=Math.max(1,Math.min(365,Number($("compoundDays").value||a.compoundDays)));
  let b=start,rows="",values=[b];
  const completed=new Set(events(a).filter(e=>e.result==="win"&&e.compoundDay).map(e=>e.compoundDay));
  let done=0;
  for(let i=1;i<=days;i++){const next=b*(1+rate/100);if(completed.has(i))done++;rows+=`<div class="compound-row ${completed.has(i)?"done":""}"><b>Day ${i}</b><span>${money(b)}</span><span>→</span><b>${money(next)}</b></div>`;b=next;values.push(b)}
  $("compoundBadge").textContent=done+" steps";$("planSummary").innerHTML=`Start <b>${money(start)}</b> • ${rate}% daily • <b>${days} days</b> • Final target <b>${money(b)}</b>`;
  const pct=Math.min(100,done/days*100);$("progressText").textContent=`${done} / ${days} DAYS COMPLETED`;$("progressPct").textContent=pct.toFixed(0)+"%";$("progressBar").style.width=pct+"%";$("compoundTable").innerHTML=rows;
  drawChart(values,done);
}
function drawChart(values,done){
  const c=$("compoundChart"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth||300,h=c.clientHeight||160;
  c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const max=Math.max(...values),min=Math.min(...values),L=10,R=10,T=16,B=20;
  ctx.strokeStyle="#e5e8ee";ctx.lineWidth=1;
  for(let i=0;i<4;i++){let y=T+(h-T-B)*i/3;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke()}
  ctx.strokeStyle="#243b8f";ctx.lineWidth=3;ctx.beginPath();
  values.forEach((v,i)=>{let x=L+(w-L-R)*i/(values.length-1||1),y=T+(h-T-B)*(1-(v-min)/(max-min||1));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  const x=L+(w-L-R)*done/(values.length-1||1);ctx.fillStyle="#168b46";ctx.beginPath();ctx.arc(x,T+(h-T-B)*(1-(values[Math.min(done,values.length-1)]-min)/(max-min||1)),5,0,Math.PI*2);ctx.fill();
}
function record(result){
  const a=active(),date=todayISO(),old=eventFor(a,date);
  if(old){showToast("Today already has a result. Use Undo or edit it from History.");return}
  const amount=result==="win"?a.balance*a.win/100:-a.balance*a.loss/100;
  const after=Math.max(0,a.balance+amount);
  const compoundDay= result==="win" ? Math.min(a.compoundDays,wins(a).length+1) : null;
  const ev={id:uid(),date,time:nowTime(),result,pnl:amount,balanceAfter:after,compoundDay,note:""};
  a.balance=after;a.events.push(ev);a.lastAction={eventId:ev.id,previousBalance:after-amount};
  save();renderAll();beep(result);vibrate(result==="win"?[50,30,80]:[200,80,200,80,300]);
  showToast(result==="win"?"🎉 TARGET HIT — Plan followed":"🔴 STOP LOSS HIT — Session protected");
}
function undo(){
  const a=active();if(!a.lastAction)return;
  const i=a.events.findIndex(e=>e.id===a.lastAction.eventId);if(i<0)return;
  a.balance=a.lastAction.previousBalance;a.events.splice(i,1);a.lastAction=null;save();renderAll();showToast("Last action undone");
}
function saveNote(){
  const a=active(),ev=eventFor(a,todayISO());
  if(!ev){showToast("Record WIN or STOP LOSS first.");return}
  ev.note=$("noteInput").value.trim();save();renderAll();showToast("Note saved");
}

function renderCalendar(){
  const a=active(),y=D.year,m=D.month;const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=first.getDay();
  $("monthTitle").textContent=first.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const g=$("calendarGrid");g.innerHTML="";
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(x=>{const d=document.createElement("div");d.className="dow";d.textContent=x;g.appendChild(d)});
  for(let i=0;i<start;i++){const d=document.createElement("div");d.className="day empty";g.appendChild(d)}
  for(let day=1;day<=days;day++){
    const date=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,e=eventFor(a,date),d=document.createElement("button");
    d.className="day"+(date===todayISO()?" today ":"")+(e?.result==="win"?" win-day":e?.result==="loss"?" loss-day":e?.result==="no-trade"?" no-trade":"");
    d.setAttribute("aria-label",`${date}${e?": "+e.result:" no trade"}`);d.innerHTML=`${day}${e?`<span class="mark">${e.result==="win"?"✓":e.result==="loss"?"−":"·"}</span>`:""}`;d.onclick=()=>showDay(date);g.appendChild(d);
  }
}
function showDay(date){
  const e=eventFor(active(),date);const box=$("dayDetail");
  if(!e){box.innerHTML=`<div class="empty-state"><b>${date}</b><br>No recorded session for this date.</div>`;return}
  box.innerHTML=`<b>${date}</b><div class="detail-grid"><div class="detail-item"><span>RESULT</span><b>${e.result.toUpperCase()}</b></div><div class="detail-item"><span>P&amp;L</span><b>${signed(e.pnl)}</b></div><div class="detail-item"><span>BANKROLL AFTER</span><b>${money(e.balanceAfter)}</b></div><div class="detail-item"><span>TIME</span><b>${e.time||"—"}</b></div></div>${e.note?`<div class="note-box">📝 ${escapeHtml(e.note)}</div>`:""}`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function renderAccounts(){
  const list=$("accountsList");list.innerHTML="";
  D.accounts.forEach(a=>{const div=document.createElement("div");div.className="account-item";div.innerHTML=`<div><h3>${escapeHtml(a.name)}</h3><p>Start ${money(a.start)} • ${wins(a).length} wins • ${losses(a).length} losses • ${a.compoundDays} days</p></div><div class="account-value">${money(a.balance)}</div><div class="account-actions"><button class="small-btn switch" data-id="${a.id}">OPEN</button><button class="small-btn rename" data-id="${a.id}">RENAME</button><button class="small-btn delete" data-id="${a.id}">DELETE</button></div>`;list.appendChild(div)});
  list.querySelectorAll(".switch").forEach(b=>b.onclick=()=>{D.active=b.dataset.id;go("home");renderAll()});
  list.querySelectorAll(".rename").forEach(b=>b.onclick=()=>renameAccount(b.dataset.id));
  list.querySelectorAll(".delete").forEach(b=>b.onclick=()=>deleteAccount(b.dataset.id));
  const total=D.accounts.reduce((s,a)=>s+a.balance,0),cp=D.accounts.reduce((s,a)=>s+pnl(a),0),w=D.accounts.reduce((s,a)=>s+wins(a).length,0),l=D.accounts.reduce((s,a)=>s+losses(a).length,0);
  $("combinedPnl").textContent=signed(cp);$("combinedBankroll").textContent=money(total);$("combinedWins").textContent=w;$("combinedLosses").textContent=l;
}
function renameAccount(id){const a=D.accounts.find(x=>x.id===id);const n=prompt("New account name",a.name);if(n?.trim()){a.name=n.trim();save();renderAll()}}
function deleteAccount(id){if(D.accounts.length===1){showToast("Keep at least one account.");return}const a=D.accounts.find(x=>x.id===id);if(confirm(`Delete "${a.name}" and its complete history?`)){D.accounts=D.accounts.filter(x=>x.id!==id);if(D.active===id)D.active=D.accounts[0].id;save();renderAll()}}
function openAccountDialog(){ $("newName").value=`Account ${D.accounts.length+1}`;$("newStart").value=1000;$("newWin").value=5;$("newLoss").value=15.5;$("newDays").value=10;$("accountDialog").showModal()}
function createAccount(e){
  e.preventDefault();
  const a={id:uid(),name:$("newName").value.trim(),start:Number($("newStart").value),balance:Number($("newStart").value),win:Number($("newWin").value),loss:Number($("newLoss").value),compoundDays:Number($("newDays").value),events:[],sessions:[],created:todayISO()};
  if(!a.name||a.start<0)return;D.accounts.push(a);D.active=a.id;$("accountDialog").close();save();renderAll();go("home");showToast("Account created");
}

function renderHistory(){
  const a=active(),list=$("historyList"),filter=D.historyFilter||"all";list.innerHTML="";
  let es=events(a).slice().reverse();if(filter!=="all")es=es.filter(e=>e.result===filter);
  if(!es.length){list.innerHTML='<div class="empty-state">No history yet. Your first recorded result will appear here.</div>';return}
  es.forEach(e=>{const d=document.createElement("div");d.className="history-item";d.innerHTML=`<div><h3>${e.result==="win"?"🟢 WIN TARGET":"🔴 STOP LOSS"} • ${e.date}</h3><p>${e.time||""} • Bankroll after ${money(e.balanceAfter)}${e.compoundDay?` • Compound day ${e.compoundDay}`:""}</p></div><div class="history-amount ${e.result}">${signed(e.pnl)}</div><div class="history-actions">${e.note?`<small>📝 ${escapeHtml(e.note)}</small>`:""}<button class="small-btn edit-event" data-id="${e.id}">EDIT</button><button class="small-btn del-event" data-id="${e.id}">DELETE</button></div>`;list.appendChild(d)});
  list.querySelectorAll(".del-event").forEach(b=>b.onclick=()=>deleteEvent(b.dataset.id));
  list.querySelectorAll(".edit-event").forEach(b=>b.onclick=()=>editEvent(b.dataset.id));
}
function deleteEvent(id){
  const a=active(),i=a.events.findIndex(e=>e.id===id);if(i<0)return;if(!confirm("Delete this record? Bankroll will be recalculated from the starting bankroll."))return;
  a.events.splice(i,1);recalc(a);save();renderAll();
}
function editEvent(id){
  const a=active(),e=a.events.find(x=>x.id===id);if(!e)return;
  const result=prompt("Enter win or loss",e.result);if(result!=="win"&&result!=="loss")return;
  const amount=Number(prompt("Enter P&L amount (positive/negative)",e.pnl));if(!Number.isFinite(amount))return;
  e.result=result;e.pnl=amount;recalc(a);save();renderAll();
}
function recalc(a){let b=a.start;a.events.sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));a.events.forEach(e=>{b+=Number(e.pnl||0);e.balanceAfter=b});a.balance=b;a.lastAction=null}

function metrics(es){
  const profit=es.filter(e=>e.pnl>0).reduce((s,e)=>s+e.pnl,0),loss=es.filter(e=>e.pnl<0).reduce((s,e)=>s+Math.abs(e.pnl),0),w=es.filter(e=>e.result==="win").length,l=es.filter(e=>e.result==="loss").length,tr=w+l;
  return {pnl:profit-loss,profit,loss,w,l,tr,rate:tr?w/tr*100:0,best:es.length?Math.max(...es.map(e=>e.pnl)):0,worst:es.length?Math.min(...es.map(e=>e.pnl)):0};
}
function renderReports(){
  const box=$("reportContent");const a=active();if(!box)return;
  if(window.reportMode==="year")renderYear(box,a);else renderMonth(box,a);
}
function metricHtml(m){return `<div class="report-metrics"><div class="metric"><span>PROFIT</span><b>+${money(m.profit)}</b></div><div class="metric"><span>LOSS</span><b>−${money(m.loss)}</b></div><div class="metric"><span>TARGET DAYS</span><b>${m.w}</b></div><div class="metric"><span>STOP-LOSS DAYS</span><b>${m.l}</b></div><div class="metric"><span>TRADING DAYS</span><b>${m.tr}</b></div><div class="metric"><span>WIN RATE</span><b>${m.rate.toFixed(1)}%</b></div><div class="metric"><span>BEST DAY</span><b>${signed(m.best)}</b></div><div class="metric"><span>WORST DAY</span><b>${signed(m.worst)}</b></div></div>`}
function renderMonth(box,a){
  const y=D.year,m=D.month,es=events(a).filter(e=>{const d=new Date(e.date+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m}),mm=metrics(es),daysIn=new Date(y,m+1,0).getDate(),trading=new Set(es.filter(e=>e.result!=="no-trade").map(e=>e.date)).size;
  box.innerHTML=`<div class="report-card"><h3>${new Date(y,m,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h3><div class="report-total ${mm.pnl>=0?"pos":"neg"}">${signed(mm.pnl)}</div>${metricHtml(mm)}<div class="metric" style="margin-top:6px"><span>NO-TRADE / BLANK DAYS</span><b>${daysIn-trading}</b></div></div>`;
}
function renderYear(box,a){
  const y=D.year,es=events(a).filter(e=>new Date(e.date+"T12:00:00").getFullYear()===y),m=metrics(es);
  let rows="";for(let i=0;i<12;i++){const me=metrics(es.filter(e=>new Date(e.date+"T12:00:00").getMonth()===i));rows+=`<div class="month-row ${me.pnl>=0?"pos":"neg"}"><span>${new Date(y,i,1).toLocaleDateString(undefined,{month:"short"})}</span><b>${signed(me.pnl)}</b></div>`}
  box.innerHTML=`<div class="report-card"><h3>${y} Year Total</h3><div class="report-total ${m.pnl>=0?"pos":"neg"}">${signed(m.pnl)}</div>${metricHtml(m)}<h3 style="margin-top:13px">Month-by-month P&amp;L</h3><div class="month-list">${rows}</div></div>`;
}

function renderTimerHistory(){
  const list=$("sessionHistory"),a=active();list.innerHTML="";
  (a.sessions||[]).slice().reverse().slice(0,20).forEach(s=>{const d=document.createElement("div");d.className="session-item";d.innerHTML=`<b>⏱ ${s.duration} min session</b><p>${s.date} • ${s.time} • ${s.status}</p>`;list.appendChild(d)});
  if(!list.children.length)list.innerHTML='<div class="empty-state">Completed timed sessions will appear here.</div>';
}

let timer={seconds:1800,running:false,interval:null};
function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function updateTimer(){ $("timerDisplay").textContent=formatTime(timer.seconds)}
function setTimer(){const min=Math.max(1,Math.min(999,Number($("timerMinutes").value||30)));timer.seconds=min*60;timer.running=false;clearInterval(timer.interval);updateTimer();$("timeUp").hidden=true}
function startTimer(){
  if(timer.seconds<=0)setTimer();if(timer.running)return;
  timer.running=true;$("timeUp").hidden=true;
  timer.interval=setInterval(()=>{timer.seconds--;updateTimer();if(timer.seconds<=0){clearInterval(timer.interval);timer.running=false;timeUp()}},1000);
}
function timeUp(){
  $("timeUp").hidden=false;beep("loss");vibrate([300,100,300,100,500,100,500]);showToast("⏰ TIME UP — session ended");
  const a=active();a.sessions=a.sessions||[];a.sessions.push({date:todayISO(),time:nowTime(),duration:Number($("timerMinutes").value||30),status:"Time up"});save();renderTimerHistory();
}
function pauseTimer(){timer.running=false;clearInterval(timer.interval)}
function resetTimer(){timer.running=false;clearInterval(timer.interval);setTimer()}

function go(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$("view-"+view).classList.add("active");
  document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="reports")renderReports();
}
let monthChanged=false;
window.reportMode="month";

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>go(b.dataset.view));
$("accountSelect").onchange=()=>{D.active=$("accountSelect").value;renderAll()};
$("addAccountBtn").onclick=openAccountDialog;$("newAccount2").onclick=openAccountDialog;
$("accountForm").onsubmit=createAccount;
$("winBtn").onclick=()=>record("win");$("lossBtn").onclick=()=>record("loss");$("undoBtn").onclick=undo;$("saveNoteBtn").onclick=saveNote;
$("calculateBtn").onclick=()=>{const a=active();a.compoundDays=Number($("compoundDays").value||10);a.win=Number($("compoundRate").value||a.win);save();renderAll();showToast("Compounding plan updated")};
["compoundDays","compoundRate","compoundStart"].forEach(id=>$(id).addEventListener("input",buildPlan));
$("prevMonth").onclick=()=>{D.month--;if(D.month<0){D.month=11;D.year--}renderCalendar();renderReports()};
$("nextMonth").onclick=()=>{D.month++;if(D.month>11){D.month=0;D.year++}renderCalendar();renderReports()};
$("allHistory").onclick=()=>{D.historyFilter="all";setFilters();renderHistory()};$("winHistory").onclick=()=>{D.historyFilter="win";setFilters();renderHistory()};$("lossHistory").onclick=()=>{D.historyFilter="loss";setFilters();renderHistory()};
function setFilters(){document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",(D.historyFilter==="all"&&b.id==="allHistory")||(D.historyFilter==="win"&&b.id==="winHistory")||(D.historyFilter==="loss"&&b.id==="lossHistory")))}
$("monthlyTab").onclick=()=>{window.reportMode="month";$("monthlyTab").classList.add("active");$("yearlyTab").classList.remove("active");renderReports()};
$("yearlyTab").onclick=()=>{window.reportMode="year";$("yearlyTab").classList.add("active");$("monthlyTab").classList.remove("active");renderReports()};
$("soundToggle").onclick=()=>{D.sound=!D.sound;save();renderAll();showToast(D.sound?"Sound on":"Sound off")};
$("startTimer").onclick=startTimer;$("pauseTimer").onclick=pauseTimer;$("resetTimer").onclick=resetTimer;$("setTimerBtn").onclick=setTimer;

$("confirmNo").onclick=()=>$("confirmDialog").close();

window.addEventListener("resize",()=>{if($("view-home").classList.contains("active"))buildPlan()});
window.addEventListener("beforeunload",save);

renderAll();updateTimer();setFilters();
})();
