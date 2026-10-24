import config from '../data/analytics.json';
import {createAnalytics,type AnalyticsCommand} from './analytics';

declare global {
 interface Window {_hmt?:{push:(command:AnalyticsCommand)=>unknown;length?:number};}
}
let storage:Storage|undefined;
try {storage=window.localStorage;} catch { /* Statistics must not require browser storage. */ }

export const analytics=createAnalytics(config,{
 location:window.location,storage,doNotTrack:navigator.doNotTrack,
 globalPrivacyControl:(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl,
 loadScript(src){const script=document.createElement('script');script.async=true;script.src=src;script.dataset.ropeAnalytics='baidu';script.onload=()=>{script.dataset.loaded='true';};script.onerror=()=>{script.dataset.loaded='false';};document.head.appendChild(script);},
 send(command){const queue=window._hmt ||= [] as AnalyticsCommand[];if((queue.length||0)<200)queue.push(command);},
});
