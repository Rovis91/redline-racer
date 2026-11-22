// Browser acceptance test: real keyboard input to a painted menu frame, every circuit, optional offline previews, CPU throttled. Usage: node tools/bench-menu.js [--offline-previews] [--cpu=4]
const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'..'),port=+process.env.MENU_PORT||8899,debug=+process.env.MENU_DBG||9440,budget=500;
const cpu=+(process.argv.find(a=>a.startsWith('--cpu='))||'--cpu=4').split('=')[1],offline=process.argv.includes('--offline-previews');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':f.endsWith('.webp')?'image/webp':f.endsWith('.woff2')?'font/woff2':'application/octet-stream');r.end(fs.readFileSync(f));});
(async()=>{
 await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const chrome=spawn(process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port='+debug,'--user-data-dir='+path.join(root,'captures/menu-budget-profile'),'--window-size=1280,800','--no-first-run','--ignore-gpu-blocklist','--enable-gpu','--disable-background-timer-throttling','--disable-renderer-backgrounding','--autoplay-policy=no-user-gesture-required','--mute-audio','about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;try{
 let tab;for(let i=0;i<100;i++){try{tab=(await(await fetch('http://127.0.0.1:'+debug+'/json/list')).json()).find(x=>x.type==='page');if(tab)break;}catch{}await delay(100);}if(!tab)throw Error('Chrome did not start');
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const calls=new Map(),errors=[],requests=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){calls.get(m.id)?.(m);calls.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);};
 const cmd=(method,params={})=>new Promise(r=>{const n=++id;calls.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});
 const ev=async expression=>{const m=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result.exceptionDetails)throw Error(m.result.exceptionDetails.exception?.description||m.result.exceptionDetails.text);return m.result.result.value;};
 const until=async expression=>{for(let i=0;i<800;i++){if(await ev(expression))return;await delay(50);}throw Error('Timed out: '+expression+' '+errors.join('\n'));};
 await cmd('Runtime.enable');await cmd('Page.enable');await cmd('Network.enable');await cmd('Emulation.setCPUThrottlingRate',{rate:cpu});
 await cmd('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();sessionStorage.clear();`});
 if(offline)await cmd('Network.setBlockedURLs',{urls:['*assets/previews/*']});
 const url='http://127.0.0.1:'+port+'/index.html?map=ville';await cmd('Page.navigate',{url});await until(`location.href===${JSON.stringify(url)} && !!window.__g && document.getElementById('loading').hidden && !!document.getElementById('menu-view')`);
 await ev(`window.menuPaints=0;const paint=GAME_LOADER.menuFrame;GAME_LOADER.menuFrame=(...args)=>{paint(...args);menuPaints++;};window.menuLongTasks=[];window.measureMenuTasks=true;new PerformanceObserver(l=>{if(measureMenuTasks)menuLongTasks.push(...l.getEntries().map(x=>x.duration));}).observe({type:'longtask'});`);
 await cmd('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:10e6/8,uploadThroughput:10e6/8});
 const samples=[];
 const key=async(code,check='true',painted=true)=>{
 await ev(`window.menuResponse=new Promise((resolve,reject)=>{let start=0,base=menuPaints;const listener=e=>{if(e.code!==${JSON.stringify(code)})return;window.removeEventListener('keydown',listener,true);start=e.timeStamp;requestAnimationFrame(function tick(){if((${painted?'menuPaints>base':'true'}) && (${check})){requestAnimationFrame(()=>resolve(performance.now()-start));}else if(performance.now()-start>2000)reject(Error('Menu response timed out'));else requestAnimationFrame(tick);});};window.addEventListener('keydown',listener,true);});void 0;`);
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',timestamp:Date.now()/1000,code,key:code==='Enter'?'Enter':code});await cmd('Input.dispatchKeyEvent',{type:'keyUp',code,key:code==='Enter'?'Enter':code});
 const ms=await ev('menuResponse');samples.push({code,ms:+ms.toFixed(1)});assert(ms<=budget,code+' response '+ms+' ms exceeds '+budget+' ms');return ms;
 };
 await key('ArrowRight');await key('ArrowLeft');await key('Enter','!__g.home');await key('Enter');await key('ArrowDown','__g.menu.row===0');
 const ids=await ev('MAPS.map(m=>m.id)');const initial=await ev('Object.keys(__maps)');
 for(let pass=0;pass<3;pass++)for(let i=1;i<=ids.length;i++){const target=ids[i%ids.length];await key('ArrowRight',`document.getElementById('menu-view').dataset.map==='${target}'`);}
 assert.deepStrictEqual(await ev('Object.keys(__maps)'),initial,'Browsing must not construct another circuit');assert.deepStrictEqual(await ev('Object.keys(__inProgress)'),initial,'Browsing must not queue circuit builds');
 await key('ArrowDown');await key('ArrowRight');await key('ArrowLeft');await key('ArrowDown');await key('ArrowRight');await key('ArrowLeft');
 // Return through the choice screen and exercise online navigation and split-screen settings.
 await key('Escape');await key('ArrowDown');await key('ArrowDown');await key('Enter');await key('Escape');await key('ArrowUp');await key('Enter');await key('ArrowDown','__g.menu.row===0');await key('ArrowDown','__g.menu.row===1');await key('ArrowRight','__g.views.length===3');await key('ArrowRight','__g.views.length===4');await key('ArrowLeft','__g.views.length===3');await key('ArrowLeft','__g.views.length===2');
 assert.deepStrictEqual(errors,[]);
 const extra=requests.filter(u=>/\/src\/maps\//.test(u)&&!u.includes('/ville/'));assert.deepStrictEqual(extra,[],'A menu choice fetched circuit implementation scripts');
 const values=samples.map(s=>s.ms).sort((a,b)=>a-b),long=await ev('menuLongTasks');const report={budgetMs:budget,cpuThrottle:cpu,offlinePreviews:offline,inputs:samples.length,maxMs:values.at(-1),p95Ms:values[Math.floor(values.length*.95)],longTaskMaxMs:Math.max(0,...long),mapsBuilt:initial,samples};
 assert(report.longTaskMaxMs<=budget,'A menu task exceeded the response budget');
 fs.writeFileSync(path.join(root,'captures/menu-budget'+(offline?'-offline':'')+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,samples:undefined}));
 const shot=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'captures/menu-budget.png'),Buffer.from(shot.result.data,'base64'));
 // START is acknowledged by a visible preparation view before any expensive construction.
 await key('Escape');await key('ArrowUp');await key('Enter');await ev(`__g.mapDef('lune')`);await until(`document.getElementById('menu-view').dataset.map==='lune'`);
 await delay(250);const selectedShot=await cmd('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,'captures/menu-selected-lune.png'),Buffer.from(selectedShot.result.data,'base64'));
 // Downward moves find START regardless of the current mode's optional rows.
 while(await ev('__g.menu.row!==5'))await key('ArrowDown');
 await ev(`window.measureMenuTasks=false;window.startResponse=new Promise(resolve=>{window.addEventListener('keydown',function f(e){if(e.code!=='Enter')return;window.removeEventListener('keydown',f,true);const t=performance.now();requestAnimationFrame(function check(){if(!document.getElementById('loading').hidden)requestAnimationFrame(()=>resolve(performance.now()-t));else requestAnimationFrame(check);});},true);});void 0;`);
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',code:'Enter',key:'Enter'});await cmd('Input.dispatchKeyEvent',{type:'keyUp',code:'Enter',key:'Enter'});const ack=await ev('startResponse');assert(ack<=budget,'START acknowledgement exceeds budget');
 await until(`__g.M.id==='lune' && __g.state!=='title' && document.getElementById('loading').hidden`);console.log('START ack '+ack.toFixed(1)+' ms; selected circuit launched');await until(`__g.state==='race'`);await key('Escape',`__g.state==='pause'`);await ev(`measureMenuTasks=true;void 0`);for(let i=0;i<12;i++){await key('ArrowDown',`__g.menu.pauseRow===1`);await key('ArrowUp',`__g.menu.pauseRow===0`);}await ev(`measureMenuTasks=false;void 0`);await key('Escape',`__g.state==='race'`,false);const all=samples.map(s=>s.ms).concat(ack).sort((a,b)=>a-b);Object.assign(report,{inputs:all.length,maxMs:all.at(-1),p95Ms:all[Math.floor(all.length*.95)],startAckMs:+ack.toFixed(1),longTaskMaxMs:Math.max(0,...await ev('menuLongTasks')),samples});assert(report.longTaskMaxMs<=budget,'A menu task exceeded the response budget');fs.writeFileSync(path.join(root,'captures/menu-budget'+(offline?'-offline':'')+'.json'),JSON.stringify(report,null,2));console.log('ALL MENUS '+JSON.stringify({...report,samples:undefined}));
 }finally{ws?.close();chrome.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
