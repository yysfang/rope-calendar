'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type RopeEvent, calendarEligible, eventsOnDate, eventStatus, dateLabel } from '@/lib/catalog';

export default function MonthCalendar({events,month,setMonth,onSelect,today}:{events:RopeEvent[];month:string;setMonth:(month:string)=>void;onSelect:(event:RopeEvent)=>void;today:string}) {
 const [year,number]=month.split('-').map(Number);const first=new Date(Date.UTC(year,number-1,1));
 const offset=(first.getUTCDay()+6)%7;const days=new Date(Date.UTC(year,number,0)).getUTCDate();
 const move=(step:number)=>{const date=new Date(Date.UTC(year,number-1+step,1));setMonth(date.toISOString().slice(0,7));};
 const unknown=events.filter(e=>!calendarEligible(e)&&e.status!=='cancelled');
 return <div className="month-calendar"><div className="calendar-heading"><h3>{year}年 <strong>{number}月</strong></h3><div><button className="icon-button" onClick={()=>move(-1)} aria-label="上一个月"><ChevronLeft size={19}/></button><button className="calendar-today" onClick={()=>setMonth(today.slice(0,7))}>今天</button><button className="icon-button" onClick={()=>move(1)} aria-label="下一个月"><ChevronRight size={19}/></button></div></div>
  <div className="calendar-grid" role="grid" aria-label={`${year}年${number}月赛事日历`}>{['一','二','三','四','五','六','日'].map(d=><div className="weekday" key={d}>周{d}</div>)}
  {Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{const day=i-offset+1;if(day<1||day>days)return <div className="day-cell outside" key={i}/>;const date=`${month}-${String(day).padStart(2,'0')}`;const matches=eventsOnDate(events,date);
    return <div className={'day-cell '+(date===today?'is-today':'')} key={i} role="gridcell"><span className="day-number">{day}</span>{matches.map(event=><button key={event.id} className={'calendar-event '+(event.level==='国际'?'international':event.level==='省级'?'provincial':'' )} onClick={()=>onSelect(event)} title={`${event.title} · ${event.scheduleType==='event-period'?'赛会时间 · ':''}${dateLabel(event)}`}><span className="event-dot"/>{event.scheduleType==='event-period'?'赛会 · ':''}{event.title}</button>)}</div>;
  })}</div>
  <div className="calendar-legend"><span><i className="legend-dot international"/>国际赛事</span><span><i className="legend-dot"/>全国赛事</span><span><i className="legend-dot provincial"/>各省赛事</span></div>
  {unknown.length>0&&<div className="undated-events"><h4>赛期待确认</h4>{unknown.map(e=><button key={e.id} onClick={()=>onSelect(e)}><span>{e.title}<small>{eventStatus(e,today).label} · {dateLabel(e)}</small></span><span>查看详情 →</span></button>)}</div>}
 </div>;
}
