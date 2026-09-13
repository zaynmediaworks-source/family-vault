'use client';
import {useEffect} from 'react';

const GLYPHS:Record<string,string>={Dashboard:'▦',Finance:'◫',Investasi:'↗',Tabungan:'●',Hutang:'⚖',Wishlist:'♡',Otomatis:'↻',Arsip:'▣'};
const UTILITY:[string,string,string][]= [
 ['/feedback','Saran & Kritik','✦'],
 ['/family','Pengaturan Vault','⌘'],
 ['/profile','Profil','○'],
 ['/security','Keamanan','◇'],
];

export default function BrandNavEnhancer(){
 useEffect(()=>{
  let stopped=false;
  const apply=()=>{
   if(stopped)return;
   const sidebar=document.querySelector('.refined-sidebar') as HTMLElement|null;
   if(!sidebar){requestAnimationFrame(apply);return}
   const logo=sidebar.querySelector('.logo') as HTMLElement|null;
   if(logo&&!logo.dataset.brandV3){logo.dataset.brandV3='1';logo.textContent='';const mark=document.createElement('span');mark.className='fv-brand-monogram';mark.textContent='FV';const copy=document.createElement('span');copy.className='fv-brand-copy';const title=document.createElement('b');title.textContent='Family Vault';const sub=document.createElement('small');sub.textContent='Financial Archive';copy.append(title,sub);logo.append(mark,copy)}
   sidebar.querySelectorAll('nav button').forEach(btn=>{
    const el=btn as HTMLButtonElement;
    if(el.dataset.brandV3)return;
    const label=(el.textContent||'').trim();
    const glyph=GLYPHS[label];
    if(!glyph)return;
    el.dataset.brandV3='1';
    el.dataset.fvLabel=label;
    el.setAttribute('aria-label',label==='Hutang'?'Hutang Piutang':label);
    el.textContent='';
    const icon=document.createElement('span');
    icon.className='fv-nav-glyph';
    icon.dataset.glyph=glyph;
    icon.setAttribute('aria-hidden','true');
    const text=document.createElement('span');
    text.textContent=label;
    if(label==='Hutang')text.classList.add('fv-hutang-piutang-label');
    el.append(icon,text);
   });
   const bottom=sidebar.querySelector('.side-bottom');
   if(bottom){
    bottom.querySelectorAll('a').forEach(node=>{
      const el=node as HTMLAnchorElement;
      if(el.dataset.brandUtility)return;
      const conf=UTILITY.find(([href])=>el.getAttribute('href')===href);
      if(!conf)return;
      const[,label,glyph]=conf;
      el.dataset.brandUtility='1';
      el.setAttribute('aria-label',label);
      el.textContent='';
      const icon=document.createElement('span');icon.className='fv-utility-glyph';icon.dataset.glyph=glyph;icon.setAttribute('aria-hidden','true');
      const text=document.createElement('span');text.className='fv-utility-label';text.textContent=label;
      el.append(icon,text);
    });
    bottom.querySelectorAll('button').forEach(node=>{
      const el=node as HTMLButtonElement;
      if(el.dataset.brandUtility)return;
      el.dataset.brandUtility='1';
      el.classList.add('fv-utility-logout');
      el.setAttribute('aria-label','Keluar');
      el.textContent='';
      const icon=document.createElement('span');icon.className='fv-utility-glyph';icon.dataset.glyph='↪';icon.setAttribute('aria-hidden','true');
      const text=document.createElement('span');text.className='fv-utility-label';text.textContent='Keluar';
      el.append(icon,text);
    });
   }
  };
  apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});return()=>{stopped=true;observer.disconnect()};
 },[]);
 return null;
}
