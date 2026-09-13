'use client';
import {useEffect,useState} from 'react';

const primary=[['Dashboard','▦'],['Finance','◫'],['Investasi','↗'],['Tabungan','●']];
const more=[['Hutang','⚖','Hutang Piutang'],['Wishlist','♡','Wishlist'],['Otomatis','↻','Otomatis'],['Arsip','▣','Arsip']];
const utilities=[['/feedback','✦','Saran & Kritik'],['/family','⌘','Pengaturan'],['/profile','○','Profil'],['/security','◇','Keamanan']];

export default function MobileBottomNav(){
 const [open,setOpen]=useState(false);
 const [active,setActive]=useState('Dashboard');
 useEffect(()=>{
   const sync=()=>{
     const activeButton=document.querySelector('.refined-sidebar nav button.nav-active') as HTMLElement|null;
     setActive(activeButton?.dataset.fvLabel||(activeButton?.textContent||'').trim()||'Dashboard');
   };
   sync();
   const observer=new MutationObserver(sync);
   observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-fv-label']});
   return()=>observer.disconnect();
 },[]);
 const go=(label:string)=>{
   const buttons=Array.from(document.querySelectorAll('.refined-sidebar nav button')) as HTMLButtonElement[];
   buttons.find(b=>(b.dataset.fvLabel||(b.textContent||'').trim())===label)?.click();
   setOpen(false);
 };
 const utility=(href:string)=>{
   (document.querySelector(`.refined-sidebar .side-bottom a[href="${href}"]`) as HTMLAnchorElement|null)?.click();
   setOpen(false);
 };
 const logout=()=>{
   (document.querySelector('.refined-sidebar .side-bottom button') as HTMLButtonElement|null)?.click();
   setOpen(false);
 };
 return <div className={`fv-mobile-bottom-nav ${open?'is-open':''}`}>
   {open&&<button className="fv-mobile-nav-backdrop" aria-label="Tutup menu" onClick={()=>setOpen(false)}/>} 
   <div className="fv-mobile-nav-sheet" aria-hidden={!open}>
     <div className="fv-mobile-sheet-head"><div><small>Family Vault</small><b>Menu lainnya</b></div><button onClick={()=>setOpen(false)} aria-label="Tutup">×</button></div>
     <div className="fv-mobile-sheet-grid">{more.map(([key,icon,label])=><button key={key} className={active===key?'is-active':''} onClick={()=>go(key)}><span>{icon}</span><b>{label}</b></button>)}</div>
     <div className="fv-mobile-sheet-label">Akun & Vault</div>
     <div className="fv-mobile-sheet-utility">{utilities.map(([href,icon,label])=><button key={href} onClick={()=>utility(href)}><span>{icon}</span><b>{label}</b></button>)}<button className="fv-mobile-logout" onClick={logout}><span>↪</span><b>Keluar</b></button></div>
   </div>
   <nav className="fv-mobile-nav-dock" aria-label="Navigasi utama">
     {primary.map(([label,icon])=><button key={label} className={active===label?'is-active':''} onClick={()=>go(label)}><span>{icon}</span><small>{label}</small></button>)}
     <button className={more.some(([key])=>key===active)||open?'is-active':''} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span>•••</span><small>Lainnya</small></button>
   </nav>
 </div>;
}
