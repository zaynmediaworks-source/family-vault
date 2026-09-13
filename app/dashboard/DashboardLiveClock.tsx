'use client';
import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';

type R=Record<string,any>;

export default function DashboardLiveClock({houses}:{houses:R[]}){
 const [hid,setHid]=useState(houses[0]?.id||'');
 const [now,setNow]=useState(()=>new Date());
 const [host,setHost]=useState<HTMLElement|null>(null);
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{let timer:any;const sync=()=>{let selected='';document.querySelectorAll('select').forEach((el:any)=>{if(houses.some(h=>h.id===el.value))selected=el.value});setHid(selected||houses[0]?.id||'');const kicker=(document.querySelector('.refined-top .kicker')?.textContent||'').trim();setVisible(kicker==='Dashboard')};sync();timer=setInterval(sync,700);return()=>clearInterval(timer)},[houses]);
 const house=houses.find(h=>h.id===hid)||houses[0];
 const zone=house?.timezone||'Asia/Makassar';
 const personal=house?.vault_type==='personal';
 const time=useMemo(()=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:zone}).format(now),[now,zone]);
 const date=useMemo(()=>new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZone:zone}).format(now),[now,zone]);
 useEffect(()=>{let stopped=false;const mount=()=>{if(stopped)return;const actions=document.querySelector('.refined-top .fv-actions');if(!actions){requestAnimationFrame(mount);return}let el=document.getElementById('fv-live-clock-host') as HTMLElement|null;if(!el){el=document.createElement('div');el.id='fv-live-clock-host';actions.insertBefore(el,actions.firstChild)}setHost(el)};mount();return()=>{stopped=true;document.getElementById('fv-live-clock-host')?.remove()}},[]);
 if(!host||!visible)return null;
 return createPortal(<div className="fv-live-clock"><div><span>{personal?'PERSONAL VAULT':'SHARED VAULT'}</span><strong>{time}</strong></div><small>{date}</small></div>,host);
}
