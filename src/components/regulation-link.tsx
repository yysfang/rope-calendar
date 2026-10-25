import {useEffect,useRef,useState,type AnchorHTMLAttributes,type ReactNode} from 'react';
import {X,Download,Copy,ExternalLink,FileText,Check} from 'lucide-react';
import {type Regulation} from '@/lib/catalog';
import {regulationAccess} from '@/lib/regulation-access';

type Props=Omit<AnchorHTMLAttributes<HTMLAnchorElement>,'href'|'download'|'onClick'> & {document:Regulation;sourceUrl:string;children:ReactNode};

export default function RegulationLink({document:regulation,sourceUrl,children,...props}:Props) {
 const [open,setOpen]=useState(false);
 const access=regulationAccess(regulation,document.baseURI,navigator.userAgent);
 return <><a {...props} href={access.href} download={access.mode==='download'&&access.local?access.filename:undefined} target={!access.local?'_blank':undefined} rel="noreferrer" onClick={event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||access.mode==='download')return;
  event.preventDefault();setOpen(true);
 }}>{children}</a>{open&&<RegulationDialog regulation={regulation} sourceUrl={sourceUrl} access={access} onClose={()=>setOpen(false)}/>}</>;
}

export function RegulationDialog({regulation,sourceUrl,access,onClose}:{regulation:Regulation;sourceUrl:string;access:ReturnType<typeof regulationAccess>;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 const [copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{ref.current?.showModal();const before=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=before;};},[]);
 const copy=async()=>{try{await navigator.clipboard.writeText(access.href);setCopied(true);setCopyFailed(false);}catch{setCopyFailed(true);}};
 return <dialog ref={ref} className="event-dialog regulation-dialog" aria-labelledby="regulation-title" onClose={event=>{event.stopPropagation();onClose();}} onClick={event=>{if(event.target===ref.current)onClose();}}>
  <div className="dialog-content">
   <div className="dialog-top"><span className="eyebrow">{access.mode==='preview'?'规程与通知':'下载文件'}</span><button className="icon-button" onClick={onClose} aria-label="关闭规程窗口"><X size={21}/></button></div>
   <h2 id="regulation-title" className="regulation-title">{regulation.title.replace(/（官方网页存档）$/,'')}</h2>
   {access.mode==='preview'?<><p className="sr-only" role="status">{loaded?'规程已打开':'正在打开规程'}</p><iframe className="regulation-frame" src={access.href} title={regulation.title} sandbox="allow-same-origin" onLoad={()=>setLoaded(true)}/></>:<div className="regulation-file"><FileText size={38}/><span>{regulation.format} 文件</span></div>}
   {access.wechat&&<p className="regulation-help">微信内接收文件可能停在 0B。请复制下载链接，用手机自带浏览器打开并保存；也可点右上角“⋯”，选择“在浏览器打开”后下载。</p>}
   {(copyFailed||access.wechat)&&<label className="copy-fallback"><span>{copyFailed?'请长按或选中链接复制':'下载链接，也可长按复制'}</span><input aria-label="下载链接" readOnly value={access.href} onFocus={event=>event.currentTarget.select()}/></label>}
   <div className="regulation-controls">
    {access.wechat?<button className="button primary" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}<span>{copied?'已复制链接':'复制下载链接'}</span></button>:<a className="button primary" href={access.href} download={access.local?access.filename:undefined} target={!access.local?'_blank':undefined} rel="noreferrer"><Download size={16}/><span>下载网页</span></a>}
    <a className="button secondary" href={sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/><span>官方原文</span></a>
   </div>
  </div>
 </dialog>;
}
