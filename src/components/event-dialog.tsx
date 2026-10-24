'use client';
import { useEffect, useRef } from 'react';
import { X, CalendarDays, MapPin, Users, Download, ExternalLink, Bookmark, CalendarPlus, FileText, Info } from 'lucide-react';
import { type RopeEvent, dateLabel, eventStatus, calendarEligible } from '@/lib/catalog';
import {analytics} from '@/lib/browser-analytics';

export default function EventDialog({event,saved,onClose,onSave,onExport}:{event:RopeEvent;saved:boolean;onClose:()=>void;onSave:()=>void;onExport:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;};},[]);
  const status=eventStatus(event);
  return <dialog ref={ref} className="event-dialog" aria-labelledby="event-title" onClose={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <div className="dialog-content">
      <div className="dialog-top"><span className="eyebrow">赛事详情</span><button className="icon-button" onClick={onClose} aria-label="关闭赛事详情"><X size={21}/></button></div>
      <div className="tags"><span className={'tag '+(event.level==='国际'?'international':'')}>{event.level==='省级'?event.province:event.level}赛事</span><span className={'status '+status.tone}><i/>{status.label}</span></div>
      <h2 id="event-title">{event.title}</h2>
      <p className="dialog-summary">{event.summary}</p>
      <div className="detail-facts">
        <div><CalendarDays/><span>{event.scheduleType==='event-period'?'赛会时间':'比赛日期'}<strong>{dateLabel(event)}</strong></span></div>
        <div><MapPin/><span>比赛地点<strong>{[event.province,event.city,event.venue].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ')||'待公布'}</strong></span></div>
        <div><Users/><span>主办单位<strong>{event.organizer||'待公布'}</strong></span></div>
        <div><CalendarDays/><span>报名截止<strong>{event.registrationDeadline?event.registrationDeadline.replaceAll('-',' / '):'待公布'}</strong></span></div>
      </div>
      {event.scheduleNote&&<div className="notice"><Info size={17}/><p>{event.scheduleNote}</p></div>}
      <div className="detail-section"><h3>参赛对象与组别</h3><p>{event.eligibility||'请以官方竞赛规程为准。'}</p></div>
      <div className="detail-section"><h3>竞赛规程与资料 <span>{event.documents.length} 份</span></h3>
        {event.documents.length?event.documents.map((doc,i)=><a className="document-download" href={doc.localPath?'.'+doc.localPath:doc.url} key={i} onClick={()=>analytics.download(event,doc)} download={!!doc.localPath} target={doc.localPath?undefined:'_blank'} rel="noreferrer"><span className="file-icon"><FileText size={20}/></span><span><strong>{doc.title.replace(/（官方网页存档）$/,'')}</strong><small>{doc.format}{doc.format==='HTML'?' · 网页存档':''}{doc.note&&doc.format!=='HTML'?' · '+doc.note:''}</small></span><Download size={19}/></a>):<div className="no-document"><FileText size={22}/><p>暂无可下载规程</p></div>}
      </div>
      <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="source-link">官方来源：{event.sourceName}<ExternalLink size={14}/></a>
      <div className="dialog-actions"><button className={saved?'button primary':'button secondary'} onClick={onSave}><Bookmark size={17} fill={saved?'currentColor':'none'}/>{saved?'已加入我的备赛':'加入我的备赛'}</button><button className="button secondary" disabled={!calendarEligible(event)} onClick={onExport}><CalendarPlus size={17}/>添加到日历</button></div>
      {!calendarEligible(event)&&<p className="small-note">{event.status==='cancelled'?'赛事已取消，无法添加日历。':event.status==='postponed'?'赛事已延期，暂不可添加日历。':'赛期待确认，暂不可添加日历。'}</p>}
    </div>
  </dialog>;
}
