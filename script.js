const KEY="moneyphilo_v1";
const quotes=[
"Your job is to follow your rules, not chase money.",
"Protect the bankroll first. Profit comes second.",
"Discipline means stopping when your plan says stop.",
"A good exit is part of a good plan.",
"Never let one emotional decision control the whole session.",
"Consistency matters more than excitement.",
"Bankroll management is a discipline, not a prediction.",
"Chasing a loss turns a small mistake into a bigger one.",
"Control the risk before you think about the reward.",
"Winning is not proof of a good decision. Following the plan is.",
"Your emotions want action; your strategy wants patience.",
"Know your goal before the session and your exit before the decision.",
"One disciplined session is better than one lucky session.",
"Stay in control when you win and when you lose.",
"Protect today's bankroll so tomorrow remains an option.",
"The strongest move can be walking away."
];
let data=load();
let selectedAccount=data.accounts[0]?.id;
let calDate=new Date(); calDate.setDate(1);
let timer={seconds:1800,running:false,interval:null};

function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function money(n){return (n<0?"−":"₹")+Math.abs(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
function today(){return new Date().toISOString().slice(0,10)}
function dateKey(d){return new Date(d).toISOString().slice(0,10)}
function load(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY));
  if(x&&Array.isArray(x.accounts)&&x.accounts.length)return x;
 }catch(e){}
 return {accounts:[newAccount("Account 1",1000,5,100,100)],records:[],notes:{}};
}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function newAccount(name,start,target,stop,stake){
 return {id:id(),name:name||"Account",start:Number(start)||0,target:Number(target)||0,stop:Number(stop)||0,stake:Number(stake)||0,peak:Number(start)||0,created:today()};
}
function account(){return data.accounts.find(a=>a.id===selectedAccount)||data.accounts[0]}
function accountRecords(a=account()){return data.records.filter(r=>r.accountId===a.id)}
function net(a=account()){return accountRecords(a).reduce((s,r)=>s+r.amount,0)}
function current(a=account()){return a.start+net(a)}
function targetAmount(a=account()){return current(a)*a.target/100}
function q(){let d=new Date();let n=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();return quotes[n%quotes.length]}
function renderAll(){populateSelects();renderDashboard();renderCalendar();renderAccounts();renderHistory();renderReports();$("quote").textContent=q()}
function populateSelects(){
 const opts=data.accounts.map(a=>`<option value="${a.id}">${escape(a.name)}</option>`).join("");
 ["accountSelect","historyAccount","reportAccount"].forEach(k=>{let el=$(k);let old=el.value;el.innerHTML=opts;el.value=(data.accounts.some(a=>a.id===old)?old:selectedAccount)||data.accounts[0].id});
 $("accountSelect").value=selectedAccount;
}
function renderDashboard(){
 const a=account();if(!a)return;
 const cur=current(a), n=net(a), t=targetAmount(a), rec=accountRecords(a);
 const wins=rec.filter(r=>r.type==="WIN").length, losses=rec.filter(r=>r.type==="LOSS").length;
 const peak=Math.max(a.start,...rec.map(r=>r.balance));
 const dd=peak?Math.max(0,(peak-cur)/peak*100):0;
 const progress=t>0?Math.max(0,Math.min(100,(n/t)*100)):0;
 $("currentBankroll").textContent=money(cur);$("netPnl").textContent=(n>=0?"+":"")+money(n);
 $("targetValue").textContent=money(t);$("targetPct").textContent=Math.round(progress)+"%";$("progressBar").style.width=progress+"%";
 $("wins").textContent=wins;$("losses").textContent=losses;$("compoundCount").textContent=rec.filter(r=>r.type==="WIN"&&r.compound).length;$("drawdown").textContent=dd.toFixed(2)+"%";
 $("winAmount").textContent="+"+money(t);$("lossAmount").textContent="−"+money(a.stop||a.stake);
 $("targetNote").textContent=n>=t&&t>0?"Target reached. Follow your exit plan.":"Follow your plan. One decision at a time.";
 $("startInput").value=a.start;$("targetInput").value=a.target;$("stopInput").value=a.stop;$("stakeInput").value=a.stake;
}
function renderCalendar(){
 const y=calDate.getFullYear(),m=calDate.getMonth();$("calendarMonth").textContent=calDate.toLocaleString("en-IN",{month:"long",year:"numeric"});
 let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),html="";
 for(let i=0;i<first;i++)html+='<div class="day empty"></div>';
 for(let d=1;d<=days;d++){
  let k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,rs=data.records.filter(r=>r.accountId===selectedAccount&&r.date===k);
  let cls=rs.some(r=>r.type==="WIN"&&r.targetHit)?"green":rs.some(r=>r.type==="LOSS"&&r.stopHit)?"red":"";
  if(k===today())cls+=" today";
  html+=`<button class="day ${cls}" data-day="${k}">${d}${rs.length?`<small>${money(rs.reduce((s,r)=>s+r.amount,0))}</small>`:""}</button>`;
 }
 $("calendarGrid").innerHTML=html;
 document.querySelectorAll(".day[data-day]").forEach(b=>b.onclick=()=>showDay(b.dataset.day));
}
function showDay(k){
 const rs=data.records.filter(r=>r.accountId===selectedAccount&&r.date===k);
 if(!rs.length){$("dayDetail").innerHTML=`<b>${k}</b><br>No trade / no session.`;return}
 const pnl=rs.reduce((s,r)=>s+r.amount,0);
 $("dayDetail").innerHTML=`<b>${k}</b><br>P&L: <b>${money(pnl)}</b> • ${rs.filter(r=>r.type==="WIN").length} wins • ${rs.filter(r=>r.type==="LOSS").length} losses<br>Status: ${rs.some(r=>r.type==="WIN"&&r.targetHit)?"Target hit":rs.some(r=>r.type==="LOSS"&&r.stopHit)?"Stop loss":"Session recorded"}<br>${rs.map(r=>`${r.time} — ${r.type} ${money(r.amount)}`).join("<br>")}`;
}
function renderAccounts(){
 $("accountsList").innerHTML=data.accounts.map(a=>{
  const r=accountRecords(a),n=net(a);
  return `<div class="account-card card"><div class="row"><span class="account-name">${escape(a.name)}</span><span class="account-pnl">${n>=0?"+":""}${money(n)}</span></div><div class="account-meta"><div><span>Bankroll</span><b>${money(current(a))}</b></div><div><span>Target</span><b>${a.target}%</b></div><div><span>Compound</span><b>${r.filter(x=>x.compound).length}</b></div></div><div style="margin-top:10px"><button class="small-btn" onclick="switchAccount('${a.id}')">Open</button> <button class="small-btn" onclick="editAccount('${a.id}')">Edit</button></div></div>`
 }).join("");
 $("combinedPnl").textContent=data.accounts.reduce((s,a)=>s+net(a),0)>=0?"+":"";$("combinedPnl").textContent+=(data.accounts.reduce((s,a)=>s+net(a),0)===0?"₹0.00":money(data.accounts.reduce((s,a)=>s+net(a),0)));
}
function renderHistory(){
 const aid=$("historyAccount").value||selectedAccount,type=$("historyType").value;
 const rs=data.records.filter(r=>(aid==="ALL"||r.accountId===aid)&&(type==="ALL"||r.type===type)).slice().reverse();
 $("historyList").innerHTML=rs.length?rs.map(r=>`<div class="history-item"><div><b>${r.type==="WIN"?"WIN":"STOP LOSS"}</b><small>${r.date} • ${r.time} • ${escape(data.accounts.find(a=>a.id===r.accountId)?.name||"")}</small></div><b class="${r.amount>=0?"plus":"minus"}">${r.amount>=0?"+":""}${money(r.amount)}</b></div>`).join(""):'<div class="card" style="padding:20px;text-align:center;color:#999;font-size:12px">No records yet.</div>';
}
function monthRecords(a,year,month){return accountRecords(a).filter(r=>{let d=new Date(r.date);return d.getFullYear()===year&&(month==null||d.getMonth()===month)})}
function renderReports(){
 const a=data.accounts.find(x=>x.id===$("reportAccount").value)||account(),now=new Date(),yr=now.getFullYear(),mr=monthRecords(a,yr,now.getMonth()),yrR=monthRecords(a,yr);
 $("monthPnl").textContent=money(mr.reduce((s,r)=>s+r.amount,0));$("yearPnl").textContent=money(yrR.reduce((s,r)=>s+r.amount,0));
 const dayMap={};yrR.forEach(r=>(dayMap[r.date]??=[]).push(r));
 $("targetDays").textContent=Object.values(dayMap).filter(x=>x.some(r=>r.targetHit)).length;
 $("stopDays").textContent=Object.values(dayMap).filter(x=>x.some(r=>r.stopHit)).length;
 $("tradingDays").textContent=Object.keys(dayMap).length;
 const wins=yrR.filter(r=>r.type==="WIN").length,loss=yrR.filter(r=>r.type==="LOSS").length;
 $("noTradeDays").textContent=Math.max(0,365-Object.keys(dayMap).length);$("winRate").textContent=(wins+loss?((wins/(wins+loss))*100).toFixed(1):"0")+"%";
 let months=[],best=null;
 for(let m=0;m<12;m++){let rr=monthRecords(a,yr,m),p=rr.reduce((s,r)=>s+r.amount,0),label=new Date(yr,m,1).toLocaleString("en-IN",{month:"short"});months.push({label,p});if(best===null||p>best.p)best={label,p}}
 $("bestMonth").textContent=best?`${best.label} ${money(best.p)}`:"—";
 $("monthlyRows").innerHTML=months.map(x=>`<div class="month-row"><span>${x.label}</span><b>${x.p>=0?"+":""}${money(x.p)}</b></div>`).join("");
}
function addResult(type){
 const a=account(),cur=current(a);if(!a||cur<=0)return;
 const amount=type==="WIN"?targetAmount(a):Math.min(a.stop||a.stake,cur);
 if(amount<=0)return;
 const before=cur,after=type==="WIN"?cur+amount:cur-amount;
 const rec={id:id(),accountId:a.id,date:today(),time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),type,amount:type==="WIN"?amount:-amount,balance:after,targetHit:type==="WIN",stopHit:type==="LOSS",compound:type==="WIN"};
 data.records.push(rec);if(after>a.peak)a.peak=after;save();renderAll();if(type==="WIN")beep();
}
function beep(){
 if(localStorage.getItem("moneyphiloSound")==="off")return;
 try{let C=AudioContext||webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=760;g.gain.setValueAtTime(.001,c.currentTime);g.gain.exponentialRampToValueAtTime(.13,c.currentTime+.01);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.25);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.26)}catch(e){}
}
function updateAccountInputs(){
 const a=account();a.start=Math.max(0,Number($("startInput").value)||0);a.target=Math.max(0,Number($("targetInput").value)||0);a.stop=Math.max(0,Number($("stopInput").value)||0);a.stake=Math.max(0,Number($("stakeInput").value)||0);if(!a.peak)a.peak=a.start;save();renderAll();
}
function createAccount(){
 let name=prompt("Account name","Account "+(data.accounts.length+1));if(name===null)return;
 let start=Number(prompt("Starting bankroll","1000"))||0,target=Number(prompt("Win target %","5"))||0,stop=Number(prompt("Stop loss amount","100"))||0,stake=Number(prompt("Stake","100"))||0;
 const a=newAccount(name,start,target,stop,stake);data.accounts.push(a);selectedAccount=a.id;save();renderAll();
}
function editAccount(id0){
 let a=data.accounts.find(x=>x.id===id0);if(!a)return;
 let name=prompt("Account name",a.name);if(name===null)return;
 a.name=name||a.name;save();renderAll();
}
function switchAccount(id0){selectedAccount=id0;save();renderAll();showPage("dashboard")}
function showPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===p));window.scrollTo(0,0)}
function escape(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function $(x){return document.getElementById(x)}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$("accountSelect").onchange=e=>{selectedAccount=e.target.value;renderAll()};
$("winBtn").onclick=()=>addResult("WIN");$("lossBtn").onclick=()=>addResult("LOSS");
["startInput","targetInput","stopInput","stakeInput"].forEach(k=>$(k).onchange=updateAccountInputs);
$("newAccountBtn").onclick=createAccount;$("addAccount2").onclick=createAccount;$("editAccountBtn").onclick=()=>editAccount(selectedAccount);
$("prevMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
$("historyAccount").onchange=renderHistory;$("historyType").onchange=renderHistory;$("reportAccount").onchange=renderReports;
$("exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="moneyphilo-backup.json";a.click();URL.revokeObjectURL(u)};
$("soundBtn").onclick=()=>{let off=localStorage.getItem("moneyphiloSound")==="off";localStorage.setItem("moneyphiloSound",off?"on":"off");$("soundBtn").textContent=off?"🔊":"🔇"};

function setTimerDisplay(){let m=Math.floor(timer.seconds/60),s=timer.seconds%60;$("timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function stopTimer(){clearInterval(timer.interval);timer.interval=null;timer.running=false}
function timeUp(){stopTimer();timer.seconds=0;setTimerDisplay();$("timerStatus").textContent="TIME UP";$("timerDisplay").classList.add("timeup");try{navigator.vibrate?.([500,200,500,200,700])}catch(e){};beep();beep();setTimeout(()=>$("timerDisplay").classList.remove("timeup"),3500)}
$("startTimer").onclick=()=>{if(timer.seconds<=0)timer.seconds=(Number($("minutesInput").value)||30)*60;if(timer.running)return;timer.running=true;$("timerStatus").textContent="Running";timer.interval=setInterval(()=>{timer.seconds--;setTimerDisplay();if(timer.seconds<=0)timeUp()},1000)};
$("pauseTimer").onclick=()=>{if(timer.running){stopTimer();$("timerStatus").textContent="Paused"}else if(timer.seconds>0){$("timerStatus").textContent="Ready"}};
$("resetTimer").onclick=()=>{stopTimer();timer.seconds=(Number($("minutesInput").value)||30)*60;setTimerDisplay();$("timerStatus").textContent="Ready"};
$("minutesInput").onchange=()=>{if(!timer.running){timer.seconds=Math.max(1,Number($("minutesInput").value)||30)*60;setTimerDisplay()}};

renderAll();setTimerDisplay();
