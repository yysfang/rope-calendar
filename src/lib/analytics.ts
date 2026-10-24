export type AnalyticsView = 'events'|'documents'|'saved';
export type AnalyticsCommand = [string,...(string|boolean)[]];
export type AnalyticsConfig = {siteId:string;hostname:string;basePath:string};
type PublicEvent = {title:string};
type PublicDocument = {title:string};
type AnalyticsRuntime = {
 location:{protocol:string;hostname:string;pathname:string;search:string};
 storage?:Pick<Storage,'getItem'|'setItem'>;
 doNotTrack?:string|null;
 globalPrivacyControl?:boolean;
 loadScript:(src:string)=>void;
 send:(command:AnalyticsCommand)=>void;
};
const exclusionKey='rope-calendar-analytics-excluded';

export function createAnalytics(config:AnalyticsConfig,runtime:AnalyticsRuntime) {
 let excluded=false,started=false,failed=false;
 let lastView:AnalyticsView|undefined;
 try {excluded=runtime.storage?.getItem(exclusionKey)==='1';} catch { /* Browser storage may be unavailable. */ }
 const override=new URLSearchParams(runtime.location.search).get('analytics');
 const setExcluded=(value:boolean)=>{
  excluded=value;
  try {runtime.storage?.setItem(exclusionKey,value?'1':'0');} catch { /* The in-memory choice still applies. */ }
 };
 if(override==='off'||override==='on')setExcluded(override==='off');
 const isExcluded=()=>excluded||runtime.doNotTrack==='1'||runtime.doNotTrack==='yes'||runtime.globalPrivacyControl===true;
 const base=config.basePath.endsWith('/')?config.basePath:config.basePath+'/';
 const inProduction=runtime.location.protocol==='https:'&&runtime.location.hostname===config.hostname&&(runtime.location.pathname===base.slice(0,-1)||runtime.location.pathname.startsWith(base));
 const configured=/^[a-f0-9]{32}$/i.test(config.siteId);
 const send=(command:AnalyticsCommand)=>{
  if(!configured||!inProduction||isExcluded()||failed)return false;
  try {
   if(!started){runtime.send(['_setAutoPageview',false]);runtime.loadScript(`https://hm.baidu.com/hm.js?${config.siteId}`);started=true;}
   runtime.send(command);
   return true;
  } catch {failed=true;return false;}
 };
 const label=(value:string)=>value.replace(/[\r\n\t]+/g,' ').trim().slice(0,220);
 return {
  page(view:AnalyticsView){
   if(lastView===view)return;
   const path={events:base,documents:base+'regulations',saved:base+'saved'}[view];
   if(send(['_trackPageview',path]))lastView=view;
  },
  viewEvent(event:PublicEvent){send(['_trackEvent','赛事','查看详情',label(event.title)]);},
  download(event:PublicEvent,document:PublicDocument){send(['_trackEvent','资料','下载点击',label(`${event.title}｜${document.title}`)]);},
  isExcluded,setExcluded,
 };
}
