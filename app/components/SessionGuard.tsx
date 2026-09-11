'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from '@/lib/supabase';

export default function SessionGuard({minutes=60}:{minutes?:number}){
  const router=useRouter();
  useEffect(()=>{
    const key='family-vault:last-activity';
    const max=minutes*60*1000;
    let lastWrite=0;
    const touch=()=>{
      const now=Date.now();
      if(now-lastWrite<15000)return;
      lastWrite=now;
      localStorage.setItem(key,String(now));
    };
    if(!localStorage.getItem(key))touch();
    const events=['pointerdown','keydown','touchstart','scroll'] as const;
    events.forEach(e=>window.addEventListener(e,touch,{passive:true}));
    const timer=window.setInterval(async()=>{
      const last=Number(localStorage.getItem(key)||Date.now());
      if(Date.now()-last>max){
        try{await supabase.rpc('record_security_event',{p_event_type:'session_timeout',p_household_id:null,p_detail:{minutes}})}catch{}
        localStorage.removeItem(key);
        await supabase.auth.signOut();
        router.replace('/login?reason=timeout');
      }
    },30000);
    return()=>{events.forEach(e=>window.removeEventListener(e,touch));window.clearInterval(timer)};
  },[minutes,router]);
  return null;
}
