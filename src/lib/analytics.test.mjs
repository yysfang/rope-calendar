import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics } from './analytics.ts';

const config={siteId:'0123456789abcdef0123456789abcdef',hostname:'yysfang.github.io',basePath:'/rope-calendar/'};
function fixture(overrides={}) {
 const commands=[],scripts=[],stored=new Map();
 const runtime={location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?q=private-query#secret'},storage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},loadScript:src=>scripts.push(src),send:command=>commands.push(command),...overrides};
 return {commands,scripts,stored,runtime,analytics:createAnalytics(config,runtime)};
}

test('analytics records actual view changes once and sends only fixed page paths',()=>{
 const {analytics,commands,scripts}=fixture();
 analytics.page('events');analytics.page('events');analytics.page('documents');analytics.page('saved');analytics.page('events');
 assert.deepEqual(scripts,['https://hm.baidu.com/hm.js?0123456789abcdef0123456789abcdef']);
 assert.deepEqual(commands,[['_setAutoPageview',false],['_trackPageview','/rope-calendar/'],['_trackPageview','/rope-calendar/regulations'],['_trackPageview','/rope-calendar/saved'],['_trackPageview','/rope-calendar/']]);
 assert.doesNotMatch(JSON.stringify(commands),/private-query|secret/);
});

test('analytics never loads on local previews, other projects or unconfigured sites',()=>{
 for(const location of [
  {protocol:'http:',hostname:'127.0.0.1',pathname:'/rope-calendar/',search:''},
  {protocol:'https:',hostname:'preview.example',pathname:'/rope-calendar/',search:''},
  {protocol:'https:',hostname:'yysfang.github.io',pathname:'/another-project/',search:''},
  {protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar-copy/',search:''},
 ]) {
  const {analytics,commands,scripts}=fixture({location});analytics.page('events');analytics.page('documents');analytics.page('saved');
  assert.deepEqual(commands,[]);assert.deepEqual(scripts,[]);
 }
 for(const siteId of ['', 'not-a-site', 'https://untrusted.example/script']) {
  const state=fixture();const analytics=createAnalytics({...config,siteId},state.runtime);analytics.page('events');
  assert.deepEqual(state.scripts,[]);assert.deepEqual(state.commands,[]);
 }
});

test('owner exclusion is applied before the first page and can be restored deliberately',()=>{
 const state=fixture({location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?analytics=off'}});
 state.analytics.page('events');state.analytics.page('documents');
 assert.deepEqual(state.scripts,[]);assert.equal(state.analytics.isExcluded(),true);
 const next=createAnalytics(config,{...state.runtime,location:{...state.runtime.location,search:''}});next.page('events');assert.deepEqual(state.commands,[]);
 const restored=createAnalytics(config,{...state.runtime,location:{...state.runtime.location,search:'?analytics=on'}});restored.page('events');
 assert.equal(restored.isExcluded(),false);assert.equal(state.scripts.length,1);assert.deepEqual(state.commands.at(-1),['_trackPageview','/rope-calendar/']);
});

test('browser tracking preferences are respected even when the owner explicitly enables tracking',()=>{
 for(const preference of [{doNotTrack:'1'},{doNotTrack:'yes'},{globalPrivacyControl:true}]) {
  const state=fixture({...preference,location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?analytics=on'}});
  state.analytics.page('events');state.analytics.page('documents');assert.deepEqual(state.scripts,[]);assert.deepEqual(state.commands,[]);
 }
});

test('statistics failures and unavailable storage never interrupt page changes',()=>{
 for(const failure of [
  {storage:{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}}},
  {loadScript:()=>{throw Error('offline');}},
  {send:()=>{throw Error('blocked collector');}},
 ]) {
  const {analytics}=fixture(failure);assert.doesNotThrow(()=>{analytics.page('events');analytics.page('documents');analytics.setExcluded(true);});
 }
 const state=fixture();state.analytics.setExcluded(true);state.analytics.page('events');assert.deepEqual(state.scripts,[]);
});
