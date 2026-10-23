import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { landmarkPhotos } from '@/lib/landmarks';

export default function PhotoCredits({onClose}:{onClose:()=>void}) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const before=document.body.style.overflow;
  ref.current?.showModal();document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=before;};
 },[]);
 return <dialog ref={ref} className="event-dialog photo-credits" aria-labelledby="photo-credits-title" onClose={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}>
  <div className="dialog-content">
   <div className="dialog-top"><h2 id="photo-credits-title">图片来源</h2><button className="icon-button" onClick={onClose} aria-label="关闭图片来源"><X size={21}/></button></div>
   <p className="photo-credit-intro">配图展示举办地或特色场馆，AI 氛围图已标明。图片经过裁切与缩放。</p>
   <ul className="photo-credit-list">{landmarkPhotos.map(photo=><li key={photo.key}>
    <strong>{photo.title}</strong><span>{photo.author}</span>
    <div><a href={photo.sourceUrl} target="_blank" rel="noreferrer">原图<ExternalLink size={12}/></a><a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></div>
   </li>)}</ul>
  </div>
 </dialog>;
}
