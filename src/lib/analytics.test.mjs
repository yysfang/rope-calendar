import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics } from './analytics.ts';

const config={siteId:'0123456789abcdef0123456789abcdef',hostname:'yysfang.github.io',basePath:'/rope-calendar/'};
function fixture(overrides={}) {
 const commands=[],scripts=[],stored=new Map();
 const runtime={location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?q=private-query#secret'},storage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},loadScript:src=>scripts.push(src),send:command=>commands.push(command),...overrides};
 return {commands,scripts,stored,runtime,analytics:createAnalytics(config,runtime)};
}
const event={title:'2026年全国跳绳段位挑战赛（河北站）',level:'全国',id:'private-internal-key',uuid:'private-uuid',query:'private-query',saved:['private-favorite']};
const document={title:'河北站最新参赛通知',kind:'regulation',format:'HTML',url:'https://official.example/?token=private-token'};

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
  const {analytics,commands,scripts}=fixture({location});analytics.page('events');analytics.viewEvent(event);analytics.download(event,document);
  assert.deepEqual(commands,[]);assert.deepEqual(scripts,[]);
 }
 for(const siteId of ['', 'not-a-site', 'https://untrusted.example/script']) {
  const state=fixture();const analytics=createAnalytics({...config,siteId},state.runtime);analytics.page('events');
  assert.deepEqual(state.scripts,[]);assert.deepEqual(state.commands,[]);
 }
});

test('owner exclusion is applied before the first page and can be restored deliberately',()=>{
 const state=fixture({location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?analytics=off'}});
 state.analytics.page('events');state.analytics.viewEvent(event);
 assert.deepEqual(state.scripts,[]);assert.equal(state.analytics.isExcluded(),true);
 const next=createAnalytics(config,{...state.runtime,location:{...state.runtime.location,search:''}});next.page('events');assert.deepEqual(state.commands,[]);
 const restored=createAnalytics(config,{...state.runtime,location:{...state.runtime.location,search:'?analytics=on'}});restored.page('events');
 assert.equal(restored.isExcluded(),false);assert.equal(state.scripts.length,1);assert.deepEqual(state.commands.at(-1),['_trackPageview','/rope-calendar/']);
});

test('browser tracking preferences are respected even when the owner explicitly enables tracking',()=>{
 for(const preference of [{doNotTrack:'1'},{doNotTrack:'yes'},{globalPrivacyControl:true}]) {
  const state=fixture({...preference,location:{protocol:'https:',hostname:'yysfang.github.io',pathname:'/rope-calendar/',search:'?analytics=on'}});
  state.analytics.page('events');state.analytics.download(event,document);assert.deepEqual(state.scripts,[]);assert.deepEqual(state.commands,[]);
 }
});

test('event and document clicks send a readable allowlist without internal keys or user input',()=>{
 const {analytics,commands}=fixture();analytics.viewEvent(event);analytics.download(event,document);
 assert.deepEqual(commands.slice(1),[['_trackEvent','赛事','查看详情','2026年全国跳绳段位挑战赛（河北站）'],['_trackEvent','资料','下载点击','2026年全国跳绳段位挑战赛（河北站）｜河北站最新参赛通知']]);
 assert.doesNotMatch(JSON.stringify(commands),/private-|uuid|saved|query|official\.example/);
});

test('statistics failures and unavailable storage never break browsing or download actions',()=>{
 for(const failure of [
  {storage:{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}}},
  {loadScript:()=>{throw Error('offline');}},
  {send:()=>{throw Error('blocked collector');}},
 ]) {
  const {analytics}=fixture(failure);assert.doesNotThrow(()=>{analytics.page('events');analytics.viewEvent(event);analytics.download(event,document);analytics.setExcluded(true);});
 }
 const state=fixture();state.analytics.setExcluded(true);state.analytics.page('events');assert.deepEqual(state.scripts,[]);
});
