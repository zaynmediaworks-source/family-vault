'use client';
import {useEffect} from 'react';
import {BRAND_MARK,NAV_ICONS} from './BrandAssets';

export default function BrandNavEnhancer(){
 useEffect(()=>{
  let stopped=false;
  const apply=()=>{
   if(stopped)return;
   const sidebar=document.querySelector('.refined-sidebar') as HTMLElement|null;
   if(!sidebar){requestAnimationFrame(apply);return}
   const logo=sidebar.querySelector('.logo') as HTMLElement|null;
   if(logo&&!logo.dataset.branded){
    logo.dataset.branded='1';
    logo.innerHTML='';
    const img=document.createElement('img');img.src=BRAND_MARK;img.alt='Family Vault';img.className='fv-brand-mark';
    const text=document.createElement('span');text.className='fv-brand-copy';text.innerHTML='<b>Family Vault</b><small>Financial Archive</small>';
    logo.append(img,text);
   }
   sidebar.querySelectorAll('nav button').forEach(btn=>{
    const el=btn as HTMLButtonElement;
    const label=(el.textContent||'').trim();
    const src=NAV_ICONS[label];
    if(!src||el.dataset.iconized)return;
    el.dataset.iconized='1';
    const img=document.createElement('img');img.src=src;img.alt='';img.className='fv-nav-icon';
    const span=document.createElement('span');span.textContent=label;
    el.textContent='';el.append(img,span);
   });
  };
  apply();
  const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});
  return()=>{stopped=true;observer.disconnect()}
 },[]);
 return null;
}
