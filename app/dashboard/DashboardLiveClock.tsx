'use client';
import {useEffect,useMemo,useState} from 'react';

type R=Record<string,any>;

export default function DashboardLiveClock({houses}:{houses:R[]}){
 const [hid,setHid]=useState(houses[0]?.id||'');
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{let timer:any;const sync=()=>{let selected='';document.querySelectorAll('select').forEach((el:any)=>{if(houses.some(h=>h.id===el.value))selected=el.value});setHid(selected||houses[0]?.id||'')};sync();timer=setInterval(sync,900);return()=>clearInterval(timer)},[houses]);
 const house=houses.find(h=>h.id===hid)||houses[0];
 const zone=house?.timezone||'Asia/Makassar';
 const time=useMemo(()=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:zone}).format(now),[now,zone]);
 const date=useMemo(()=>new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZone:zone}).format(now),[now,zone]);
 useEffect(()=>{let stopped=false;const mount=()=>{if(stopped)return;const actions=document.querySelector('.refined-top .fv-actions');if(!actions){requestAnimationFrame(mount);return}let host=document.getElementById('fv-live-clock-host');if(!host){host=document.createElement('div');host.id='fv-live-clock-host';actions.insertBefore(host,actions.firstChild)}};mount();return()=>{stopped=true;document.getElementById('fv-live-clock-host')?.remove()}},[]);
 const host=typeof document!=='undefined'?document.getElementById('fv-live-clock-host'):null;
 if(!host)return null;
 const {createPortal}=require('react-dom');
 return createPortal(<div className="fv-live-clock"><div><span>WAKTU HOUSEHOLD</span><strong>{time}</strong></div><small>{date}</small></div>,host);
}
