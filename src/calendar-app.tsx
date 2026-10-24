'use client';
import { useEffect, useState } from 'react';
import { Search, ArrowRight, CalendarDays, MapPin, FileText, Download, Bookmark, List, LayoutGrid, ChevronRight, Check, Clock3, X, CalendarPlus } from 'lucide-react';
import { type Catalog, type RopeEvent, type Filters, filterEvents, filtersForMonth, groupEventsForBrowsing, eventStatus, dateLabel, todayShanghai, buildICS, calendarEligible, validateCatalog } from '@/lib/catalog';
import SeasonNavigation from '@/components/season-navigation';
import EventDialog from '@/components/event-dialog';
import MonthCalendar from '@/components/month-calendar';
import EventCover from '@/components/event-cover';
import PhotoCredits from '@/components/photo-credits';
import AnalyticsInfo from '@/components/analytics-info';
import {analytics} from '@/lib/browser-analytics';

type View='events'|'documents'|'saved';
function RopeLogo(){return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 21V11C7 5 25 5 25 11V21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/><rect x="4.5" y="17" width="5" height="11" rx="2.5" fill="currentColor"/><rect x="22.5" y="17" width="5" height="11" rx="2.5" fill="currentColor"/></svg>;}
function shortDate(date:string|null){if(!date)return '待定';return date.slice(5).replace('-','.');}

