'use client';

import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';

type Tab='hutang'|'piutang';

export default function DebtReceivableTabs(){
  const [host,setHost]=useState<HTMLElement|null>(null);
  const [tab,setTab]=useState<Tab>('hutang');
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    let stopped=false;
    let timer:any;
    const sync=()=>{
      if(stopped)return;
      const panel=document.querySelector('.wealth-panel') as HTMLElement|null;
      const head=panel?.querySelector('.investment-overlay-head') as HTMLElement|null;
      const title=head?.querySelector('h1') as HTMLElement|null;
      const isDebt=(title?.textContent||'').trim()==='Hutang';
      setVisible(isDebt);
      if(!panel||!head||!title||!isDebt){
        document.getElementById('fv-debt-receivable-tabs-host')?.remove();
        setHost(null);
        return;
      }
      title.classList.add('fv-hutang-piutang-heading');
      panel.classList.add('fv-separated-debt-ui');
      let el=document.getElementById('fv-debt-receivable-tabs-host') as HTMLElement|null;
      if(!el){
        el=document.createElement('div');
        el.id='fv-debt-receivable-tabs-host';
        head.insertAdjacentElement('afterend',el);
      }
      setHost(el);
    };
    sync();
    timer=setInterval(sync,350);
    return()=>{
      stopped=true;
      clearInterval(timer);
      document.getElementById('fv-debt-receivable-tabs-host')?.remove();
      const panel=document.querySelector('.wealth-panel') as HTMLElement|null;
      panel?.classList.remove('fv-separated-debt-ui');
      panel?.querySelector('.fv-hutang-piutang-heading')?.classList.remove('fv-hutang-piutang-heading');
    };
  },[]);

  useEffect(()=>{
    if(!visible)return;
    const panel=document.querySelector('.wealth-panel') as HTMLElement|null;
    if(!panel)return;
    const debtCards=Array.from(panel.children).find((el:any)=>el.classList?.contains('cards')) as HTMLElement|undefined;
    if(debtCards)debtCards.style.display=tab==='hutang'?'':'none';
    const receivable=document.getElementById('fv-receivable-host') as HTMLElement|null;
    if(receivable)receivable.style.display=tab==='piutang'?'':'none';
    return()=>{
      if(debtCards)debtCards.style.display='';
      const r=document.getElementById('fv-receivable-host') as HTMLElement|null;
      if(r)r.style.display='';
    };
  },[tab,visible,host]);

  useEffect(()=>{
    if(!visible)return;
    const timer=setInterval(()=>{
      const receivable=document.getElementById('fv-receivable-host') as HTMLElement|null;
      if(receivable)receivable.style.display=tab==='piutang'?'':'none';
    },250);
    return()=>clearInterval(timer);
  },[tab,visible]);

  if(!visible||!host)return null;
  return createPortal(
    <div className="debt-receivable-tabs" role="tablist" aria-label="Hutang dan Piutang">
      <button className={tab==='hutang'?'active':''} role="tab" aria-selected={tab==='hutang'} onClick={()=>setTab('hutang')}>
        <span className="debt-tab-icon">↓</span><span><b>Hutang</b><small>Uang yang harus dibayar</small></span>
      </button>
      <button className={tab==='piutang'?'active':''} role="tab" aria-selected={tab==='piutang'} onClick={()=>setTab('piutang')}>
        <span className="debt-tab-icon">↑</span><span><b>Piutang</b><small>Uang yang harus diterima</small></span>
      </button>
    </div>,host
  );
}
