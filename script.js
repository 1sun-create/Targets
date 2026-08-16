const KEY="moneyphilo_casino_tracker_v1";
const quotes=[
"Discipline comes before profit. Protect the bankroll first.",
"Never chase a loss. A missed session is better than a forced session.",
"Your stop-loss is a boundary, not a suggestion.",
"Bankroll management matters more than one lucky result.",
"Walk away when the plan says walk away.",
"Consistency means following the process, not forcing an outcome.",
"One result does not define your strategy.",
"Protect capital today so you can make better decisions tomorrow."
];

let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 theme:"dark", current:0, accounts:[{
  name:"Account 1", starting:500, target:10, stop:15.5, balance:500, history:[]
 }]
};

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function account(){return state.accounts[state.current];}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function el(id){return document.getElementById(id);}
function render(){
 const a=account();
 document.body.classList.toggle("light",state.theme==="light");
 el("accountSelect").innerHTML=state.accounts.map((x,i)=>`<option value="${i}" ${i===state.current?"selected":""}>${escapeHtml(x.name)}</option>`).join("");
 el("bankroll").textContent=money(a.balance);
 const pnl=a.balance-a.starting;
 el("pnlText").textContent=`P/L ${pnl>=0?"+":""}${money(pnl)}`;
 el("pnlText").style.color=pnl>0?"#70df96":pnl<0?"#ff858c":"";
 const targetBalance=a.starting*(1+a.target/100);
 const stopBalance=a.starting*(1-a.stop/100);
 const targetProfit=targetBalance-a.starting;
 const stopLossAmount=a.starting-stopBalance;
 el("targetAmount").textContent=money(targetProfit);
 el("stopAmount").textContent=money(stopLossAmount);
 el("targetLevel").textContent=`Target balance ${money(targetBalance)}`;
 el("stopLevel").textContent=`Stop balance ${money(stopBalance)}`;
 el("startingInput").value=a.starting;
 el("targetInput").value=a.target;
 el("stopInput").value=a.stop;
 el("startLabel").textContent=money(a.starting);
 el("targetLabel").textContent=money(targetBalance);

 const wins=a.history.filter(x=>x.result==="WIN").length;
 const losses=a.history.filter(x=>x.result==="LOSS").length;
 const total=wins+losses;
 el("winRate").textContent=total?Math.round(wins/total*100)+"%":"0%";
 el("record").textContent=`${wins}W / ${losses}L`;
 el("sessionCount").textContent=`${total} session${total===1?"":"s"}`;

 let progress=((a.balance-a.starting)/(targetBalance-a.starting))*100;
 if(!isFinite(progress)) progress=0;
 progress=Math.max(0,Math.min(100,progress));
 el("progressPct").textContent=Math.round(progress)+"%";
 el("progressBar").style.width=progress+"%";

 let status="Ready", dot="#52d273", msg="Set your plan and record each completed session.";
 if(a.balance<=stopBalance && total){status="STOP LOSS";dot="#ff626c";msg="Stop-loss reached. Stop the session and protect the remaining bankroll."}
 else if(a.balance>=targetBalance && total){status="TARGET REACHED";dot="#70df96";msg="Target reached. Consider ending the session instead of chasing more."}
 else if(total){status="Tracking";msg=quotes[(total-1)%quotes.length]}
 el("statusText").textContent=status;
 el("statusDot").style.background=dot;el("statusDot").style.boxShadow=`0 0 10px ${dot}`;
 el("message").textContent=msg;
 el("quote").textContent=quotes[(new Date().getDate()+state.current)%quotes.length];

 const body=el("historyBody");
 body.innerHTML=a.history.length?a.history.slice().reverse().map((x,i)=>`
 <tr><td>${a.history.length-i}</td><td>${new Date(x.time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
 <td class="${x.result==="WIN"?"win":"loss"}">${x.result}</td><td>${x.result==="WIN"?"+":"-"}${money(x.amount)}</td><td>${money(x.balance)}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">No sessions recorded yet.</td></tr>`;
 save();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function modal(title,value,callback){
 el("modalTitle").textContent=title;el("modalInput").value=value||"";el("modal").classList.remove("hidden");
 el("modalInput").focus();
 el("modalConfirm").onclick=()=>{let v=el("modalInput").value.trim();if(v){callback(v);el("modal").classList.add("hidden")}};
 el("modalCancel").onclick=()=>el("modal").classList.add("hidden");
}
el("accountSelect").onchange=e=>{state.current=Number(e.target.value);render()};
el("addAccountBtn").onclick=()=>modal("New Account","",name=>{
 state.accounts.push({name,starting:500,target:10,stop:15.5,balance:500,history:[]});
 state.current=state.accounts.length-1;render();
});
el("renameAccountBtn").onclick=()=>modal("Rename Account",account().name,name=>{account().name=name;render()});
el("deleteAccountBtn").onclick=()=>{
 if(state.accounts.length===1){alert("At least one account must remain.");return}
 if(confirm(`Delete "${account().name}" and its history?`)){state.accounts.splice(state.current,1);state.current=Math.max(0,state.current-1);render()}
};
el("savePlanBtn").onclick=()=>{
 const a=account(),s=Number(el("startingInput").value),t=Number(el("targetInput").value),st=Number(el("stopInput").value);
 if(!(s>0)||t<0||st<0||t>100||st>100){alert("Enter valid plan values.");return}
 if(a.history.length===0)a.balance=s;
 a.starting=s;a.target=t;a.stop=st;render();
};
function record(result){
 const a=account(), amount=Number(el("sessionAmount").value);
 if(!(amount>0)){alert("Enter the session amount first.");return}
 if(a.balance<=0){alert("Bankroll is zero. Add a new bankroll in the plan.");return}
 const next=result==="WIN"?a.balance+amount:a.balance-amount;
 a.balance=Math.max(0,next);
 a.history.push({time:Date.now(),result,amount,balance:a.balance});
 el("sessionAmount").value="";
 render();
}
el("winBtn").onclick=()=>record("WIN");
el("lossBtn").onclick=()=>record("LOSS");
el("clearHistoryBtn").onclick=()=>{if(confirm("Clear this account's complete session history?")){account().history=[];account().balance=account().starting;render()}};
el("resetBtn").onclick=()=>{if(confirm("Reset this account's balance and history?")){account().history=[];account().balance=account().starting;render()}};
el("themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";render()};
render();