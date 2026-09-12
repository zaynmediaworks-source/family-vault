'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';

export default function FeedbackNavLink(){
  const [node,setNode]=useState<HTMLElement|null>(null);

  useEffect(()=>{
    let portal:HTMLElement|null=null;
    const mount=()=>{
      const host=document.querySelector('.refined-sidebar .side-bottom') as HTMLElement|null;
      if(!host)return false;
      let n=document.getElementById('feedback-nav-portal') as HTMLElement|null;
      if(!n){
        n=document.createElement('div');
        n.id='feedback-nav-portal';
        host.insertBefore(n,host.firstChild);
      }
      portal=n;
      setNode(n);
      return true;
    };

    if(mount())return()=>portal?.remove();

    const observer=new MutationObserver(()=>{
      if(mount())observer.disconnect();
    });
    observer.observe(document.body,{childList:true,subtree:true});

    return()=>{
      observer.disconnect();
      portal?.remove();
    };
  },[]);

  return node?createPortal(<Link href="/feedback">💬 Saran &amp; Kritik</Link>,node):null;
}
