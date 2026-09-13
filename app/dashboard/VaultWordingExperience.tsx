'use client';
import {useEffect} from 'react';
type R=Record<string,any>;
export default function VaultWordingExperience({houses}:{houses:R[]}){
 useEffect(()=>{let stopped=false;let last='';const sync=()=>{if(stopped)return;let selected='';document.querySelectorAll('select').forEach((el:any)=>{if(houses.some(h=>h.id===el.value))selected=el.value});const house=houses.find(h=>h.id===selected)||houses[0];if(!house)return;const type=house.vault_type==='personal'?'personal':'shared';const key=`${house.id}:${type}`;const top=document.querySelector('.refined-top');const active=top?.querySelector('.kicker')?.textContent?.trim()||'';const title=top?.querySelector('h1');if(title&&active==='Dashboard')title.textContent=type==='personal'?'Ringkasan Finansial Pribadi':'Ringkasan Finansial Bersama';const side=document.querySelector('.refined-sidebar .side-muted');if(side)side.textContent=`${house.name} · ${type==='personal'?'Personal Vault':'Shared Vault'}`;
 const vaultSettings=document.querySelector('.refined-sidebar .side-bottom a[href="/family"]') as HTMLAnchorElement|null;
 if(vaultSettings){
  vaultSettings.setAttribute('aria-label','Pengaturan');
  if(!vaultSettings.dataset.vaultUtilityStyled){
   vaultSettings.dataset.vaultUtilityStyled='1';
   vaultSettings.textContent='';
   const icon=document.createElement('span');icon.className='fv-nav-glyph fv-utility-glyph';icon.dataset.glyph='⚙';icon.setAttribute('aria-hidden','true');
   const text=document.createElement('span');text.className='fv-utility-label';text.textContent='Pengaturan';
   vaultSettings.append(icon,text);
  }else{
   const text=vaultSettings.querySelector('.fv-utility-label');if(text)text.textContent='Pengaturan';
  }
 }
 if(last!==key){document.documentElement.dataset.vaultType=type;last=key}}
 sync();const timer=setInterval(sync,700);return()=>{stopped=true;clearInterval(timer);delete document.documentElement.dataset.vaultType}},[houses]);
 return null;
}
