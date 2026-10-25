import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {regulationAccess,regulationDownloadBlob} from './regulation-access.ts';

const doc={title:'2026年全国跳绳段位挑战赛（河北站）最新通知（官方网页存档）',format:'HTML',localPath:'/regulations/hebei-notice.html',url:'https://official.example/notice'};
const base='https://yysfang.github.io/rope-calendar/?analytics=off';

test('HTML regulations open a readable preview instead of forced attachment downloads',()=>{
 for(const userAgent of ['Mozilla/5.0 Chrome/130','Mozilla/5.0 MicroMessenger/8.0']){
  const result=regulationAccess(doc,base,userAgent);
  assert.equal(result.mode,'preview');
  assert.equal(result.href,'https://yysfang.github.io/rope-calendar/regulations/hebei-notice.html');
  assert.equal(result.filename,'2026年全国跳绳段位挑战赛（河北站）最新通知.html');
 }
});

test('binary files have a real format and readable filename, with a WeChat fallback before native downloads',()=>{
 for(const format of ['PDF','DOC','DOCX']){
  const file={...doc,title:'规程：报名/参赛要求',format,localPath:'/regulations/competition.'+format.toLowerCase()};
  const normal=regulationAccess(file,base,'Mozilla/5.0 Chrome/130');
  assert.equal(normal.mode,'download');
  assert.equal(normal.filename,'规程报名参赛要求.'+format.toLowerCase());
  assert.equal(regulationAccess(file,base,'Mozilla/5.0 (Linux; Android) MicroMessenger/8.0').mode,'wechat');
 }
});

test('local links keep the project subdirectory and original sources remain available',()=>{
 assert.equal(regulationAccess(doc,'http://127.0.0.1:4173/','').href,'http://127.0.0.1:4173/regulations/hebei-notice.html');
 const external=regulationAccess({...doc,localPath:undefined,format:'PDF'},base,'');
 assert.equal(external.href,'https://official.example/notice');
 assert.equal(external.local,false);
 assert.equal(regulationAccess({...doc,title:'原始规程.pdf',format:'PDF'},base,'').filename,'原始规程.pdf');
});

test('every published document resolves to a nonempty file within the GitHub project path',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../data/seed.json',import.meta.url),'utf8'));
 for(const document of catalog.events.flatMap(event=>event.documents)){
  const result=regulationAccess(document,base,'');
  assert.equal(new URL(result.href).pathname,'/rope-calendar'+document.localPath);
  const bytes=await readFile(new URL('../../public'+document.localPath,import.meta.url));
  assert.ok(bytes.length>=100,document.title);
 }
});

test('web archive saves preserve full content and refuse empty or failed responses',async()=>{
 const content='<!doctype html><html lang="zh"><body>竞赛规程</body></html>';
 const blob=await regulationDownloadBlob('https://official.example/rules.html',async()=>new Response(content));
 assert.equal(await blob.text(),content);
 assert.equal(blob.type,'application/octet-stream');
 await assert.rejects(regulationDownloadBlob('https://official.example/rules.html',async()=>new Response('')));
 await assert.rejects(regulationDownloadBlob('https://official.example/rules.html',async()=>new Response('Not Found',{status:404})));
});
