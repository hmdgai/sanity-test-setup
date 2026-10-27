import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Run the real loader with a fake DOM, never contacting Google.
const path=process.argv[2] || 'src/layouts/BaseLayout.astro';
const source=readFileSync(path,'utf8');
const loader=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).find(code=>code.includes('function loadGtm()'));
assert.ok(loader,`GTM loader missing in ${path}; build with PUBLIC_GTM_ID=GTM-TEST123`);
for (const idleAvailable of [true,false]) {
  const injected=[];
  const defaults=['consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}];
  const window={dataLayer:[defaults],
    addEventListener(){throw new Error('GTM must not wait for interaction');},
    setTimeout(){throw new Error('GTM must not wait for a timer');}};
  if(idleAvailable) window.requestIdleCallback=()=>{throw new Error('GTM must not wait for idle time');};
  const document={head:{appendChild(script){injected.push(script);}},createElement(){return {};}};
  Object.defineProperty(document,'cookie',{set(){throw new Error('Loader must not write cookies');},get(){return '';}});
  const context=vm.createContext({window,document,_gtmId:'GTM-TEST123',Date});
  // Astro may wrap define:vars scripts in an IIFE. Exercise repeated calls
  // within that same lexical scope without changing the loader function.
  const callAt=loader.lastIndexOf('loadGtm();');
  assert.ok(callAt>=0);
  const instrumented=loader.slice(0,callAt)+'loadGtm();loadGtm();loadGtm();'+loader.slice(callAt+'loadGtm();'.length);
  vm.runInContext(instrumented,context,{timeout:1000});
  assert.equal(injected.length,1,'GTM must be requested immediately without any event');
  assert.match(injected[0].src,/^https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-/);
  assert.equal(injected[0].async,true);
  assert.equal(window.dataLayer.length,2,'No extra consent commands');
  assert.equal(window.dataLayer[1].event,'gtm.js');
  assert.deepEqual(defaults[2],{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  assert.equal(injected.length,1,'Repeated calls must not duplicate GTM');
}
console.log(`PASS: ${path}: immediate async GTM load with/without idle API; no interaction, timer, cookie writes or duplicate loading`);
