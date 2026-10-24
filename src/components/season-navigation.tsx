import { useEffect, useRef, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

type Props = {today:string; value:string; year?:string; years:string[]; onSelect:(month:string)=>void};

function nextMonths(start:string) {
 const [year,month]=start.split('-').map(Number);
 return Array.from({length:4},(_,offset)=>new Date(Date.UTC(year,month-1+offset,1)).toISOString().slice(0,7));
}

export default function SeasonNavigation({today,value,year:filterYear,years,onSelect}:Props) {
 const [pickerOpen,setPickerOpen]=useState(false);
 const currentMonth=today.slice(0,7);
 const currentYear=Number(today.slice(0,4));
 const base=filterYear&&filterYear!==String(currentYear)?`${filterYear}-01`:currentMonth;
 const quickMonths=nextMonths(base);
 const months=value&&!quickMonths.includes(value)?nextMonths(value):quickMonths;
 const pickerYears=[...new Set([...years.map(Number),currentYear,currentYear+1,...(value?[Number(value.slice(0,4))]:[])])].sort((a,b)=>a-b);
 return <>
  <nav className="season-navigation" aria-label="月份导航">
   <div className="season-months">{months.map((month,index)=>{
    const year=Number(month.slice(0,4));
    const number=Number(month.slice(5,7));
    const crossesYear=index>0&&months[index-1].slice(0,4)!==month.slice(0,4);
    const isCurrent=month===currentMonth;
    const highlighted=month===(value||currentMonth);
    return <button key={month} className={'season-month '+(highlighted?'is-highlighted ':'')+(crossesYear?'crosses-year':'')} onClick={()=>onSelect(month)} aria-label={`查看${year}年${number}月赛事`} aria-pressed={value===month} aria-current={isCurrent?'date':undefined}>
     <span className="season-month-year">{index===0?`${year}年`:crossesYear?<span className="mobile-month-year">{year}年</span>:'\u00a0'}</span>
     <strong>{crossesYear&&<span className="full-month-year">{year}年</span>}{number}月</strong>
     <small>{isCurrent?`${Number(today.slice(5,7))}月${Number(today.slice(8,10))}日 · 今天`:'\u00a0'}</small>
    </button>;
   })}</div>
   <button className="all-months-button" onClick={()=>setPickerOpen(true)} aria-haspopup="dialog">全部月份<ChevronRight size={17}/></button>
  </nav>
  {pickerOpen&&<MonthPicker years={pickerYears} value={value} currentMonth={currentMonth} onClose={()=>setPickerOpen(false)} onSelect={month=>{onSelect(month);setPickerOpen(false);}}/>}
 </>;
}

function MonthPicker({years,value,currentMonth,onClose,onSelect}:{years:number[];value:string;currentMonth:string;onClose:()=>void;onSelect:(month:string)=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const overflow=document.body.style.overflow;
  ref.current?.showModal();document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=overflow;};
 },[]);
 return <dialog ref={ref} className="season-picker" aria-labelledby="month-picker-title" onClose={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}>
  <div className="season-picker-top"><h2 id="month-picker-title">选择月份</h2><button className="icon-button" onClick={onClose} aria-label="关闭月份选择"><X size={21}/></button></div>
  <button className={'picker-all '+(!value?'is-selected':'')} onClick={()=>onSelect('')}>全部月份</button>
  {years.map(year=><section className="picker-year" key={year} aria-label={`${year}年`}><h3>{year}年</h3><div className="picker-months">{Array.from({length:12},(_,index)=>{
   const month=`${year}-${String(index+1).padStart(2,'0')}`;
   return <button key={month} className={(value===month?'is-selected ':'')+(month===currentMonth?'is-current':'')} aria-label={`${year}年${index+1}月`} aria-pressed={value===month} onClick={()=>onSelect(month)}>{index+1}月</button>;
  })}</div></section>)}
 </dialog>;
}
