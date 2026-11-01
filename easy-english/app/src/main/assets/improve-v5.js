/* Easy English V5: verified setup first, unified AI teacher and simple speaking practice. */
(function(){
'use strict';
const VERIFY_KEY='easy_english_v5_connection_verified';
let speechMode='lesson';
const oldRender=render,oldAiPage=aiPage,oldSettings=settings,oldLevelPage=levelPage;
const oldConnectionTest=testAiConnection,oldSaveAiConfig=saveAiConfig,oldRemoveKey=removeGeminiKey;
const oldNativeVoice=window.easyEnglishOnNativeSpeech;
function verified(){
 try{return localStorage.getItem(VERIFY_KEY)==='1' && (nativeGeminiKeyPresent() || geminiApiKey.length>=15)}catch(e){return false}
}
function onboarding(){
 const hasStored=nativeGeminiKeyPresent()||geminiApiKey.length>=15;
 return `<div class="ee5-setup" role="main" aria-label="پەیوەستکردنی مامۆستای زیرەک">
  <div class="ee5-setup-star">✦</div>
  <div class="ee5-setup-logo">Easy <em>English</em></div>
  <h1>پەیوەستکردنی مامۆستای زیرەک</h1>
  <p>تەنها یەکەم جار کلیلی Google Gemini داخیل بکە، پاشان ڕاستەوخۆ بچۆ ناو وانەکانت.</p>
  <label for="gemini-key">Gemini API Key</label>
  <input id="gemini-key" type="password" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${hasStored?'کلیلی پێشوو پارێزراوە، بۆ تاقیکردنەوە بەردەوام بە':'Paste Gemini API Key'}">
  <label for="gemini-model">مۆدێلی مامۆستا</label>
  <select id="gemini-model" dir="ltr"><option value="gemini-2.5-flash-lite" ${aiPrefs.model==='gemini-2.5-flash-lite'?'selected':''}>Gemini 2.5 Flash Lite</option><option value="gemini-2.5-flash" ${aiPrefs.model==='gemini-2.5-flash'?'selected':''}>Gemini 2.5 Flash</option></select>
  <input id="gemini-remember" type="checkbox" checked style="display:none" aria-hidden="true">
  <button type="button" class="btn" data-action="ai-check" ${aiPending?'disabled':''}>${aiPending?'پەیوەندی تاقی دەکرێتەوە…':'پەیوەستبوون و چوونە ژوورەوە'}</button>
  ${aiStatus?'<div class="ee5-status" role="status">'+esc(aiStatus)+'</div>':''}
  <small>کلیلی تۆ لە ئەندرۆیددا بە Android Keystore پارێزراوە. بۆ گفتوگۆی AI ئینتەرنێت پێویستە. کلیلی خۆت بۆ کەسی دیکە مەنێرە.</small>
 </div>`;
}
function showScreen(scroll){
 const gate=!verified();
 document.body.classList.toggle('ee5-gated',gate);
 if(gate){
  const t=document.getElementById('top');if(t)t.innerHTML='';
  const n=document.getElementById('nav');if(n)n.innerHTML='';
  document.getElementById('main').innerHTML=onboarding();
  if(scroll)window.scrollTo(0,0);
  return;
 }
 oldRender(scroll);
}
render=showScreen;
testAiConnection=async function(){
 await oldConnectionTest();
 if(aiReady && (nativeGeminiKeyPresent()||geminiApiKey.length>=15)){
   try{localStorage.setItem(VERIFY_KEY,'1');localStorage.setItem(GEMINI_PREFS_KEY,JSON.stringify({...aiPrefs,remember:true}));}catch(e){}
   aiPrefs.remember=true;
   aiStatus='';page='home';render(true);
 }
};
saveAiConfig=function(quiet=false){
 if(verified()&&!document.getElementById('gemini-key'))return !!nativeGeminiKeyPresent()||!!geminiApiKey;
 return oldSaveAiConfig(quiet);
};
removeGeminiKey=function(){
 try{localStorage.removeItem(VERIFY_KEY)}catch(e){}
 oldRemoveKey();
};
settings=function(){
 const html=oldSettings();
 return html.replace('<button class="softbtn" data-action="reset-confirm">',
 '<button class="softbtn" style="display:block;margin:12px 0;min-height:47px" data-action="ee5-change-key">گۆڕینی کلیلی پەیوەندی مامۆستا</button><button class="softbtn" data-action="reset-confirm">');
};
aiPage=function(){
 let html=oldAiPage();
 html=html.replace(/<details class="ai3-config"[\s\S]*?<\/details>/,'');
 html=html.replace(/<p class="ai3-footer-note">[\s\S]*?<\/p>/,'');
 html=html.replace('GOOGLE GEMINI · AI TEACHER','EASY ENGLISH · AI TEACHER');
 html=html.replace('فێربوونی ئینگلیزی لەگەڵ Gemini','فێربوونی ئینگلیزی بە گفتوگۆ');
 html=html.replace('پەیوەندی پشتڕاستکراوە','ئامادەی گفتوگۆیە');
 html=html.replace('<button class="ai3-send"','<button class="ai5-voice" type="button" data-action="ai5-mic" aria-label="قسەکردن بە مایکرۆفۆن">🎙</button><button class="ai3-send"');
 html=html.replace('<div class="ai3-compose-foot">','<div id="ai5-voice-status" class="ai5-voice-status" role="status">🎙 بۆ قسەکردن بە ئینگلیزی دوگمەی مایکرۆفۆن دابگرە.</div><div class="ai3-compose-foot">');
 return html;
};
levelPage=function(){
 let html=oldLevelPage();
 if(!html.includes('data-action="pronounce"'))return html;
 const target=level(activeLevel).items[0].en;
 const voice=`<section class="ee5-voice-panel">
  <h3>🎙 ڕاهێنانی قسەکردن</h3>
  <p>سەرەتا گوێبگرە؛ دوای ئەوە وشەکە بە دەنگی خۆت بڵێ.</p>
  <div class="ee5-voice-target"><strong lang="en" dir="ltr">${esc(target)}</strong><button type="button" class="softbtn" data-action="speak" data-text="${esc(target)}">♫ گوێبگرە</button></div>
  <button class="btn ee5-pronounce" type="button" data-action="pronounce" data-text="${esc(target)}">🎤 دەست بە قسەکردن بکە</button>
  <p id="pronounce-result" aria-live="polite">دوگمەی سەرەوە دابگرە، ئینجا وشەکە بڵێ.</p>
  <div class="voice-entry" id="voice-entry">
   <b>ڕێگای دووەم: مایکرۆفۆنی کیبۆرد</b>
   <p class="helper">ئەگەر ناسینەوەی دەنگی مۆبایل کار نەکرد، لە خانەکە دابگرە و مایکرۆفۆنی Gboard بەکاربهێنە.</p>
   <input id="voice-transcript-input" dir="ltr" type="text" lang="en" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Say or type ${esc(target)}"/>
   <button class="softbtn" data-action="assess-voice" type="button">پشکنینی وەڵام</button>
  </div>
  <small>ئەمە وشەی ناسراو هەڵدەسەنگێنێت، نەک نمرەی زانستیی تەلەفوز.</small>
 </section>`;
 const start=html.indexOf('<div class="card"><h3>🎤');
 const end=html.indexOf('<div class="gap"></div><div class="card"><h3>تاقیکردنەوەی کۆتایی',start);
 if(start>=0&&end>start)return html.slice(0,start)+voice+html.slice(end);
 return html;
};
scoreSpokenAnswer=function(text){
 const r=document.getElementById('pronounce-result');
 if(!r)return;
 const heard=normalizeEnglish(text),wanted=normalizeEnglish(expectedPracticeWord);
 r.classList.remove('good','retry');
 if(!heard){r.textContent='تکایە وشەکە بڵێ یان بە مایکرۆفۆنی کیبۆرد بینووسە.';return}
 if(heard===wanted){r.classList.add('good');r.textContent='✓ بە دروستی ناسرایەوە: '+text}
 else{r.classList.add('retry');r.textContent='گوێمان لە «'+text+'» بوو؛ وشەی داواکراو «'+expectedPracticeWord+'» ـە. دووبارە هەوڵ بدە.'}
};
window.easyEnglishOnNativeSpeech=function(heard,success){
 const words=String(heard||'');
 const prompt=words.includes('قسە بکە')||words.includes('Listening');
 if(speechMode==='ai'&&page==='ai'){
  const status=document.getElementById('ai5-voice-status');
  if(!success){
    if(status)status.textContent=prompt?'🎙 ئێستا بە ئینگلیزی قسە بکە.':'⚠️ '+words+' — یان لە خانەی نووسین مایکرۆفۆنی کیبۆرد بەکاربهێنە.';
    if(!prompt)document.getElementById('ai-question')?.focus();
    return;
  }
  if(status)status.textContent='✓ قسەکەت ناسرایەوە؛ دەنێردرێت.';
  const field=document.getElementById('ai-question');
  if(field&&words.trim()){field.value=words.trim();sendAiMessage();}
  return;
 }
 if(!success&&prompt){const r=document.getElementById('pronounce-result');if(r)r.textContent='🎙 ئێستا وشەکە بڵێ…';return}
 oldNativeVoice(heard,success);
};
function listenToAi(){
 if(aiPending){toast('سەرەتا چاوەڕوانی وەڵامی مامۆستا بکە.');return}
 speechMode='ai';
 const status=document.getElementById('ai5-voice-status');
 if(status)status.textContent='🎙 مایکرۆفۆن ئامادە دەکرێت…';
 try{if(window.Android&&typeof Android.startSpeechPractice==='function'){
  if(Android.startSpeechPractice('AI conversation'))return;
 }}catch(e){}
 if(status)status.textContent='ئەگەر مایکرۆفۆنی ئەپ بەردەست نەبوو، مایکرۆفۆنی کیبۆرد (Gboard) بەکاربهێنە.';
 document.getElementById('ai-question')?.focus();
}
document.addEventListener('click',function(event){
 const btn=event.target.closest('[data-action]');if(!btn)return;
 if(btn.dataset.action==='ai5-mic'){event.preventDefault();listenToAi();}
 if(btn.dataset.action==='ee5-change-key'){
  event.preventDefault();try{localStorage.removeItem(VERIFY_KEY)}catch(e){}
  aiStatus='کلیلی نوێ داخیل بکە یان کلیلی پێشوو تاقی بکەرەوە.';render(true);
 }
 if(btn.dataset.action==='pronounce')speechMode='lesson';
},true);
render(true);
})();