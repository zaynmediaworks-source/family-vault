'use client';
import {useEffect} from 'react';

const GLYPHS:Record<string,string>={Dashboard:'▦',Finance:'◫',Investasi:'↗',Tabungan:'●',Hutang:'⚖',Wishlist:'♡',Otomatis:'↻',Arsip:'▣'};

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
    el.setAttribute('aria-label',label);
    el.textContent='';
    const icon=document.createElement('span');
    icon.className='fv-nav-glyph';
    icon.dataset.glyph=glyph;
    icon.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.textContent=label;
    el.append(icon,text);
   });
  };
  apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});return()=>{stopped=true;observer.disconnect()};
 },[]);
 return null;
}
