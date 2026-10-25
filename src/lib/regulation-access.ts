import type {Regulation} from './catalog';
export function regulationAccess(document:Regulation,baseUrl:string,userAgent:string) {
 const wechat=/MicroMessenger/i.test(userAgent);
 const href=document.localPath?new URL('.'+document.localPath,baseUrl).href:document.url;
 const stem=document.title.replace(/（官方网页存档）$/,'').replace(/\.(pdf|docx?|html)$/i,'').replace(/[<>:："/\\|?*\u0000-\u001f]/g,'').trim().slice(0,150)||'竞赛规程';
 const mode=document.format==='HTML'?'preview':wechat?'wechat':'download';
 return {mode,href,filename:`${stem}.${document.format.toLowerCase()}`,local:!!document.localPath,wechat};
}
