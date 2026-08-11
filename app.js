const $=id=>document.getElementById(id);
const quotes=[
"Your job is not to make money today. Your job is to follow your rules.",
"Stop loss is not a failure. Breaking your stop loss is.",
"Protect the bankroll first. Opportunity comes after survival.",
"One disciplined exit is worth more than ten emotional wins.",
"Never chase a loss. A new day is a new decision.",
"Target reached? Walk away. Discipline means knowing when enough is enough.",
"Small controlled losses keep you alive. Revenge trading can erase everything.",
"Plan the trade. Trade the plan. Then stop."
];
let state=JSON.parse(localStorage.getItem("td_state")||"null")||{start:10000,targetPct:5,stopPct:5,current:10000,pnl:0,history:[]};
let day=new Date().toISOString().slice(0,10);
function save(){localStorage.setItem("td_state",JSON.stringify(state))}
function money(n){return "₹"+Math.round(n).toLocaleString("en-IN")}
function render(){
 $("start").value=state.start;
 $("targetPct").value=state.targetPct;
 $("stopPct").value=state.stopPct;
 $("bankroll").textContent=money(state.current);
 $("target").textContent=money(state.start*state.targetPct/100);
 $("stop").textContent=money(state.start*state.stopPct/100);
 $("pnl").textContent=(state.pnl>=0?"+":"−")+money(Math.abs(state.pnl)).replace("₹","₹");
 const t=state.start*state.targetPct/100;
 $("progress").style.width=Math.min(100,Math.max(0,(state.pnl/t)*100))+"%";
 $("quote").textContent=quotes[new Date().getDate()%quotes.length];
 $("history").innerHTML=state.history.length?state.history.slice().reverse().map(x=>`<div class="entry"><span>${x.time} · ${x.type}</span><b class="${x.amount>=0?"positive":"negative"}">${x.amount>=0?"+":"−"}${money(Math.abs(x.amount))}</b></div>`).join(""):"<div class='muted' style='padding-top:12px'>No entries yet.</div>";
}
$("save").onclick=()=>{state.start=+($("start").value)||0;state.targetPct=+($("targetPct").value)||0;state.stopPct=+($("stopPct").value)||0;state.current=state.start;state.pnl=0;state.history=[];save();render()}
function add(type){
 const amount=state.start*((type==="WIN"?state.targetPct:state.stopPct)/100);
 const val=type==="WIN"?amount:-amount;
 state.current+=val;state.pnl+=val;
 state.history.push({type,amount:val,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});
 save();render();
 if(navigator.vibrate)navigator.vibrate(50);
}
$("win").onclick=()=>add("WIN"); $("loss").onclick=()=>add("LOSS");
$("reset").onclick=()=>{state.current=state.start;state.pnl=0;state.history=[];save();render()};
$("clear").onclick=()=>{state.history=[];save();render()};
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
render();