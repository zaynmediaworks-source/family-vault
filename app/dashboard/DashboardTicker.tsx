'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';

type Props={enabled?:boolean;text?:string};

export default function DashboardTicker({enabled,text}:Props){
 const [host,setHost]=useState<HTMLElement|null>(null);
 const [visible,setVisible]=useState(true);
 useEffect(()=>{let stopped=false;let observer:MutationObserver|null=null;const mount=()=>{if(stopped)return;const top=document.querySelector('.refined-top') as HTMLElement|null;if(!top){requestAnimationFrame(mount);return}let el=document.getElementById('fv-dashboard-ticker-host') as HTMLElement|null;if(!el){el=document.createElement('div');el.id='fv-dashboard-ticker-host';top.insertAdjacentElement('beforebegin',el)}setHost(el);const sync=()=>setVisible((top.querySelector('.kicker')?.textContent||'').trim()==='Dashboard');sync();observer=new MutationObserver(sync);observer.observe(top,{subtree:true,childList:true,characterData:true})};mount();return()=>{stopped=true;observer?.disconnect();document.getElementById('fv-dashboard-ticker-host')?.remove()}},[]);
 if(!host||!visible||enabled===false||!text?.trim())return null;
 const message=text.trim();
 return createPortal(<div className="fv-dashboard-ticker" role="status" aria-label="Pengumuman Family Vault"><div className="fv-dashboard-ticker-label"><i/>Pengumuman</div><div className="fv-dashboard-ticker-window"><div className="fv-dashboard-ticker-track"><span>{message}</span><span aria-hidden="true">{message}</span></div></div></div>,host);
}
