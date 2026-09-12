'use client';

import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from '@/lib/supabase';

type R=Record<string,any>;

export default function BrandExperience(){
  const [node,setNode]=useState<HTMLElement|null>(null);
  const [settings,setSettings]=useState<R|null>(null);
  const [name,setName]=useState('Keluarga');
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    let stopped=false;
    let observer:MutationObserver|null=null;
    const mount=()=>{
      if(stopped)return;
      const content=document.querySelector('.refined-content') as HTMLElement|null;
      const top=document.querySelector('.refined-top') as HTMLElement|null;
      if(!content||!top){requestAnimationFrame(mount);return}
      let host=document.getElementById('fv-brand-experience-host') as HTMLElement|null;
      if(!host){host=document.createElement('div');host.id='fv-brand-experience-host';top.insertAdjacentElement('afterend',host)}
      setNode(host);
      const sync=()=>{
        const kicker=top.querySelector('.kicker')?.textContent?.trim()||'';
        setVisible(kicker==='Dashboard');
      };
      sync();
      observer=new MutationObserver(sync);
      observer.observe(top,{subtree:true,childList:true,characterData:true});
    };
    mount();
    (async()=>{
      const {data:u}=await supabase.auth.getUser();
      if(u.user){
        const [p,s]=await Promise.all([
          supabase.from('profiles').select('display_name,email').eq('id',u.user.id).maybeSingle(),
          supabase.from('platform_settings').select('welcome_message,quote_enabled,quote_image_url,quote_text,quote_author').eq('id',true).maybeSingle(),
        ]);
        if(!stopped){
          const display=p.data?.display_name||p.data?.email?.split('@')[0]||u.user.email?.split('@')[0]||'Keluarga';
          setName(display);
          setSettings(s.data||null);
        }
      }
    })();
    return()=>{stopped=true;observer?.disconnect();const h=document.getElementById('fv-brand-experience-host');h?.remove()};
  },[]);

  if(!node||!visible)return null;
  const msg=settings?.welcome_message||'Kelola hari ini, tumbuhkan masa depan keluarga dengan lebih tenang.';
  const quote=settings?.quote_text||'Kebebasan finansial dibangun dari keputusan kecil yang dilakukan dengan konsisten.';
  const author=settings?.quote_author||'Family Vault';
  const image=settings?.quote_image_url||'';

  return createPortal(<>
    <section className="fv-welcome-hero">
      <div className="fv-welcome-copy">
        <span className="fv-eyebrow">FAMILY FINANCE, BEAUTIFULLY ORGANIZED</span>
        <h2>Selamat datang, <em>{name}</em>.</h2>
        <p>{msg}</p>
        <div className="fv-welcome-signature"><span>Family Vault</span><i>Financial Archive</i></div>
      </div>
      <div className="fv-welcome-orbit" aria-hidden="true">
        <span className="fv-orbit-monogram">FV</span>
        <b>FAMILY VAULT</b>
        <small>Grow · Protect · Plan</small>
      </div>
    </section>
    {settings?.quote_enabled!==false&&<section className="fv-quote-feature">
      <div className="fv-quote-photo" style={image?{backgroundImage:`linear-gradient(90deg,rgba(8,35,41,.15),rgba(8,35,41,.55)),url("${image.replace(/"/g,'')}")`}:undefined}>
        {!image&&<div className="fv-quote-placeholder"><span>✦</span><small>Family moments, future goals.</small></div>}
      </div>
      <blockquote><span className="fv-quote-mark">“</span><p>{quote}</p><footer>— {author}</footer></blockquote>
    </section>}
  </>,node);
}
