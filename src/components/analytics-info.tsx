import {useEffect,useRef,useState} from 'react';
import {X,ExternalLink} from 'lucide-react';
import {analytics} from '@/lib/browser-analytics';

export default function AnalyticsInfo({onClose}:{onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 const [excluded,setExcluded]=useState(analytics.isExcluded);
 useEffect(()=>{ref.current?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;};},[]);
 return <dialog ref={ref} className="event-dialog" aria-labelledby="analytics-title" onClose={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}>
  <div className="dialog-content">
   <div className="dialog-top"><h2 id="analytics-title">访问统计</h2><button className="icon-button" aria-label="关闭访问统计说明" onClick={onClose}><X size={21}/></button></div>
   <p className="dialog-summary">我们使用百度统计了解访问量和回访情况，帮助持续改进绳历。</p>
   <div className="detail-section"><p>百度统计会使用 Cookie、浏览器及网络信息估算访客。我们只记录页面浏览，不发送搜索内容、收藏清单或联系方式。统计报告仅供站点维护者查看。</p></div>
   <div className="detail-section"><label className="analytics-choice"><input type="checkbox" checked={excluded} onChange={event=>setExcluded(event.target.checked)}/><span>在此浏览器关闭访问统计</span></label><p>选择保存在本浏览器。浏览器已开启“不跟踪”或全局隐私控制时，我们也不会加载统计。</p></div>
   <a className="source-link" href="https://tongji.baidu.com/web/help/article?id=330&type=0" target="_blank" rel="noreferrer">百度统计隐私政策<ExternalLink size={14}/></a>
   <div className="dialog-actions"><button className="button primary" onClick={()=>{analytics.setExcluded(excluded);const url=new URL(window.location.href);url.searchParams.set('analytics',excluded?'off':'on');window.location.replace(url.href);}}>保存并刷新</button><button className="button secondary" onClick={onClose}>返回</button></div>
  </div>
 </dialog>;
}
