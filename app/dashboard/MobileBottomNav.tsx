'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {createPortal} from 'react-dom';

const pages=[['Dashboard','▦','Dashboard'],['Finance','◫','Finance'],['Investasi','↗','Investasi'],['Tabungan','●','Tabungan'],['Hutang','⚖','Hutang Piutang'],['Wishlist','♡','Wishlist'],['Otomatis','↻','Otomatis'],['Arsip','▣','Arsip']];
const utilities=[['/feedback','✦','Saran & Kritik'],['/family','⌘','Pengaturan Vault'],['/profile','○','Profil'],['/security','◇','Keamanan']];

export default function MobileBottomNav(){
  const [open,setOpen]=useState(false);
  const [sidebarHidden,setSidebarHidden]=useState(false);
  const [toggleHost,setToggleHost]=useState<HTMLElement|null>(null);
  useEffect(()=>{
    const locate=()=>setToggleHost(document.querySelector<HTMLElement>(sidebarHidden?'.refined-top > div:first-child':'.refined-sidebar'));
    locate();
    const observer=new MutationObserver(locate);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[sidebarHidden]);
  useEffect(()=>{
    document.body.classList.toggle('fv-desktop-sidebar-hidden',sidebarHidden);
    return()=>document.body.classList.remove('fv-desktop-sidebar-hidden');
  },[sidebarHidden]);
  useEffect(()=>{
    const desktop=window.matchMedia('(min-width: 761px)');
    const resize=()=>{if(desktop.matches)setOpen(false)};
    desktop.addEventListener('change',resize);
    return()=>desktop.removeEventListener('change',resize);
  },[]);
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
    {toggleHost&&createPortal(<button className="fv-sidebar-toggle" aria-label={sidebarHidden?'Tampilkan menu':'Sembunyikan menu'} title={sidebarHidden?'Tampilkan menu':'Sembunyikan menu'} aria-expanded={!sidebarHidden} onClick={()=>setSidebarHidden(v=>!v)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={sidebarHidden?'M4 6h16M4 12h16M4 18h16':'m14 6-6 6 6 6'}/></svg></button>,toggleHost)}
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
