const KEY="moneyphilo_v5";const quotes=[
"Discipline is choosing between what you want now and what you want most.",
"Your bankroll is a resource to protect, not a number to chase.",
"Follow the plan. The result is secondary to the process.",
"Stop loss is not failure. Breaking your stop loss is.",
"Patience is a position too.",
"Good risk management keeps you in the game.",
"Never let one bad decision become a bad session.",
"Protect capital first. Opportunities come again.",
"An exit strategy is decided before emotions take over.",
"Consistency beats intensity.",
"Do not chase a loss. Record it, learn, and reset.",
"Your edge means nothing without discipline."
];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const today=()=>new Date().toLocaleDateString("en-CA");
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const signed=n=>(n>=0?"+":"−")+money(Math.abs(n));
let data=JSON.parse(localStorage.getItem(KEY)||"null");
if(!data)data={accounts:[{id:crypto.randomUUID(),name:"Account 1",start:1000,bankroll:1000,target:5,stop:15.5,events:[],plan:{days:10,pct:5,start:1000}}],active:null,quoteDay:"",quoteIndex:0};
if(!data.active)data.active=data.accounts[0].id;
let undo=null,monthCursor=new Date(),timer=null,timeLeft=1800,soundOn=true;

function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function acc(){return data.accounts.find(a=>a.id===data.active)||data.accounts[0]}
function events(){return acc().events||[]}
function eventFor(d){return events().find(e=>e.date===d)}
function setQuote(){let d=today();if(data.quoteDay!==d){data.quoteDay=d;data.quoteIndex=Math.floor(Math.random()*quotes.length);save()}$("#quote").textContent=quotes[data.quoteIndex]}
function play(kind="win"){if(!soundOn)return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.type=kind==="win"?"sine":"square";o.frequency.setValueAtTime(kind==="win"?720:180,c.currentTime);o.frequency.exponentialRampToValueAtTime(kind==="win"?1080:90,c.currentTime+.25);g.gain.setValueAtTime(.001,c.currentTime);g.gain.exponentialRampToValueAtTime(.8,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.55);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.6)}catch(e){}}
function vibrate(){if(navigator.vibrate)navigator.vibrate([300,120,300,120,500])}
function render(){
 const a=acc(), b=a.bankroll, wp=b*(1+a.target/100), lp=b*(1-a.stop/100), ev=events();
 $("#bankroll").textContent=money(b);$("#startBankroll").textContent=money(a.start);$("#netPnl").textContent=signed(b-a.start);
 $("#targetPct").textContent=a.target+"%";$("#stopPct").textContent=a.stop+"%";
 $("#winTarget").textContent=money(wp);$("#stopTarget").textContent=money(lp);
 $("#winFrom").textContent=money(b);$("#lossFrom").textContent=money(b);
 $("#winAmount").textContent="+"+money(wp-b);$("#lossAmount").textContent="−"+money(b-lp);
 const wins=ev.filter(e=>e.result==="win").length,losses=ev.filter(e=>e.result==="loss").length;
 $("#wins").textContent=wins;$("#losses").textContent=losses;$("#winRate").textContent=(wins+losses?Math.round(wins/(wins+losses)*100):0)+"%";$("#statPnl").textContent=signed(b-a.start);
 const e=eventFor(today());$("#todayStatus").textContent=e?e.result==="win"?"Target Hit":e.result==="loss"?"Stop Loss":"No Trade":"No Trade";$("#todayPnl").textContent=e?signed(e.pnl):"₹0";$("#todayTrades").textContent=e?1:0;$("#todayDuration").textContent=e?.duration||"00:00";
 $("#todayDate").textContent=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
 renderRecent();renderAccounts();renderHistory();renderReports();renderCalendar();renderCompound();setQuote();
}
function record(result){
 const a=acc(),b=a.bankroll, amount=result==="win"?b*a.target/100:b*a.stop/100, pnl=result==="win"?amount:-amount;
 undo=JSON.stringify(a);a.bankroll=b+pnl;
 const d=today();a.events=(a.events||[]).filter(e=>e.date!==d);a.events.push({id:crypto.randomUUID(),date:d,time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),result,pnl,bankroll:a.bankroll,duration:timer?formatTime(1800-timeLeft):"00:00"});
 save();play(result);if(result==="loss")vibrate();if(result==="win")vibrate();alert(result==="win"?"🎉 TARGET HIT!\nGreat discipline.":"🛑 STOP LOSS RECORDED\nSession stopped.");render();
}
function renderRecent(){const list=[...events()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);$("#recentHistory").innerHTML=list.length?list.map(e=>`<div class="history-item"><span>${e.date}</span><span class="badge ${e.result==="win"?"win":e.result==="loss"?"loss":"no"}">${e.result.toUpperCase()}</span><b>${signed(e.pnl)}</b></div>`).join(""):`<div style="text-align:center;color:#8492a1;padding:22px">No records yet</div>`}
function renderAccounts(){$("#accountSelect").innerHTML=data.accounts.map(a=>`<option value="${a.id}" ${a.id===data.active?"selected":""}>${a.name}</option>`).join("");$("#accountList").innerHTML=data.accounts.map(a=>`<div class="account-item"><div><h3>${a.name}</h3><p>Start ${money(a.start)} • P&L ${signed(a.bankroll-a.start)}</p></div><div class="money">${money(a.bankroll)}</div></div>`).join("");let totalStart=data.accounts.reduce((s,a)=>s+a.start,0),totalBank=data.accounts.reduce((s,a)=>s+a.bankroll,0);$("#combinedCard").innerHTML=`<b>COMBINED TOTAL</b><h2>${money(totalBank)}</h2><p>Starting ${money(totalStart)} • Net P&L <strong>${signed(totalBank-totalStart)}</strong></p>`}
function renderHistory(){let f=$("#historyAccountFilter");f.innerHTML=`<option value="all">All Accounts</option>`+data.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join("");let rows=[];data.accounts.forEach(a=>{if(f.value!=="all"&&f.value!==a.id)return;(a.events||[]).forEach(e=>rows.push({...e,account:a.name}))});rows.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));$("#historyList").innerHTML=rows.length?rows.map(e=>`<div class="history-item"><span><b>${e.account}</b><br>${e.date} ${e.time||""}</span><span class="badge ${e.result==="win"?"win":"loss"}">${e.result.toUpperCase()}</span><b>${signed(e.pnl)}</b></div>`).join(""):`<div class="report-card">No history yet.</div>`}
function statsFor(list){let w=list.filter(e=>e.result==="win"),l=list.filter(e=>e.result==="loss"),p=list.reduce((s,e)=>s+e.pnl,0);return{w:w.length,l:l.length,p,rate:w.length+l.length?Math.round(w.length/(w.length+l.length)*100):0}}
function renderReports(){let y=new Date().getFullYear();$("#reportYear").innerHTML=[y-1,y,y+1].map(n=>`<option>${n}</option>`).join("");let year=Number($("#reportYear").value||y), rows=[];for(let m=0;m<12;m++){let list=[];data.accounts.forEach(a=>(a.events||[]).forEach(e=>{let d=new Date(e.date);if(d.getFullYear()===year&&d.getMonth()===m)list.push(e)}));let s=statsFor(list);rows.push(`<div class="report-card"><h3>${new Date(year,m,1).toLocaleString("en",{month:"long"})}</h3><div class="report-grid"><div><small>NET P&L</small><b>${signed(s.p)}</b></div><div><small>WIN / LOSS DAYS</small><b>${s.w} / ${s.l}</b></div><div><small>WIN RATE</small><b>${s.rate}%</b></div><div><small>TRADING DAYS</small><b>${s.w+s.l}</b></div></div></div>`)}$("#reportContent").innerHTML=rows.join("")}
function renderCalendar(){let y=monthCursor.getFullYear(),m=monthCursor.getMonth();$("#monthTitle").textContent=new Date(y,m,1).toLocaleString("en",{month:"long",year:"numeric"});let first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),out=[];for(let i=0;i<first;i++)out.push(`<div class="day empty"></div>`);for(let d=1;d<=days;d++){let ds=new Date(y,m,d).toLocaleDateString("en-CA"),e=eventFor(ds);out.push(`<button class="day ${e?.result||""}" data-date="${ds}">${d}</button>`)}$("#calendar").innerHTML=out.join("");$$(".day[data-date]").forEach(b=>b.onclick=()=>showDay(b.dataset.date))}
function showDay(d){let e=eventFor(d);$("#dayDetail").innerHTML=`<b>${new Date(d+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</b><p>${e?`Result: <strong>${e.result.toUpperCase()}</strong><br>P&L: <strong>${signed(e.pnl)}</strong><br>Bankroll: ${money(e.bankroll)}<br>Time: ${e.time||"—"}`:"No trade recorded for this day."}</p>`}
function renderCompound(){let a=acc(),start=Number($("#compoundStart").value||a.start),pct=Number($("#compoundPct").value||a.target),days=Math.max(1,Number($("#compoundDays").value||10)),v=start;let rows=[];for(let i=1;i<=days;i++){let next=v*(1+pct/100);rows.push({i,from:v,to:next,profit:next-v});v=next}$("#finalTarget").textContent=money(v);$("#compoundProfit").textContent="+"+money(v-start);$("#compoundSteps").textContent=days;let done=Math.min((a.events||[]).filter(e=>e.result==="win").length,days),pc=Math.round(done/days*100);$("#progressText").textContent=`${done} / ${days} DAYS COMPLETED`;$("#progressPct").textContent=pc+"%";$("#progressBar").style.width=pc+"%";$("#planList").innerHTML=rows.map(r=>`<div class="plan-row"><span>Day ${r.i}</span><span>${money(r.from)}</span><b>${money(r.to)}</b></div>`).join("")}
function formatTime(s){let m=Math.floor(s/60),sec=s%60;return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")}
function setupTimer(){clearInterval(timer);timeLeft=Math.max(1,Number($("#timerMinutes").value||30))*60;$("#timerDisplay").textContent=formatTime(timeLeft);$("#timeUp").classList.remove("show")}
function startTimer(){if(timer)return;$("#timeUp").classList.remove("show");timer=setInterval(()=>{timeLeft--;$("#timerDisplay").textContent=formatTime(Math.max(0,timeLeft));if(timeLeft<=0){clearInterval(timer);timer=null;$("#timeUp").classList.add("show");play("up");vibrate();vibrate();}},1000)}
function switchView(name){$$(".view").forEach(v=>v.classList.remove("active"));$("#"+name+"View").classList.add("active");$$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===name));window.scrollTo(0,0)}
$$(".nav-btn").forEach(b=>b.onclick=()=>switchView(b.dataset.view));$$(".link-btn").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$("#accountSelect").onchange=e=>{data.active=e.target.value;save();render()};$("#addAccount").onclick=$("#addAccount2").onclick=()=>{let name=prompt("Account name?");if(!name)return;let start=Number(prompt("Starting bankroll?", "1000"));if(!start)return;let a={id:crypto.randomUUID(),name,start,bankroll:start,target:5,stop:15.5,events:[],plan:{days:10,pct:5,start}};data.accounts.push(a);data.active=a.id;save();render()};
$("#winBtn").onclick=()=>record("win");$("#lossBtn").onclick=()=>record("loss");$("#undoBtn").onclick=()=>{if(!undo)return alert("Nothing to undo.");let a=acc();Object.assign(a,JSON.parse(undo));undo=null;save();render();alert("Last action undone.")};
$("#newQuote").onclick=()=>{$("#quote").textContent=quotes[Math.floor(Math.random()*quotes.length)]};$("#calculateCompound").onclick=renderCompound;
["compoundStart","compoundPct","compoundDays"].forEach(id=>$("#"+id).oninput=renderCompound);$("#compoundStop").oninput=()=>{};
$("#prevMonth").onclick=()=>{monthCursor.setMonth(monthCursor.getMonth()-1);renderCalendar()};$("#nextMonth").onclick=()=>{monthCursor.setMonth(monthCursor.getMonth()+1);renderCalendar()};
$("#historyAccountFilter").onchange=renderHistory;$("#reportYear").onchange=renderReports;
$("#soundToggle").onclick=()=>{soundOn=!soundOn;$("#soundToggle").textContent=soundOn?"🔊":"🔇"};
$("#timerMinutes").onchange=setupTimer;$("#timerStart").onclick=startTimer;$("#timerPause").onclick=()=>{clearInterval(timer);timer=null};$("#timerReset").onclick=setupTimer;
$("#exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="moneyphilo-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
setInterval(()=>{if($("#homeView").classList.contains("active"))render()},30000);render();setupTimer();