'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';

const pages=[['Dashboard','▦','Dashboard'],['Finance','◫','Finance'],['Investasi','↗','Investasi'],['Tabungan','●','Tabungan'],['Hutang','⚖','Hutang Piutang'],['Wishlist','♡','Wishlist'],['Otomatis','↻','Otomatis'],['Arsip','▣','Arsip']];
const utilities=[['/feedback','✦','Saran & Kritik'],['/family','⌘','Pengaturan Vault'],['/profile','○','Profil'],['/security','◇','Keamanan']];

export default function MobileBottomNav(){
  const [open,setOpen]=useState(false);
  const [active,setActive]=useState('Dashboard');
  const launcher=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLDivElement>(null);
  const close=()=>{setOpen(false);launcher.current?.focus()};
  useEffect(()=>{
    document.body.classList.add('fv-compact-navigation');
    const sync=()=>{
      const button=document.querySelector<HTMLElement>('.refined-sidebar nav button.nav-active');
      setActive(button?.dataset.fvLabel||button?.textContent?.trim()||'Dashboard');
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-fv-label']});
    return()=>{observer.disconnect();document.body.classList.remove('fv-compact-navigation')};
  },[]);
  useEffect(()=>{
    if(!open)return;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close()}
      if(event.key==='Tab'){
        const elements=panel.current?.querySelectorAll<HTMLElement>('button,a[href]');
        if(!elements?.length)return;
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }
    };
    document.addEventListener('keydown',keydown);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',keydown)};
  },[open]);
  const go=(label:string)=>{
    close();
    const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('.refined-sidebar nav button'));
    buttons.find(b=>(b.dataset.fvLabel||b.textContent?.trim())===label)?.click();
  };
  return <div className="fv-compact-nav">
    <button ref={launcher} className="fv-menu-launcher" aria-expanded={open} aria-controls="fv-menu-panel" aria-haspopup="dialog" onClick={()=>setOpen(v=>!v)}><span aria-hidden="true">☰</span> Menu</button>
    {open&&<div className="fv-menu-overlay" onClick={event=>{if(event.target===event.currentTarget)close()}}>
      <div ref={panel} id="fv-menu-panel" className="fv-menu-panel" role="dialog" aria-modal="true" aria-labelledby="fv-menu-title">
        <header><div><small>Family Vault</small><h2 id="fv-menu-title">Mau ke mana?</h2></div><button onClick={close} aria-label="Tutup menu">×</button></header>
        <nav aria-label="Navigasi utama" className="fv-menu-grid">{pages.map(([key,icon,label])=><button key={key} aria-current={active===key?'page':undefined} onClick={()=>go(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
        <p className="fv-menu-caption">Akun & Vault</p>
        <nav aria-label="Akun dan vault" className="fv-menu-grid">{utilities.map(([href,icon,label])=><Link key={href} href={href} onClick={close}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
        <button className="fv-menu-logout" onClick={()=>{close();document.querySelector<HTMLButtonElement>('.refined-sidebar .side-bottom button')?.click()}}>↪ Keluar</button>
      </div>
    </div>}
  </div>;
}
