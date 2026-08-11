const KEY="moneyphilo_discipline_v1";

const quotes=[
 "Follow the plan. Do not chase losses.",
 "Your job is execution, not prediction.",
 "A stop-loss is a boundary, not a challenge.",
 "Protect the bankroll before thinking about growth.",
 "One disciplined day is more valuable than one lucky result.",
 "If the plan says stop, stop.",
 "Do not increase risk because of an earlier loss.",
 "Consistency starts with respecting your limits.",
 "No trade is also a valid decision.",
 "Emotion is information—not an instruction."
];

const defaultState={
  theme:"light",
  activeAccountId:"acc-1",
  accounts:[{
    id:"acc-1",name:"Account 1",purpose:"Trading + Gambling",
    startingBankroll:10000,targetPct:5,stopPct:10,plannedDays:30,
    createdAt:new Date().toISOString(),results:{}
  }]
};

let state=load();
let pendingType=null;
let selectedReportDay=null;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    return x && x.accounts?.length ? x : structuredClone(defaultState);
  }catch(e){return structuredClone(defaultState)}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function active(){return state.accounts.find(a=>a.id===state.activeAccountId)||state.accounts[0]}
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0)}
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function parseKey(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)}
function dayIndex(a){
  const keys=Object.keys(a.results).sort();
  if(!keys.length)return 1;
  const start=new Date(a.createdAt); start.setHours(0,0,0,0);
  const today=new Date(); today.setHours(0,0,0,0);
  return Math.max(1,Math.floor((today-start)/86400000)+1);
}
function bankroll(a){
  return Number(a.startingBankroll)+Object.values(a.results).reduce((s,r)=>s+Number(r.pnl||0),0);
}
function todayResult(a){return a.results[dateKey()]||null}
function targetFor(a){
  return bankroll(a)*(Number(a.targetPct)/100);
}
function stopFor(a){
  return bankroll(a)*(Number(a.stopPct)/100);
}
function formatDate(d){return d.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}

function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  document.querySelectorAll(".theme-btn").forEach(b=>b.classList.toggle("selected",b.dataset.theme===state.theme));
}
function renderAccounts(){
  const sel=document.getElementById("accountSelect");
  sel.innerHTML="";
  state.accounts.forEach(a=>{
    const o=document.createElement("option");o.value=a.id;o.textContent=a.name;sel.appendChild(o)
  });
  sel.value=active().id;
}
function renderDashboard(){
  const a=active(), r=todayResult(a), target=targetFor(a), stop=stopFor(a), current=bankroll(a);
  document.getElementById("todayLine").textContent=formatDate(new Date());
  document.getElementById("dayLabel").textContent=`DAY ${dayIndex(a)} — DISCIPLINE PLAN`;
  document.getElementById("dailyQuote").textContent=quotes[new Date().getDate()%quotes.length];
  document.getElementById("winTarget").textContent=money(current+target);
  document.getElementById("winTargetGain").textContent=`+${money(target)} target`;
  document.getElementById("stopLoss").textContent=money(Math.max(0,current-stop));
  document.getElementById("stopLossText").textContent=`Maximum daily loss: ${money(stop)} (${a.stopPct}%)`;
  document.getElementById("currentBankroll").textContent=money(current);
  document.getElementById("todayPnl").textContent=money(r?.pnl||0);
  const progress=r ? Math.min(100,Math.max(0,Number(r.pnl||0)/target*100)) : 0;
  document.getElementById("progressText").textContent=`${Math.round(progress)}%`;
  document.getElementById("progressBar").style.width=`${progress}%`;

  const st=document.getElementById("sessionStatus");
  const win=document.getElementById("winBtn"),loss=document.getElementById("lossBtn"),no=document.getElementById("noTradeBtn");
  if(r){
    st.className=`status ${r.type==="WIN"?"good":r.type==="LOSS"?"bad":"neutral"}`;
    st.textContent=r.type==="NO_TRADE"?"No trade recorded. Day closed.":`${r.type}: ${money(r.pnl)} — Day closed.`;
    win.disabled=loss.disabled=no.disabled=true;
    [win,loss,no].forEach(x=>x.style.opacity=".5");
  }else{
    st.className="status neutral";st.textContent="No result recorded today.";
    win.disabled=loss.disabled=no.disabled=false;
    [win,loss,no].forEach(x=>x.style.opacity="1");
  }
  renderSettingsFields();
}

