"use strict";
(function(){
var KEY="parem_local_v2",tab="home",month=currentMonth(),catFilter="all",searchTerm="",rangePreset="2",rangeStart="",rangeEnd="";
var defaultCats=[["market","مارکێت","🛒"],["fuel","بەنزین","⛽"],["produce","سەوزە و میوە","🥬"],["food","خواردن","🍽️"],["bills","پسووڵە","🧾"],["other","هیتر","➕"]];
var db=load();
function blank(){return {version:2,created:isoToday(),opening:0,openingMonth:currentMonth(),salaries:{},expenses:[],incomes:[],savings:[],savingGoal:0,budgets:{},recurring:[],cats:defaultCats.map(function(c){return {id:c[0],name:c[1],emoji:c[2]};}),quick:defaultCats.map(function(c){return c[0];})};}
function load(){try {var d=JSON.parse(localStorage.getItem(KEY)||"null");if(d&&d.version===2){var b=blank();Object.keys(b).forEach(function(k){if(d[k]===undefined)d[k]=b[k];});return d;}}catch(e){}return blank();}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){alert("بیرگەی مۆبایل پڕ بوو. Backup بکە.");}}
function currentMonth(){var t=new Date();return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0");}
function isoToday(){var t=new Date();return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0");}
function monthLabel(m){var a=(m||currentMonth()).split("-");return (a[1]||"")+"-"+(a[0]||"");}
function dateLabel(v){var a=(v||isoToday()).split("-");return (a[2]||"")+"/"+(a[1]||"")+"/"+(a[0]||"");}
function monthOf(v){return (v||"").slice(0,7);}
function num(s){var a="٠١٢٣٤٥٦٧٨٩",b="۰۱۲۳۴۵۶۷۸۹";s=String(s==null?"":s);s=s.replace(/[٠-٩]/g,function(x){return a.indexOf(x);}).replace(/[۰-۹]/g,function(x){return b.indexOf(x);});return Number(s.replace(/[،,.\s]/g,"").replace(/[^0-9-]/g,""))||0;}
function fmt(n){var v=Math.round(Number(n)||0);return (v<0?"−":"")+String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g,"،");}
function amt(n){return fmt(n)+" دینار";}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function id(){return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,9);}
function cat(id){return db.cats.find(function(c){return c.id===id;})||{id:"other",name:"هیتر",emoji:"➕"};}
function listMonth(arr,m){return arr.filter(function(x){return monthOf(x.date)===m;});}
function sum(arr){return arr.reduce(function(v,x){return v+Number(x.amount||0);},0);}
function moneyInput(name,value){return '<input inputmode="numeric" data-money="1" name="'+name+'" placeholder="بۆ نموونە: 25،000" value="'+esc(value==null||Number(value)===0?"":fmt(value))+'" required autocomplete="off" />';}
function field(name,label,html){return '<div class="formRow"><label>'+label+'</label>'+html+'</div>';}
function dateInput(value){return '<input type="date" name="date" value="'+esc(value||isoToday())+'" required />';}
function catOptions(selected){return db.cats.map(function(c){return '<option value="'+esc(c.id)+'" '+(selected===c.id?"selected":"")+">"+esc(c.emoji+" "+c.name)+"</option>";}).join("");}
function catSelect(name,selected){return '<select name="'+name+'">'+catOptions(selected)+'</select>';}
function dayName(){return "ئەمڕۆ "+dateLabel(isoToday());}
function labelDate(v){return esc(dateLabel(v));}
function balanceAt(m){var start=db.openingMonth||"0000-00",bal=Number(db.opening||0);
 Object.keys(db.salaries).forEach(function(k){if(k>=start&&k<=m)bal+=Number(db.salaries[k]||0);});
 db.incomes.forEach(function(x){if(monthOf(x.date)>=start&&monthOf(x.date)<=m)bal+=Number(x.amount||0);});
 db.expenses.forEach(function(x){if(monthOf(x.date)>=start&&monthOf(x.date)<=m)bal-=Number(x.amount||0);});
 db.savings.forEach(function(x){if(monthOf(x.date)>=start&&monthOf(x.date)<=m)bal+=(x.type==="withdraw"?1:-1)*Number(x.amount||0);});
 return bal;
}
function savedAt(m){return db.savings.reduce(function(v,x){return monthOf(x.date)<=m?v+(x.type==="withdraw"?-1:1)*Number(x.amount||0):v;},0);}
function monthlyIncome(m){return Number(db.salaries[m]||0)+sum(listMonth(db.incomes,m));}
function monthlyExpense(m){return sum(listMonth(db.expenses,m));}
function prevMonth(m){var a=m.split("-");var d=new Date(Number(a[0]),Number(a[1])-2,1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");}
function byCategory(m){var x={};listMonth(db.expenses,m).forEach(function(e){x[e.category]=(x[e.category]||0)+Number(e.amount||0);});return Object.entries(x).sort(function(a,b){return b[1]-a[1];});}
function notify(msg){var el=document.getElementById("toast");el.textContent=msg;el.hidden=false;clearTimeout(window._pt);window._pt=setTimeout(function(){el.hidden=true;},3000);}
function updateMonth(){document.getElementById("headerMonth").textContent=monthLabel(month);}
function topText(k,t){return '<div class="kicker">'+k+'</div><h1>'+t+'</h1>';}
function card(title,inner){return '<div class="card"><h3>'+title+'</h3>'+inner+'</div>';}
function btn(text,action,style){return '<button class="'+(style||"secondary")+'" data-action="'+action+'">'+text+'</button>';}
function setTab(v){tab=v;render();window.scrollTo(0,0);}
function render(){updateMonth();document.querySelectorAll(".nav button").forEach(function(b){b.classList.toggle("selected",b.dataset.tab===tab);});var s="";
 if(tab==="home")s=home();else if(tab==="expenses")s=expenses();else if(tab==="plan")s=plan();else if(tab==="report")s=report();else s=settings();
 document.getElementById("app").innerHTML=s;
}
function chooseMonth(){return '<div class="formRow"><label>مانگی هەڵبژێردراو</label><input id="monthPick" type="month" value="'+esc(month)+'"/></div>';}
function home(){var spent=monthlyExpense(month),inc=monthlyIncome(month),saved=savedAt(month),most=byCategory(month)[0];
 var last=listMonth(db.expenses,month).sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,4);
 var out=topText("بەخێربێیتەوە","پارەکەت بە ئاسانی بەڕێوە ببە");
 out+='<section class="card hero"><div class="muted">پارەی بەردەست تا '+monthLabel(month)+'</div><div class="big">'+amt(balanceAt(month))+'</div><div class="muted">پاشەکەوتی جیاکراوە: '+amt(saved)+'</div></section>';
 out+='<div class="split"><div class="card mini"><div class="muted">کۆی داهاتی مانگ</div><div class="money ok">'+fmt(inc)+'</div><div class="muted">دینار</div></div><div class="card mini"><div class="muted">کۆی خەرجی مانگ</div><div class="money warn">'+fmt(spent)+'</div><div class="muted">دینار</div></div></div>';
 out+='<div class="actions">'+btn("＋ خەرجییەکی نوێ","expense","primary")+btn("موچەی مانگ","salary")+'</div>';
 out+='<section class="card"><div class="flex"><h3>⚡ خەرجییەک زیاد بکە</h3><button class="smallBtn" data-action="quicksettings">ڕێکخستن</button></div><div class="muted small">بەشێک هەڵبژێرە. بۆ گۆڕینی شوێن، لە ڕێکخستن تیرەکان بەکاربهێنە.</div><div class="quick">';
 db.quick.slice(0,6).forEach(function(i){var c=cat(i);out+='<button data-category="'+esc(c.id)+'"><span class="emoji">'+esc(c.emoji)+'</span>'+esc(c.name)+'</button>';});
 out+='</div></section>';
 out+='<section class="card"><div class="flex"><h3>زۆرترین خەرجی</h3><button data-tab="report" class="smallBtn">ڕاپۆرت</button></div>'+(most?'<div class="flex"><b>'+esc(cat(most[0]).emoji+" "+cat(most[0]).name)+'</b><strong class="warn">'+amt(most[1])+'</strong></div>':'<div class="blank">هێشتا خەرجی تۆمار نەکراوە</div>')+'</section>';
 out+='<section class="card"><div class="flex"><h3>دوایین خەرجییەکان</h3><button data-tab="expenses" class="smallBtn">هەمووی ببینە</button></div>'+rows(last)+'</section>';
 return out;
}
function rows(arr){if(!arr.length)return '<div class="blank">هیچ خەرجییەک نییە</div>';return arr.map(function(x){var c=cat(x.category);return '<div class="rowItem"><span class="rowIcon">'+esc(c.emoji)+'</span><div class="rowBody"><b>'+esc(c.name)+'</b><div class="muted">'+labelDate(x.date)+'</div>'+(x.note?'<div class="inlineNote">'+esc(x.note)+'</div>':'')+'</div><div><div class="rowAmt warn">−'+fmt(x.amount)+'</div><button class="rowAction" data-edit="'+esc(x.id)+'">دەستکاری</button></div></div>';}).join("");}
function filteredExpenses(){return listMonth(db.expenses,month).filter(function(x){var c=cat(x.category);var s=(c.name+" "+(x.note||"")+" "+x.date+" "+dateLabel(x.date)+" "+fmt(x.amount)).toLowerCase();return (catFilter==="all"||catFilter===x.category)&&s.indexOf(searchTerm.toLowerCase())>=0;}).sort(function(a,b){return b.date.localeCompare(a.date);});}
function expenseRows(){return rows(filteredExpenses());}
function expenses(){var out=topText("هەموو تۆمارەکان","خەرجییەکان")+chooseMonth();out+='<div class="card"><div class="muted">کۆی خەرجی ئەم مانگە</div><div class="big">'+amt(monthlyExpense(month))+'</div></div>';
 out+='<div class="actions">'+btn("＋ زیادکردنی خەرجی","expense","primary")+'</div>';
 out+='<div class="card">'+field("q","گەڕان بە ناو، تێبینی یان بڕی پارە",'<input type="search" id="searchInput" class="search" placeholder="گەڕان..." value="'+esc(searchTerm)+'"/>')+field("c","فلتەری بەش",'<select id="catFilter"><option value="all">هەموو بەشەکان</option>'+catOptions(catFilter)+'</select>')+'<div id="expenseList">'+expenseRows()+'</div></div>';return out;
}
function plan(){var others=listMonth(db.incomes,month),goals=Number(db.savingGoal||0),save=savedAt(month);
 var out=topText("داڕشتنی پلانی دارایی","پلاندانان")+chooseMonth();
 out+='<div class="card"><div class="flex"><h3>💼 موچەی مانگ</h3>'+btn("گۆڕین","salary")+'</div><div class="money">'+amt(db.salaries[month]||0)+'</div></div>';
 out+='<div class="card"><div class="flex"><h3>💰 داهاتی زیادە</h3>'+btn("＋ زیادکردن","income","primary")+'</div>'+(others.length?others.map(function(x){return '<div class="rowItem"><div class="rowBody"><b>'+esc(x.source||"داهاتی زیادە")+'</b><div class="muted">'+labelDate(x.date)+'</div></div><div class="rowAmt ok">+'+fmt(x.amount)+'</div><button class="rowAction" data-delete-income="'+esc(x.id)+'">سڕینەوە</button></div>';}).join(""):'<div class="blank">داهاتی زیادە نییە</div>')+'</div>';
 out+='<div class="card"><div class="flex"><h3>🏦 پاشەکەوت</h3>'+btn("＋ جووڵە","saving","primary")+'</div><div class="money">'+amt(save)+'</div><div class="muted">ئامانجی پاشەکەوت: '+amt(goals)+'</div><div class="barGraph"><div style="width:'+ (goals>0?Math.min(100,Math.max(0,save/goals*100)):0)+'%"></div></div><div class="actions">'+btn("دیاریکردنی ئامانج","goal")+'</div></div>';
 out+='<div class="card"><div class="flex"><h3>🎯 سنووری خەرجی</h3>'+btn("＋ سنوور","budget","primary")+'</div>';var has=false;
 db.cats.forEach(function(c){var limit=Number(db.budgets[month+"|"+c.id]||0);if(limit>0){has=true;var used=byCategory(month).filter(function(x){return x[0]===c.id;}).reduce(function(v,x){return v+x[1];},0);var p=Math.round(used/limit*100);out+='<div class="line"><div class="flex"><b>'+esc(c.emoji+" "+c.name)+'</b><span class="'+(p>=100?"warn":p>=80?"priority":"muted")+'">'+p+'%</span></div><div class="muted">'+amt(used)+' / '+amt(limit)+'</div><div class="barGraph"><div style="width:'+Math.min(100,p)+'%;background:'+(p>=100?"#ff8e8e":"#85afff")+'"></div></div>'+(p>=100?'<small class="warn">⚠ سنوورەکەت تێپەڕاندووە</small>':p>=80?'<small class="priority">⚠ نزیک بوویتەوە لە سنوور</small>':'')+'</div>';}});if(!has)out+='<div class="blank">هێشتا سنووری خەرجیت دانەناوە</div>';out+='</div>';
 out+='<div class="card"><div class="flex"><h3>🔄 خەرجییە دووبارەبووەوەکان</h3>'+btn("＋ زیادکردن","recurring","primary")+'</div>';
 if(db.recurring.length){db.recurring.forEach(function(x){out+='<div class="rowItem"><div class="rowBody"><b>'+esc(cat(x.category).emoji+" "+cat(x.category).name)+'</b><div class="muted">'+amt(x.amount)+' • ڕۆژی '+x.day+'ی مانگ</div></div><button class="rowAction" data-toggle-recurring="'+esc(x.id)+'">'+(x.active?"چالاک":"ناچالاک")+'</button><button class="rowAction" data-delete-recurring="'+esc(x.id)+'">سڕینەوە</button></div>';});}else out+='<div class="blank">خەرجییە دووبارەبووەوەکان نییە</div>';out+='</div>';return out;
}
function pastMonths(m,n){var a=[],p=m;for(var i=0;i<n;i++){a.unshift(p);p=prevMonth(p);}return a;}

// Format the amount as the user types, while preserving the caret position.
function onlyDigits(v){return String(v||"").replace(/[٠-٩]/g,function(c){return "٠١٢٣٤٥٦٧٨٩".indexOf(c);}).replace(/[۰-۹]/g,function(c){return "۰۱۲۳۴۵۶۷۸۹".indexOf(c);}).replace(/[^0-9]/g,"");}
function liveAmountFormat(el){
 var original=el.value, oldCaret=el.selectionStart==null?original.length:el.selectionStart;
 var left=onlyDigits(original.slice(0,oldCaret)).length, raw=onlyDigits(original);
 raw=raw.replace(/^0+(?=\d)/,"");
 var formatted=raw.replace(/\B(?=(\d{3})+(?!\d))/g,"،");
 if(formatted===original)return;
 el.value=formatted;
 var offset=0,count=0;
 if(left===0)offset=0;
 else{for(var i=0;i<formatted.length;i++){if(/[0-9]/.test(formatted[i]))count++;offset=i+1;if(count>=left)break;}}
 try{el.setSelectionRange(offset,offset);}catch(e){}
}
function endOfMonth(m){var a=m.split("-");return m+"-"+String(new Date(Number(a[0]),Number(a[1]),0).getDate()).padStart(2,"0");}
function syncRangeFromPreset(){if(rangePreset==="custom")return;var n=Math.max(1,Number(rangePreset)||2),start=month;for(var i=1;i<n;i++)start=prevMonth(start);rangeStart=start+"-01";rangeEnd=endOfMonth(month);}
function rangeSummary(){
 if(!rangeStart||!rangeEnd)syncRangeFromPreset();
 var html='<div class="card"><h3>📅 ڕاپۆرتی خەرجی بۆ ماوەی دیاریکراو</h3><div class="muted">کۆی خەرجیی چەند مانگ یان هەر دوو بەروارێک</div>';
 html+='<div class="formRow"><label>ماوە</label><select id="rangePreset"><option value="2"'+(rangePreset==="2"?' selected':'')+'>٢ مانگ</option><option value="3"'+(rangePreset==="3"?' selected':'')+'>٣ مانگ</option><option value="6"'+(rangePreset==="6"?' selected':'')+'>٦ مانگ</option><option value="12"'+(rangePreset==="12"?' selected':'')+'>١٢ مانگ</option><option value="custom"'+(rangePreset==="custom"?' selected':'')+'>ماوەی دلخواز</option></select></div>';
 html+='<div class="split"><div class="formRow"><label>لە بەروار</label><input type="date" id="rangeStart" value="'+esc(rangeStart)+'"></div><div class="formRow"><label>تا بەروار</label><input type="date" id="rangeEnd" value="'+esc(rangeEnd)+'"></div></div>';
 if(!rangeStart||!rangeEnd||rangeStart>rangeEnd)return html+'<div class="hint">بەرواری دەستپێک دەبێت پێش بەرواری کۆتایی بێت.</div></div>';
 var xs=db.expenses.filter(function(x){return x.date>=rangeStart&&x.date<=rangeEnd;});
 var total=sum(xs);
 html+='<div class="muted">کۆی خەرجی لە '+esc(dateLabel(rangeStart))+' تا '+esc(dateLabel(rangeEnd))+'</div><div class="big">'+amt(total)+'</div><div class="muted">'+xs.length+' تۆماری خەرجی</div>';
 html+='<div class="divider"></div><h3>دابەشبوونی خەرجی بە مانگ</h3>';
 var k=monthOf(rangeStart),last=monthOf(rangeEnd),shown=0,months=[];
 while(k<=last&&shown++<240){months.push(k);var a=k.split("-"),d=new Date(Number(a[0]),Number(a[1]),1);k=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");}
 var max=Math.max(1,...months.map(function(m){return sum(xs.filter(function(x){return monthOf(x.date)===m;}));}));
 months.forEach(function(m){var v=sum(xs.filter(function(x){return monthOf(x.date)===m;}));html+='<div class="line"><div class="flex"><b>'+esc(monthLabel(m))+'</b><span class="muted">'+amt(v)+'</span></div><div class="barGraph"><div style="width:'+(100*v/max)+'%"></div></div></div>';});
 if(!xs.length)html+='<div class="blank">لەو ماوەیەدا خەرجییەک تۆمار نەکراوە.</div>';
 else{
   var by={};xs.forEach(function(x){by[x.category]=(by[x.category]||0)+Number(x.amount||0);});
   var sorted=Object.entries(by).sort(function(a,b){return b[1]-a[1];});
   html+='<div class="divider"></div><h3>زۆرترین خەرجی لەم ماوەیەدا</h3>';
   sorted.forEach(function(x,i){var c=cat(x[0]);html+='<div class="line"><div class="flex"><b>'+(i===0?'🏅 ':'')+esc(c.emoji+" "+c.name)+'</b><span>'+amt(x[1])+'</span></div><div class="barGraph"><div style="width:'+(total?100*x[1]/total:0)+'%"></div></div></div>';});
 }
 return html+'</div>';
}
function report(){var out=topText("پوختە و بەراورد","ڕاپۆرتی دارایی")+chooseMonth(),inc=monthlyIncome(month),spent=monthlyExpense(month),net=inc-spent;
 out+=rangeSummary();
 out+='<div class="split"><div class="card mini"><div class="muted">داهات</div><div class="money ok">'+fmt(inc)+'</div><div class="muted">دینار</div></div><div class="card mini"><div class="muted">خەرجی</div><div class="money warn">'+fmt(spent)+'</div><div class="muted">دینار</div></div></div>';
 out+='<div class="card"><div class="flex"><b>جیاوازی داهات و خەرجی</b><strong class="'+(net>=0?"ok":"warn")+'">'+amt(net)+'</strong></div><div class="hint">ئەمە پاشەکەوتی ڕاستەقینە نییە؛ بڕی پاشەکەوتی جیاکراوە لە پلانداناندا دیارە.</div></div>';
 out+='<div class="card"><h3>زۆرترین پارەت بۆ چی خەرج کردووە؟</h3>';var cats=byCategory(month);if(!cats.length)out+='<div class="blank">هێشتا خەرجییەک نییە</div>';cats.forEach(function(x,i){var c=cat(x[0]);out+='<div class="line"><div class="flex"><b>'+(i===0?"🏅 ":"")+esc(c.emoji+" "+c.name)+'</b><b>'+amt(x[1])+'</b></div><div class="barGraph"><div style="width:'+Math.min(100,spent?x[1]/spent*100:0)+'%"></div></div></div>';});out+='</div>';
 out+='<div class="card"><h3>بەراوردی شەش مانگ</h3>';var ms=pastMonths(month,6),max=Math.max(1,...ms.map(monthlyExpense));ms.forEach(function(m){var n=monthlyExpense(m);out+='<div class="line"><div class="flex"><b>'+monthLabel(m)+'</b><span class="muted">'+amt(n)+'</span></div><div class="barGraph"><div style="width:'+(n/max*100)+'%"></div></div></div>';});out+='</div>';
 out+='<div class="card"><div class="muted">پارەی بەردەست تا کۆتایی مانگی دیاریکراو</div><div class="big">'+amt(balanceAt(month))+'</div></div>';return out;
}
function settings(){var out=topText("هەموو شتێک لە ژێر دەستتدا","ڕێکخستن");
 out+='<div class="card"><h3>💵 پارەی سەرەتا</h3><div class="muted">ئەو پارەیەی پێش دەستپێکردنی تۆمارەکانت هەتبوو.</div><div class="money">'+amt(db.opening)+'</div><div class="muted">دەستپێک: '+monthLabel(db.openingMonth)+'</div><div class="actions">'+btn("گۆڕینی پارەی سەرەتا","opening")+'</div></div>';
 out+='<div class="card"><div class="flex"><h3>📁 بەشەکانی خەرجی</h3>'+btn("＋ بەشی نوێ","category","primary")+'</div>';db.cats.forEach(function(c){out+='<div class="rowItem"><span class="rowIcon">'+esc(c.emoji)+'</span><div class="rowBody"><b>'+esc(c.name)+'</b></div><button class="rowAction" data-editcat="'+esc(c.id)+'">دەستکاری</button>'+(defaultCats.some(function(a){return a[0]===c.id;})?'':'<button class="rowAction" data-deletecat="'+esc(c.id)+'">سڕینەوە</button>')+'</div>';});out+='</div>';
 out+='<div class="card"><h3>⚡ ڕێکخستنی بەشە خێراکان</h3><div class="muted">بە تیرەکان شوێنی بەشەکان بگۆڕە. شەش دانەی یەکەم لە سەرەکی دەردەکەون.</div>';db.quick.forEach(function(cid,i){var c=cat(cid);out+='<div class="rowItem"><span class="rowIcon">'+esc(c.emoji)+'</span><div class="rowBody"><b>'+esc(c.name)+'</b></div><button class="rowAction" data-quick-up="'+i+'">↑</button><button class="rowAction" data-quick-down="'+i+'">↓</button></div>';});out+='</div>';
 out+='<div class="card"><h3>💾 پاراستنی داتا</h3><p class="muted">داتاکان لە بیرگەی ئەم ئەپە لەسەر مۆبایلەکەت هەڵدەگیرێن. پێش گۆڕینی مۆبایل Backup دروست بکە.</p><div class="actions">'+btn("هەناردەکردنی Backup","backup","primary")+btn("گەڕاندنەوەی Backup","restore")+'</div><div class="hint">Restore تۆمارە نوێکان تێکەڵ دەکات و تۆمارە دووبارەکان دووبارە زیاد ناکات. بەڵام ئەگەر بڕی موچە یان سنووری خەرجی هەردوو لە پاشەکەوت و فایلەکەدا هەبێت، بڕی ئێستات دەمێنێتەوە.</div></div>';
 out+='<div class="card"><h3>🌐 وێبسایتی پێشوو</h3><p class="muted">ئەم ئەپی APK ـە ئۆفلاینە و داتاکانی لە وێبسایتەکە جیاوازن. بۆ بینینی تۆمارە کۆنەکانت وێبسایتەکە بکەرەوە.</p><div class="actions">'+btn("کردنەوەی وێبسایتی پارەم","website")+'</div></div>';
 return out;}
function popup(title,html,handler){document.getElementById("dialogTitle").textContent=title;document.getElementById("dialogBody").innerHTML='<form id="form">'+html+'<button class="primary full" type="submit">✓ پاشەکەوتکردن</button></form>';document.getElementById("dialog").hidden=false;document.getElementById("form").onsubmit=function(e){e.preventDefault();try{if(handler(new FormData(e.currentTarget))!==false){persist();closePopup();render();notify("بە سەرکەوتوویی پاشەکەوت کرا ✅");}}catch(ex){alert(ex.message||"هەڵەیەک ڕوویدا");}};}
function closePopup(){document.getElementById("dialog").hidden=true;}
function formExpense(catId,existing){var x=existing||{date:isoToday(),category:catId||"market",amount:"",note:""};
 popup(existing?"دەستکاری خەرجی":"زیادکردنی خەرجی",field("amount","بڕی خەرجی بە دینار",moneyInput("amount",x.amount))+field("category","جۆری خەرجی",catSelect("category",x.category))+field("date","بەروار",dateInput(x.date))+field("note","تێبینی (ئارەزوومەندانە)",'<textarea name="note" placeholder="بۆ چی خەرجت کردووە؟">'+esc(x.note)+'</textarea>')+(existing?'<button type="button" class="dangerBtn full" id="deleteExpense">سڕینەوەی خەرجی</button>':''),function(f){var n=num(f.get("amount"));if(n<=0)throw Error("بڕی خەرجی پێویستە لە سفر زیاتر بێت");var e={id:existing?existing.id:id(),amount:n,category:String(f.get("category")),date:String(f.get("date")),note:String(f.get("note")||"")};if(existing){db.expenses=db.expenses.map(function(x){return x.id===existing.id?e:x;});}else db.expenses.push(e);});
 if(existing)document.getElementById("deleteExpense").onclick=function(){if(confirm("ئەم خەرجییە بسڕدرێتەوە؟")){db.expenses=db.expenses.filter(function(e){return e.id!==existing.id;});persist();closePopup();render();}};
}
function editSalary(){popup("موچەی مانگ",field("amount","موچە بە دینار",moneyInput("amount",db.salaries[month]||0))+field("month","مانگی موچە",'<input type="month" name="month" value="'+month+'"/>'),function(f){var n=num(f.get("amount"));if(n<0)throw Error("بڕێکی دروست بنووسە");db.salaries[String(f.get("month"))]=n;});}
function addIncome(){popup("داهاتی زیادە",field("amount","بڕ بە دینار",moneyInput("amount",""))+field("source","سەرچاوەی داهات",'<input name="source" placeholder="کاری زیادە، دیاری..." required />')+field("date","بەروار",dateInput()),function(f){var n=num(f.get("amount"));if(n<=0)throw Error("بڕەکە دروست نییە");db.incomes.push({id:id(),amount:n,source:String(f.get("source")),date:String(f.get("date"))});});}
function saving(){popup("جووڵەی پاشەکەوت",field("type","جۆر",'<select name="type"><option value="deposit">خستنە ناو پاشەکەوت</option><option value="withdraw">دەرهێنان لە پاشەکەوت</option></select>')+field("amount","بڕ بە دینار",moneyInput("amount",""))+field("date","بەروار",dateInput()),function(f){var n=num(f.get("amount")),type=String(f.get("type"));if(n<=0)throw Error("بڕەکە دروست نییە");if(type==="withdraw"&&n>savedAt(String(f.get("date")).slice(0,7)))throw Error("ئەم بڕە لە پاشەکەوتەکەت زیاترە");db.savings.push({id:id(),type:type,amount:n,date:String(f.get("date"))});});}
function goal(){popup("ئامانجی پاشەکەوت",field("amount","بڕی ئامانج بە دینار",moneyInput("amount",db.savingGoal)),function(f){db.savingGoal=Math.max(0,num(f.get("amount")));});}
function budget(){popup("سنووری خەرجی",field("category","بەش",catSelect("category",db.cats[0].id))+field("amount","سنووری ئەم مانگە بە دینار",moneyInput("amount",""))+field("month","مانگ",'<input type="month" name="month" value="'+month+'"/>'),function(f){db.budgets[String(f.get("month"))+"|"+String(f.get("category"))]=Math.max(0,num(f.get("amount")));});}
function recurring(){popup("خەرجیی مانگانە",field("category","بەش",catSelect("category",db.cats[0].id))+field("amount","بڕ بە دینار",moneyInput("amount",""))+field("day","ڕۆژی مانگ",'<input type="number" name="day" min="1" max="31" value="1" required />'),function(f){var n=num(f.get("amount")),day=Number(f.get("day"));if(n<=0||day<1||day>31)throw Error("بڕ یان ڕۆژ هەڵەیە");db.recurring.push({id:id(),category:String(f.get("category")),amount:n,day:day,start:month,active:true});applyRecurring();});}
function opening(){popup("پارەی سەرەتا",field("amount","بڕی پارەی سەرەتا",moneyInput("amount",db.opening))+field("month","مانگی دەستپێک",'<input type="month" name="month" value="'+esc(db.openingMonth)+'"/>'),function(f){db.opening=num(f.get("amount"));db.openingMonth=String(f.get("month"));});}
function category(existing){var x=existing||{name:"",emoji:"📦"};popup(existing?"دەستکاری بەش":"بەشی نوێ",field("name","ناوی بەش",'<input name="name" value="'+esc(x.name)+'" required maxlength="55" />')+field("emoji","نیشانە",'<input name="emoji" value="'+esc(x.emoji)+'" maxlength="6"/>'),function(f){var n=String(f.get("name")).trim(),em=String(f.get("emoji")).trim()||"📦";if(!n)throw Error("ناوی بەش بنووسە");if(existing){existing.name=n;existing.emoji=em;}else{var i=id();db.cats.push({id:i,name:n,emoji:em});db.quick.push(i);}});}
function applyRecurring(){var now=isoToday(),nowMonth=monthOf(now),day=Number(now.slice(8)),changed=false;db.recurring.forEach(function(r){if(!r.active||r.start>nowMonth)return;var target=Math.min(r.day,new Date(Number(now.slice(0,4)),Number(now.slice(5,7)),0).getDate());if(day<target)return;var key=r.id+"-"+nowMonth;if(db.expenses.some(function(e){return e.recurringKey===key;}))return;db.expenses.push({id:id(),amount:r.amount,category:r.category,date:nowMonth+"-"+String(target).padStart(2,"0"),note:"خەرجیی مانگانە",recurringKey:key});changed=true;});if(changed)persist();}
function swapQuick(i,j){if(i<0||j<0||i>=db.quick.length||j>=db.quick.length)return;var t=db.quick[i];db.quick[i]=db.quick[j];db.quick[j]=t;persist();render();}
function mergeBackup(str){var x=JSON.parse(str);if(x.version!==2||!Array.isArray(x.expenses)||!Array.isArray(x.cats))throw Error("فایلی Backup ی پارەم 2 نییە");var kept=0;
 ["expenses","incomes","savings","recurring","cats"].forEach(function(k){if(!Array.isArray(x[k]))return;var existing=new Set(db[k].map(function(a){return a.id;}));x[k].forEach(function(a){if(a&&typeof a.id==="string"&&!existing.has(a.id)){db[k].push(a);kept++;existing.add(a.id);}});});
 ["salaries","budgets"].forEach(function(k){if(!x[k]||typeof x[k]!=="object")return;Object.keys(x[k]).forEach(function(key){if(db[k][key]===undefined)db[k][key]=x[k][key];});});
 if(db.opening===0&&x.opening){db.opening=Number(x.opening);db.openingMonth=x.openingMonth||db.openingMonth;}
 if(!db.savingGoal&&x.savingGoal)db.savingGoal=Number(x.savingGoal);
 db.quick=db.quick.filter(function(k){return db.cats.some(function(c){return c.id===k;});});db.cats.forEach(function(c){if(db.quick.indexOf(c.id)<0)db.quick.push(c.id);});persist();render();notify("Backup گەڕێندرایەوە: "+kept+" تۆماری نوێ");}
window.receiveBackup=function(raw){try{mergeBackup(raw);}catch(e){alert("هەڵەی Restore: "+e.message);}};
window.paremBack=function(){if(!document.getElementById("dialog").hidden){closePopup();return;}if(tab!=="home"){setTab("home");return;}notify("ئەپی پارەم");};
function backUp(){var data=JSON.stringify(db,null,2);if(window.ParemAndroid&&ParemAndroid.saveBackup){ParemAndroid.saveBackup(data);}else{var blob=new Blob([data],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Parem-Backup.json";a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},5000);}}
function restore(){if(window.ParemAndroid&&ParemAndroid.openBackup){ParemAndroid.openBackup();}else{var input=document.createElement("input");input.type="file";input.accept=".json,application/json";input.onchange=function(){var r=new FileReader();r.onload=function(){window.receiveBackup(String(r.result));};r.readAsText(input.files[0]);};input.click();}}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t)return;
 if(t.dataset.tab){setTab(t.dataset.tab);return;}
 if(t.dataset.category){formExpense(t.dataset.category);return;}
 if(t.dataset.edit){formExpense(null,db.expenses.find(function(x){return x.id===t.dataset.edit;}));return;}
 if(t.dataset.editcat){category(db.cats.find(function(x){return x.id===t.dataset.editcat;}));return;}
 if(t.dataset.deletecat){if(!confirm("ئەم بەشە بسڕدرێتەوە؟ خەرجییە کۆنەکان دەچنە «هیتر»."))return;db.expenses.forEach(function(x){if(x.category===t.dataset.deletecat)x.category="other";});db.recurring.forEach(function(x){if(x.category===t.dataset.deletecat)x.category="other";});db.cats=db.cats.filter(function(x){return x.id!==t.dataset.deletecat;});db.quick=db.quick.filter(function(x){return x!==t.dataset.deletecat;});persist();render();return;}
 if(t.dataset.quickUp){swapQuick(Number(t.dataset.quickUp),Number(t.dataset.quickUp)-1);return;}
 if(t.dataset.quickDown){swapQuick(Number(t.dataset.quickDown),Number(t.dataset.quickDown)+1);return;}
 if(t.dataset.deleteIncome){if(confirm("داهاتەکە بسڕدرێتەوە؟")){db.incomes=db.incomes.filter(function(x){return x.id!==t.dataset.deleteIncome;});persist();render();}return;}
 if(t.dataset.toggleRecurring){var a=db.recurring.find(function(x){return x.id===t.dataset.toggleRecurring;});a.active=!a.active;persist();render();return;}
 if(t.dataset.deleteRecurring){if(confirm("یاسای خەرجیی مانگانە بسڕدرێتەوە؟")){db.recurring=db.recurring.filter(function(x){return x.id!==t.dataset.deleteRecurring;});persist();render();}return;}
 switch(t.dataset.action){
 case"expense":formExpense();break;case"salary":editSalary();break;case"income":addIncome();break;case"saving":saving();break;case"goal":goal();break;case"budget":budget();break;case"recurring":recurring();break;case"opening":opening();break;case"category":category();break;case"backup":backUp();break;case"restore":restore();break;case"quicksettings":setTab("settings");break;case"website":if(window.ParemAndroid&&ParemAndroid.openWebsite)ParemAndroid.openWebsite();else window.open("https://parem-karzan-2026.loftytrail13.chatgpt.site","_blank");break;
 }
});
document.addEventListener("change",function(e){
 if(e.target.id==="monthPick"){month=e.target.value||currentMonth();catFilter="all";searchTerm="";syncRangeFromPreset();render();}
 if(e.target.id==="catFilter"){catFilter=e.target.value;document.getElementById("expenseList").innerHTML=expenseRows();}
 if(e.target.id==="rangePreset"){rangePreset=e.target.value; if(rangePreset!=="custom")syncRangeFromPreset();render();}
 if(e.target.id==="rangeStart"){rangeStart=e.target.value;rangePreset="custom";render();}
 if(e.target.id==="rangeEnd"){rangeEnd=e.target.value;rangePreset="custom";render();}
});
document.addEventListener("input",function(e){
 if(e.target.matches('input[data-money]'))liveAmountFormat(e.target);
 if(e.target.id==="searchInput"){searchTerm=e.target.value;document.getElementById("expenseList").innerHTML=expenseRows();}
});
document.getElementById("closeDialog").onclick=closePopup;
document.getElementById("dialog").addEventListener("click",function(e){if(e.target.id==="dialog")closePopup();});
syncRangeFromPreset();applyRecurring();render();
})();