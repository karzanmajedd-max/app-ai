const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=readFileSync(join(__dirname,'../app/src/main/assets/index.html'),'utf8');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const snippet=html.slice(html.indexOf('function geminiFailure('),html.indexOf('async function testAiConnection()'));
function harness(native=false){
 const c=vm.createContext({console,setTimeout,clearTimeout,DOMException,AbortController,window:{},localStorage:{setItem(){}},nativeGeminiAvailable:()=>native,fetch:()=>{throw Error('unexpected network')},GEMINI_MODELS:['auto'],discoveredModels:[],aiPrefs:{model:'auto'},aiActiveModel:'',GEMINI_PREFS_KEY:'prefs',geminiApiKey:'test-placeholder'});
 vm.runInContext(snippet,c);return c;
}
const run=(c,s)=>vm.runInContext(s,c);
(async()=>{
 let c=harness();
 run(c,`var pages=0;geminiHttp=async()=>++pages===1?{models:[{name:'models/gemini-3-flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-3-image',supportedGenerationMethods:['generateContent']},{name:'models/embedding',supportedGenerationMethods:['embedContent']}],nextPageToken:'next'}:{models:[{name:'models/gemini-4-flash',supportedGenerationMethods:['generateContent']}]};`);
 assert.deepEqual(Array.from(await run(c,'discoverGeminiModels()')),['gemini-4-flash','gemini-3-flash']);
 assert.equal(run(c,'pages'),2);
 run(c,`var calls=[];geminiHttp=async(path)=>{calls.push(path);if(calls.length===1)throw geminiError(404,{message:'retired'});return {candidates:[{content:{parts:[{thought:true,text:'hidden reasoning'},{text:'OK'}]}}]};};`);
 assert.equal(await run(c,"geminiGenerate([{role:'user',parts:[{text:'test'}]}])"),'OK');
 assert.equal(run(c,'aiActiveModel'),'gemini-3-flash');
 assert.equal(run(c,'aiPrefs.model'),'auto');
 // Explicit models must be sent unchanged, without discovery or fallback.
 for(const code of [404,429]){
  c=harness();run(c,`aiPrefs.model='gemini-2.5-flash';discoveredModels=['gemini-omni-1.1-flash'];var calls=[];geminiHttp=async(path)=>{calls.push(path);throw geminiError(${code},{message:'upstream reason'})};`);
  await assert.rejects(run(c,'geminiGenerate([])'),e=>e.status===code&&e.requestedModel==='gemini-2.5-flash'&&e.message.includes('gemini-2.5-flash'));
  assert.deepEqual(Array.from(run(c,'calls')),['models/gemini-2.5-flash:generateContent']);
  assert.equal(run(c,'aiPrefs.model'),'gemini-2.5-flash');
 }
 c=harness();run(c,`aiPrefs.model='gemini-2.5-flash-lite';geminiHttp=async(path)=>{if(path!=='models/gemini-2.5-flash-lite:generateContent')throw Error('wrong model');return {candidates:[{content:{parts:[{text:'OK'}]}}]}};`);
 assert.equal(await run(c,'geminiGenerate([])'),'OK');
 for(const code of [400,401,403,429,500]){
  c=harness();run(c,`discoveredModels=['gemini-a','gemini-b'];var attempts=0;geminiHttp=async()=>{attempts++;throw geminiError(${code},{message:'precise upstream reason'})};`);
  await assert.rejects(run(c,'geminiGenerate([])'),e=>e.status===code&&e.message.includes('precise upstream reason'));
  assert.equal(run(c,'attempts'),1);
 }
 c=harness();run(c,'geminiHttp=async()=>({models:[]})');await assert.rejects(run(c,'discoverGeminiModels()'));
 c=harness(true);run(c,`var requestId;Android={geminiGenerate(model,id,body){requestId=id}};var pending=nativeGeminiRequest('generate',['gemini-3-flash','{}']);window.easyEnglishGeminiNativeResult(requestId,false,JSON.stringify({httpStatus:404,error:{message:'exact server detail'}}));`);
 await assert.rejects(run(c,'pending'),e=>e.status===404&&e.message.includes('exact server detail'));
 assert.equal(run(c,'geminiCallbacks.size'),0);
 run(c,`var controller=new AbortController();var cancelled=nativeGeminiRequest('generate',['gemini-3-flash','{}'],controller.signal);controller.abort();`);
 await assert.rejects(run(c,'cancelled'),e=>e.name==='AbortError');assert.equal(run(c,'geminiCallbacks.size'),0);
 assert.ok(!run(c,"geminiFailure(403,{message:'AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'})").includes('AIza'));
 console.log('Gemini regression checks passed: pagination, text filtering, 404 recovery, no retries on auth/quota errors, native details, cancellation, key redaction; inline JS syntax passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