function openResult(type){
  if(todayResult(active()))return;
  pendingType=type;
  const a=active(), amount=type==="WIN"?targetFor(a):-stopFor(a);
  document.getElementById("modalTitle").textContent=type==="WIN"?"Record WIN":"Record LOSS";
  document.getElementById("modalHint").textContent=type==="WIN"
    ?`Planned target is ${money(amount)}. Enter the actual P&L.`
    :`Planned stop-loss is ${money(Math.abs(amount))}. Enter the actual loss amount.`;
  document.getElementById("resultAmount").value=Math.abs(amount).toFixed(2);
  document.getElementById("resultNote").value="";
  document.getElementById("resultModal").classList.remove("hidden");
}
function closeModal(){document.getElementById("resultModal").classList.add("hidden");pendingType=null}
function confirmResult(){
  const a=active(), raw=Number(document.getElementById("resultAmount").value);
  if(!Number.isFinite(raw)||raw<=0){alert("Please enter a valid amount.");return}
  const pnl=pendingType==="LOSS"?-Math.abs(raw):Math.abs(raw);
  a.results[dateKey()]={type:pendingType,pnl,note:document.getElementById("resultNote").value.trim(),time:new Date().toISOString()};
  save();closeModal();renderAll();
}
function recordNoTrade(){
  const a=active(); if(todayResult(a))return;
  a.results[dateKey()]={type:"NO_TRADE",pnl:0,note:"No trade / no play",time:new Date().toISOString()};
  save();renderAll();
}

