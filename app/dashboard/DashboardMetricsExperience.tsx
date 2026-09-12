'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from '@/lib/supabase';

type R=Record<string,any>;
const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const sum=(a:R[],field='amount')=>a.reduce((s,x)=>s+Number(x[field]||0),0);
const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function periodBounds(startDay:number){
  const now=new Date();
  const safeDay=Math.min(Math.max(startDay||22,1),31);
  const day=Math.min(safeDay,new Date(now.getFullYear(),now.getMonth()+1,0).getDate());
  let start=new Date(now.getFullYear(),now.getMonth(),day);
  if(now<start){
    const pm=new Date(now.getFullYear(),now.getMonth()-1,1);
    start=new Date(pm.getFullYear(),pm.getMonth(),Math.min(safeDay,new Date(pm.getFullYear(),pm.getMonth()+1,0).getDate()));
  }
  const nm=new Date(start.getFullYear(),start.getMonth()+1,1);
  const next=new Date(nm.getFullYear(),nm.getMonth(),Math.min(safeDay,new Date(nm.getFullYear(),nm.getMonth()+1,0).getDate()));
  const last=new Date(next);last.setDate(last.getDate()-1);
  return{start:iso(start),end:iso(next),last:iso(last)};
}

export default function DashboardMetricsExperience(){
  const[node,setNode]=useState<HTMLElement|null>(null);
  const[visible,setVisible]=useState(false);
  const[hid,setHid]=useState('');
  const[house,setHouse]=useState<R|null>(null);
  const[income,setIncome]=useState<R[]>([]),[expenses,setExpenses]=useState<R[]>([]),[obligations,setObligations]=useState<R[]>([]),[debts,setDebts]=useState<R[]>([]),[debtPay,setDebtPay]=useState<R[]>([]),[savings,setSavings]=useState<R[]>([]),[savingTx,setSavingTx]=useState<R[]>([]);

  useEffect(()=>{
    let stopped=false;let observer:MutationObserver|null=null;let timer:any;
    const mount=()=>{
      if(stopped)return;
      const top=document.querySelector('.refined-top') as HTMLElement|null;
      const brand=document.getElementById('fv-brand-experience-host');
      if(!top||!brand){requestAnimationFrame(mount);return}
      let host=document.getElementById('fv-dashboard-metrics-host') as HTMLElement|null;
      if(!host){host=document.createElement('div');host.id='fv-dashboard-metrics-host';brand.insertAdjacentElement('afterend',host)}
      setNode(host);
      const sync=()=>setVisible((top.querySelector('.kicker')?.textContent||'').trim()==='Dashboard');
      sync();observer=new MutationObserver(sync);observer.observe(top,{subtree:true,childList:true,characterData:true});
      const detect=async()=>{
        const {data:h}=await supabase.from('households').select('id,name,period_start_day,status,created_at').eq('status','active').order('created_at');
        if(stopped)return;
        const houses=h||[];
        let selected='';
        document.querySelectorAll('select').forEach((el:any)=>{if(houses.some((x:R)=>x.id===el.value))selected=el.value});
        const chosen=houses.find((x:R)=>x.id===selected)||houses[0];
        if(chosen&&chosen.id!==hid){setHouse(chosen);setHid(chosen.id)}
      };
      detect();timer=setInterval(detect,1200);
    };
    mount();return()=>{stopped=true;observer?.disconnect();if(timer)clearInterval(timer);document.getElementById('fv-dashboard-metrics-host')?.remove()};
  },[hid]);

  useEffect(()=>{if(!hid)return;(async()=>{
    const tables=await Promise.all([
      supabase.from('income').select('amount,happened_at').eq('household_id',hid).is('archived_at',null),
      supabase.from('expenses').select('amount,happened_at').eq('household_id',hid).is('archived_at',null),
      supabase.from('obligations').select('amount,due_date,status').eq('household_id',hid).is('archived_at',null),
      supabase.from('debts').select('id,original_amount').eq('household_id',hid).is('archived_at',null),
      supabase.from('savings').select('id').eq('household_id',hid).is('archived_at',null),
    ]);
    setIncome(tables[0].data||[]);setExpenses(tables[1].data||[]);setObligations(tables[2].data||[]);setDebts(tables[3].data||[]);setSavings(tables[4].data||[]);
    const debtIds=(tables[3].data||[]).map((x:R)=>x.id),savingIds=(tables[4].data||[]).map((x:R)=>x.id);
    const [dp,st]=await Promise.all([
      debtIds.length?supabase.from('debt_payments').select('debt_id,amount').in('debt_id',debtIds):Promise.resolve({data:[] as R[]}),
      savingIds.length?supabase.from('saving_transactions').select('saving_id,amount').in('saving_id',savingIds):Promise.resolve({data:[] as R[]}),
    ] as any);
    setDebtPay((dp as any).data||[]);setSavingTx((st as any).data||[]);
  })()},[hid]);

  const m=useMemo(()=>{
    const b=periodBounds(Number(house?.period_start_day||22));
    const ins=(d:string)=>!!d&&d>=b.start&&d<b.end;
    const ti=sum(income.filter(x=>ins(x.happened_at))),te=sum(expenses.filter(x=>ins(x.happened_at))),left=ti-te;
    const obligation=obligations.filter(x=>ins(x.due_date)&&x.status!=='sudah').reduce((s,x)=>s+Number(x.amount||0),0);
    const debt=debts.reduce((s,d)=>s+Math.max(0,Number(d.original_amount||0)-sum(debtPay.filter(x=>x.debt_id===d.id))),0);
    const saved=sum(savingTx);
    return{...b,ti,te,left,obligation,debt,saved};
  },[house,income,expenses,obligations,debts,debtPay,savingTx]);

  if(!node||!visible||!hid)return null;
  return createPortal(<section className="fv-dashboard-summary">
    <div className="fv-summary-head"><div><span className="fv-eyebrow">RINGKASAN PERIODE</span><h2>Keuangan keluarga dalam satu pandangan.</h2></div><span>{new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(m.start+'T00:00:00'))} — {new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(m.last+'T00:00:00'))}</span></div>
    <div className="fv-summary-grid">
      <article className="fv-summary-card income"><span>Income</span><strong>{rp(m.ti)}</strong><small>Pemasukan periode ini</small></article>
      <article className="fv-summary-card expense"><span>Expenses</span><strong>{rp(m.te)}</strong><small>Pengeluaran periode ini</small></article>
      <article className={`fv-summary-card leftover ${m.left<0?'negative':''}`}><span>Leftover</span><strong>{rp(m.left)}</strong><small>Sisa cashflow</small></article>
      <article className="fv-summary-card obligation"><span>Kewajiban</span><strong>{rp(m.obligation)}</strong><small>Belum selesai periode ini</small></article>
      <article className="fv-summary-card saving"><span>Tabungan</span><strong>{rp(m.saved)}</strong><small>Total dana tersimpan</small></article>
      <article className="fv-summary-card debt"><span>Sisa Hutang</span><strong>{rp(m.debt)}</strong><small>Outstanding saat ini</small></article>
    </div>
  </section>,node);
}