export default function CalendarApp({initialCatalog}:{initialCatalog:Catalog}) {
 const [catalog,setCatalog]=useState(initialCatalog);const [view,setView]=useState<View>('events');
 const [filters,setFilters]=useState<Filters>({timeline:'upcoming'});const [mode,setMode]=useState<'list'|'calendar'>('list');
 const [saved,setSaved]=useState<string[]>([]);const [favoritesReady,setFavoritesReady]=useState(false);
 const [selected,setSelected]=useState<RopeEvent|null>(null);const [toast,setToast]=useState('');
 const [warning,setWarning]=useState('');const [loading,setLoading]=useState(true);const [today,setToday]=useState(todayShanghai());
 const [month,setMonth]=useState(today.slice(0,7));
 const [creditsOpen,setCreditsOpen]=useState(false);
 const [analyticsOpen,setAnalyticsOpen]=useState(false);
 const refresh=async()=>{setLoading(true);try{const response=await fetch('./catalog.json',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json() as {catalog:unknown;warning?:string};const checked=validateCatalog(data.catalog);if(!checked.success)throw new Error();setCatalog(checked.data);setWarning(data.warning||'');}catch{setWarning('暂时无法刷新，正在显示已有赛事。');}finally{setLoading(false);}};
 useEffect(()=>{void refresh();try{const value=JSON.parse(localStorage.getItem('rope-calendar-favorites')||'[]');if(Array.isArray(value))setSaved(value.filter((id:unknown)=>typeof id==='string'));}catch{}setFavoritesReady(true);const timer=setInterval(()=>setToday(todayShanghai()),60_000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(favoritesReady){try{localStorage.setItem('rope-calendar-favorites',JSON.stringify(saved));}catch{setToast('浏览器暂不允许保存收藏，本次仍可使用。');}}},[saved,favoritesReady]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{analytics.page(view);},[view]);
 const toggleSave=(event:RopeEvent)=>{const exists=saved.includes(event.id);setSaved(current=>exists?current.filter(id=>id!==event.id):[...current,event.id]);setToast(exists?'已移除':'已收藏');};
 const navigate=(target:View)=>{setView(target);setFilters({timeline:target==='events'?'upcoming':'all'});setMonth(today.slice(0,7));setMode('list');};
 const scrollToEvents=()=>document.getElementById('event-explorer')?.scrollIntoView({behavior:'smooth'});
 const updateFilter=(key:keyof Filters,value:string)=>{
  setFilters(current=>({...current,[key]:value,...(key==='year'&&value&&current.month?.slice(0,4)!==value?{month:''}:{})}));
  if(key==='year')setMonth(filters.month&&(!value||filters.month.slice(0,4)===value)?filters.month:value&&value!==today.slice(0,4)?`${value}-01`:today.slice(0,7));
 };
 const candidates=view==='saved'?catalog.events.filter(event=>saved.includes(event.id)):catalog.events;
 const visible=filterEvents(candidates,filters,today);
 const provinces=[...new Set(catalog.events.map(event=>event.province))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'zh'));
 const years=[...new Set(catalog.events.flatMap(event=>[event.startDate?.slice(0,4)||String(event.year||''),event.endDate?.slice(0,4)||'']))].filter(Boolean).sort();
 const groups=groupEventsForBrowsing(visible,filters.month);
 const docs=visible.flatMap(event=>event.documents.map((document,index)=>({event,document,index})));
 const reviewed=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'}).format(new Date(catalog.reviewedAt));
 const currentYear=Number(today.slice(0,4));
 const selectMonth=(value:string)=>{
  setFilters(current=>({...filtersForMonth(current,value),...(!value&&view!=='events'?{timeline:'all'}:{})}));
  setMonth(value||today.slice(0,7));
 };
 const updateCalendarMonth=(value:string)=>selectMonth(value);
 const resetFilters=(timeline=view!=='events'?'all':filters.month?'upcoming':filters.timeline)=>{setFilters({timeline});setMonth(today.slice(0,7));};
 const exportCalendar=(events:RopeEvent[])=>{const eligible=events.filter(calendarEligible);if(!eligible.length){setToast('所选赛事暂无可导出的已确认赛期');return;}const url=URL.createObjectURL(new Blob([buildICS(eligible)],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='绳历-跳绳赛事.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setToast(`已导出 ${eligible.length} 场赛事，可导入系统日历`);};
 const activeFilter=!!(filters.query||filters.level||filters.province||filters.year||filters.month);
 const noSavedEvents=view==='saved'&&saved.length===0;
 const emptyTitle=noSavedEvents?'把你的目标赛事，放在这里。':view==='saved'?'当前筛选下没有收藏赛事':filters.month?'这个月暂无匹配赛事':'没有找到符合条件的赛事';
 const emptyText=noSavedEvents?'点击书签收藏赛事。':filters.month?'试试其他月份，或查看全部月份。':'试试其他筛选条件。';
 const emptyAction=noSavedEvents?'去探索赛事':view==='saved'?'清除筛选':filters.month?'查看全部月份':'查看全部赛事';
 const resetEmpty=()=>{if(noSavedEvents)navigate('events');else resetFilters(view==='saved'?'all':undefined);};

 return <><header className="site-header"><div className="nav-shell"><button className="brand" onClick={()=>{navigate('events');window.scrollTo({top:0,behavior:'smooth'});}} aria-label="绳历首页"><RopeLogo/><span>绳历<span className="brand-en">ROPE CALENDAR</span></span></button><nav aria-label="主导航"><button className={view==='events'?'active':''} onClick={()=>navigate('events')}>赛事日历</button><button className={view==='documents'?'active':''} onClick={()=>{navigate('documents');setTimeout(scrollToEvents,30);}}>竞赛规程</button></nav><button className={'saved-nav '+(view==='saved'?'active':'')} onClick={()=>{navigate('saved');setTimeout(scrollToEvents,30);}}><Bookmark size={16}/><span>我的备赛</span>{saved.length>0&&<b>{saved.length}</b>}</button></div></header>
 <main className="season-page">
  <section className="season-header page-width" aria-label="赛季导航">
   <div className="season-heading"><div className="season-title"><h1>{view==='documents'?'竞赛规程':view==='saved'?'我的备赛':'跳绳赛历'}</h1><p>{view==='documents'?'按赛期查找竞赛规程。':view==='saved'?'收藏赛事，安排备赛。':'赛期、地点与竞赛规程。'}</p></div><span className="season-years">{currentYear} — {currentYear+1}</span></div>
   <SeasonNavigation today={today} value={filters.month||''} year={filters.year} years={years} onSelect={selectMonth}/>
  </section>

  <section id="event-explorer" className="explorer page-width"><h2 className="sr-only">{view==='documents'?'竞赛规程':view==='saved'?'我的备赛':'赛事日历'}</h2>
   {warning&&<div className="notice warning"><Clock3 size={18}/><p>{warning}</p><button onClick={refresh}>重试</button></div>}
    <div className="filter-panel">
     <div className="filter-controls"><label className="search-field"><Search size={18}/><input value={filters.query||''} onChange={e=>updateFilter('query',e.target.value)} placeholder="搜索赛事、城市或主办单位" aria-label="搜索赛事、城市或主办单位"/>{filters.query&&<button onClick={()=>updateFilter('query','')} aria-label="清空搜索"><X size={15}/></button>}</label><label className="select-field"><span>地区</span><select aria-label="赛事地区" value={filters.province||''} onChange={e=>updateFilter('province',e.target.value)}><option value="">全部地区</option>{provinces.map(value=><option key={value}>{value}</option>)}</select></label><label className="select-field year-field"><span>年份</span><select aria-label="赛事年份" value={filters.year||''} onChange={e=>updateFilter('year',e.target.value)}><option value="">全部年份</option>{years.map(value=><option key={value}>{value}</option>)}</select></label></div>
     <div className="filter-top"><div className="level-tabs" role="group" aria-label="赛事级别">{[['','全部赛事'],['国际','国际赛事'],['全国','全国赛事'],['省级','各省赛事']].map(([value,label])=><button key={value} className={(filters.level||'')===value?'selected':''} onClick={()=>updateFilter('level',value)}>{label}</button>)}</div></div>
    </div>
    <div className="results-bar">
     <div className="timeline-tabs" role="group" aria-label="赛事时间范围">{[['upcoming','即将举行'],['past','历史赛事'],['all','全部记录']].map(([value,label])=><button key={value} className={filters.timeline===value?'selected':''} onClick={()=>updateFilter('timeline',value)}>{label}</button>)}<span className="result-count">{view==='documents'?docs.length+' 份资料':visible.length+' 场赛事'}</span></div>
     <div className="results-tools"><button className="button subtle export-button" aria-label="导出日历" title="导出日历" onClick={()=>exportCalendar(visible)}><CalendarPlus size={16}/><span>导出</span></button>{view!=='documents'&&<div className="view-switch" role="group" aria-label="日历显示方式"><button className={mode==='list'?'selected':''} onClick={()=>setMode('list')} aria-label="列表视图" aria-pressed={mode==='list'}><List size={17}/><span>列表</span></button><button className={mode==='calendar'?'selected':''} onClick={()=>setMode('calendar')} aria-label="月历视图" aria-pressed={mode==='calendar'}><LayoutGrid size={16}/><span>月历</span></button></div>}</div>
    </div>
    {activeFilter&&<div className="active-filters">{filters.month&&<span className="active-month">{Number(filters.month.slice(0,4))}年{Number(filters.month.slice(5,7))}月<button onClick={()=>selectMonth('')} aria-label="清除月份筛选"><X size={12}/></button></span>}<button onClick={()=>resetFilters()}>清除筛选<X size={12}/></button></div>}
    {view==='documents'?(docs.length?<div className="documents-list"><ColumnHead/>{docs.map(({event,document,index})=><article className="regulation-row catalog-grid" key={event.id+'-'+index}><div className="row-main regulation-name"><span className={'file-format '+document.format.toLowerCase()}><FileText size={23}/><small>{document.format}</small></span><div><button className="row-title" onClick={()=>setSelected(event)}>{event.title}</button><p className="row-subtitle">{document.title.replace(/（官方网页存档）$/,'')}</p></div></div><EventDate event={event}/><EventLocation event={event}/><div className="row-actions"><a className="button secondary" href={document.localPath?'.'+document.localPath:document.url} download={!!document.localPath} target={document.localPath?undefined:'_blank'} rel="noreferrer" aria-label={'下载'+document.title}><Download size={16}/><span>下载</span></a></div></article>)}</div>:<EmptyState title="当前筛选下暂无可下载资料" text="试试其他筛选条件。" onReset={()=>resetFilters('all')}/>):mode==='calendar'?<MonthCalendar events={visible} month={month} setMonth={updateCalendarMonth} onSelect={setSelected} today={today}/>:visible.length?<div className="event-list"><ColumnHead/>{groups.map(section=><section className="event-section" key={section.level} aria-label={section.label}>{!filters.level&&<div className="event-section-heading"><h3>{section.label}</h3><span>{section.count} 场</span></div>}{section.months.map(({label,events})=><div className="month-group" key={label}><div className="month-label"><h4>{label}</h4><span>{events.length} 场赛事</span><div/></div>{events.map(event=><EventRow key={event.id} event={event} saved={saved.includes(event.id)} onSave={()=>toggleSave(event)} onSelect={()=>setSelected(event)} today={today}/>)}</div>)}</section>)}</div>:<EmptyState title={emptyTitle} text={emptyText} onReset={resetEmpty} action={emptyAction}/>}

  </section>

 </main>
 <footer className="page-width"><span className="footer-brand">绳历</span><p>更新于 {reviewed}<span aria-hidden="true"> · </span>赛事以官方公告为准<span aria-hidden="true"> · </span><button onClick={()=>setCreditsOpen(true)}>图片来源</button><span aria-hidden="true"> · </span><button onClick={()=>setAnalyticsOpen(true)}>访问统计</button></p><span>© {currentYear} 绳历</span></footer>
 {selected&&<EventDialog key={selected.id} event={selected} saved={saved.includes(selected.id)} onClose={()=>setSelected(null)} onSave={()=>toggleSave(selected)} onExport={()=>exportCalendar([selected])}/>}
 {creditsOpen&&<PhotoCredits onClose={()=>setCreditsOpen(false)}/>}
 {analyticsOpen&&<AnalyticsInfo onClose={()=>setAnalyticsOpen(false)}/>}
 {toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 <span className="sr-only" role="status">{loading?'正在核对最新赛事目录':'赛事目录已载入'}</span>
 </>;
}

function EmptyState({title,text,onReset,action='查看全部记录'}:{title:string;text:string;onReset:()=>void;action?:string}){return <div className="empty-state"><span><CalendarDays size={30}/></span><h3>{title}</h3><p>{text}</p><button className="button secondary" onClick={onReset}>{action}<ArrowRight size={15}/></button></div>;}

function EventRow({event,saved,onSave,onSelect,today}:{event:RopeEvent;saved:boolean;onSave:()=>void;onSelect:()=>void;today:string}) {
 const status=eventStatus(event,today);const docs=event.documents;const first=docs.find(d=>d.kind==='regulation')||docs[0];
 return <article className="competition-row">{event.level!=='省级'&&<EventCover event={event}/>}<div className="competition-info catalog-grid"><div className="row-main"><div className="tags"><span className={'tag '+(event.level==='国际'?'international':'')}>{event.level}</span><span className={'status '+status.tone}><i/>{status.label}</span></div><button className="row-title" onClick={onSelect}>{event.title}</button></div><EventDate event={event}/><EventLocation event={event}/><div className="row-actions">{first?<a href={first.localPath?'.'+first.localPath:first.url} download={!!first.localPath} target={first.localPath?undefined:'_blank'} rel="noreferrer" className="row-download"><Download size={15}/>{first.kind==='regulation'?'规程':first.kind==='handbook'?'手册':'资料'}</a>:<button className="row-details" onClick={onSelect}>查看详情<ChevronRight size={14}/></button>}<button className={'bookmark-button '+(saved?'is-saved':'')} aria-label={(saved?'取消收藏':'收藏')+event.title} aria-pressed={saved} onClick={onSave}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div></div></article>;
}

function ColumnHead(){return <div className="catalog-columns catalog-grid" aria-hidden="true"><span>赛事名称</span><span>时间</span><span>地点</span><span className="column-action">操作</span></div>;}
function EventLocation({event}:{event:RopeEvent}) {
 const place=[event.province,event.city].filter((value,index,all)=>value&&!['境外','全国'].includes(value)&&all.indexOf(value)===index).join(' · ');
 return <div className="row-location"><span className="row-fact-label"><MapPin size={14}/>地点</span><div><strong>{place||'地点待公布'}</strong>{event.venue&&<small>{event.venue}</small>}</div></div>;
}
function EventDate({event}:{event:RopeEvent}) {
 return <div className="row-time"><span className="row-fact-label"><CalendarDays size={14}/>时间</span><div><strong>{dateLabel(event)}</strong>{event.dateStatus==='planned'&&event.startDate&&event.status!=='cancelled'&&!/暂定|计划|待定/.test(dateLabel(event))&&<small className="tentative-date">暂定</small>}{event.registrationDeadline&&event.status!=='cancelled'&&<small>报名截止 {shortDate(event.registrationDeadline)}</small>}</div></div>;
}