function renderReport(){
  const a=active(), input=document.getElementById("reportMonth");
  if(!input.value) input.value=dateKey().slice(0,7);
  const [y,m]=input.value.split("-").map(Number), first=new Date(y,m-1,1), last=new Date(y,m,0);
  const days=last.getDate(), startOffset=first.getDay(), grid=document.getElementById("calendarGrid");
  grid.innerHTML="";
  let wins=0,losses=0,noTrade=0,pnl=0;
  Object.entries(a.results).forEach(([k,r])=>{
    if(k.startsWith(input.value)){
      pnl+=Number(r.pnl||0); if(r.type==="WIN")wins++; else if(r.type==="LOSS")losses++; else noTrade++;
    }
  });
  document.getElementById("reportPnl").textContent=money(pnl);
  document.getElementById("reportPnl").style.color=pnl>0?"var(--green)":pnl<0?"var(--red)":"var(--text)";
  document.getElementById("reportWins").textContent=wins;
  document.getElementById("reportLosses").textContent=losses;
  document.getElementById("reportNoTrade").textContent=noTrade;

  for(let i=0;i<startOffset;i++){const e=document.createElement("div");e.className="day empty";grid.appendChild(e)}
  for(let d=1;d<=days;d++){
    const key=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`,r=a.results[key];
    const e=document.createElement("button");e.className="day"+(key===dateKey()?" today ":"")+(r?(r.type==="WIN"?" win":r.type==="LOSS"?" loss":" no-trade"):"");
    e.innerHTML=`<span class="num">${d}</span><span class="mark">${r?(r.type==="WIN"?"✓":r.type==="LOSS"?"✕":"—"):""}</span>`;
    e.onclick=()=>showDay(key,r);grid.appendChild(e)
  }
  if(selectedReportDay && selectedReportDay.startsWith(input.value))showDay(selectedReportDay,a.results[selectedReportDay]);
}
function showDay(key,r){
  selectedReportDay=key;
  const box=document.getElementById("dayDetails");
  if(!r){box.textContent=`${formatDate(parseKey(key))}: No result recorded.`;return}
  box.innerHTML=`<strong>${formatDate(parseKey(key))}</strong><br>Result: <strong>${r.type}</strong><br>P&L: <strong>${money(r.pnl)}</strong>${r.note?`<br>Note: ${escapeHtml(r.note)}`:""}`;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function renderSettingsFields(){
  const a=active();
  document.getElementById("accountName").value=a.name;
  document.getElementById("startingBankroll").value=a.startingBankroll;
  document.getElementById("targetPct").value=a.targetPct;
  document.getElementById("stopPct").value=a.stopPct;
  document.getElementById("plannedDays").value=a.plannedDays;
  document.getElementById("purpose").value=a.purpose;
}
function saveAccount(){
  const a=active();
  const name=document.getElementById("accountName").value.trim();
  const start=Number(document.getElementById("startingBankroll").value);
  const target=Number(document.getElementById("targetPct").value);
  const stop=Number(document.getElementById("stopPct").value);
  const days=Number(document.getElementById("plannedDays").value);
  if(!name||!Number.isFinite(start)||start<0||!Number.isFinite(target)||target<0||!Number.isFinite(stop)||stop<0||!Number.isFinite(days)||days<1){alert("Please enter valid settings.");return}
  a.name=name;a.startingBankroll=start;a.targetPct=target;a.stopPct=stop;a.plannedDays=days;a.purpose=document.getElementById("purpose").value;
  save();renderAll();alert("Account settings saved.");
}
function addAccount(){
  const id="acc-"+Date.now();
  state.accounts.push({id,name:`Account ${state.accounts.length+1}`,purpose:"Trading + Gambling",startingBankroll:10000,targetPct:5,stopPct:10,plannedDays:30,createdAt:new Date().toISOString(),results:{}});
  state.activeAccountId=id;save();renderAll();go("settings");
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`moneyphilo-backup-${dateKey()}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importData(file){
  const reader=new FileReader();
  reader.onload=()=>{try{const x=JSON.parse(reader.result);if(!x.accounts?.length)throw Error();state=x;save();renderAll();alert("Backup imported successfully.")}catch(e){alert("Invalid Moneyphilo backup file.")}};
  reader.readAsText(file);
}
function resetAll(){
  if(!confirm("Delete all accounts, results and settings? This cannot be undone."))return;
  state=structuredClone(defaultState);save();renderAll();
}
function calc(){
  const s=Number(document.getElementById("calcStart").value)||0,r=Number(document.getElementById("calcRate").value)||0,d=Number(document.getElementById("calcDays").value)||0;
  document.getElementById("calcResult").textContent=money(s*Math.pow(1+r/100,d));
}
function go(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  if(page==="report")renderReport();
}

function renderAll(){applyTheme();renderAccounts();renderDashboard();renderReport();calc()}

document.getElementById("accountSelect").onchange=e=>{state.activeAccountId=e.target.value;save();renderAll()};
document.getElementById("addAccountBtn").onclick=addAccount;
document.getElementById("settingsBtn").onclick=()=>go("settings");
document.getElementById("winBtn").onclick=()=>openResult("WIN");
document.getElementById("lossBtn").onclick=()=>openResult("LOSS");
document.getElementById("noTradeBtn").onclick=recordNoTrade;
document.getElementById("modalClose").onclick=closeModal;
document.getElementById("confirmResultBtn").onclick=confirmResult;
document.getElementById("reportMonth").onchange=renderReport;
document.getElementById("saveAccountBtn").onclick=saveAccount;
document.querySelectorAll(".theme-btn").forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;save();applyTheme()});
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>go(b.dataset.page));
document.getElementById("exportBtn").onclick=exportData;
document.getElementById("importInput").onchange=e=>e.target.files[0]&&importData(e.target.files[0]);
document.getElementById("resetAllBtn").onclick=resetAll;
["calcStart","calcRate","calcDays"].forEach(id=>document.getElementById(id).oninput=calc);
document.getElementById("resultModal").addEventListener("click",e=>{if(e.target.id==="resultModal")closeModal()});

renderAll();
