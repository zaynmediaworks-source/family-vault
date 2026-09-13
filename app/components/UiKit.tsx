'use client';
import {ReactNode,useEffect} from 'react';

export function Modal({open,title,children,onClose,footer}:{open:boolean;title:string;children:ReactNode;onClose:()=>void;footer?:ReactNode}){
 useEffect(()=>{if(!open)return;const f=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[open,onClose]);
 if(!open)return null;
 return <div className="fv-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="fv-modal" role="dialog" aria-modal="true" aria-label={title}><header><div><div className="kicker">Family Vault</div><h2>{title}</h2></div><button className="icon" onClick={onClose} aria-label="Tutup">✕</button></header><div className="fv-modal-body">{children}</div>{footer&&<footer>{footer}</footer>}</section></div>
}

export function ConfirmDialog({open,title,message,detail,confirmLabel='Hapus',busy=false,onClose,onConfirm}:{open:boolean;title:string;message:string;detail?:string;confirmLabel?:string;busy?:boolean;onClose:()=>void;onConfirm:()=>void|Promise<void>}){
 const close=()=>{if(!busy)onClose()};
 return <Modal open={open} title={title} onClose={close} footer={<div className="fv-modal-actions"><button className="btn alt" type="button" disabled={busy} onClick={close}>Batal</button><button className="btn fv-danger-btn" type="button" disabled={busy} onClick={onConfirm}>{busy?'Menghapus…':confirmLabel}</button></div>}>
  <div className="fv-confirm">
   <div className="fv-confirm-icon" aria-hidden="true">!</div>
   <div><p>{message}</p>{detail&&<small>{detail}</small>}</div>
  </div>
 </Modal>
}

export function Toast({message,tone='success',onDone}:{message:string;tone?:'success'|'error'|'info';onDone:()=>void}){
 useEffect(()=>{if(!message)return;const t=setTimeout(onDone,3200);return()=>clearTimeout(t)},[message,onDone]);
 if(!message)return null;
 return <div className={`fv-toast ${tone}`} role="status">{message}</div>
}

export function AnnouncementBanner({title,message,onClose}:{title:string;message:string;onClose?:()=>void}){
 return <div className="fv-announcement"><div><div className="kicker">Announcement</div><b>{title}</b><p>{message}</p></div>{onClose&&<button className="icon" onClick={onClose}>✕</button>}</div>
}

export function BarChart({rows}:{rows:{label:string,income:number,expense:number}[]}){
 const max=Math.max(1,...rows.flatMap(r=>[r.income,r.expense]));
 return <div className="fv-chart"><div className="fv-chart-legend"><span><i className="income-dot"/>Income</span><span><i className="expense-dot"/>Expense</span></div><div className="fv-bars">{rows.map(r=><div className="fv-bar-col" key={r.label}><div className="fv-bar-pair"><span className="income-bar" style={{height:`${Math.max(3,r.income/max*150)}px`}} title={String(r.income)}/><span className="expense-bar" style={{height:`${Math.max(3,r.expense/max*150)}px`}} title={String(r.expense)}/></div><small>{r.label}</small></div>)}</div></div>
}

export function LineChart({rows}:{rows:{label:string,value:number}[]}){
 if(!rows.length)return <p className="empty">Belum ada snapshot.</p>;
 const max=Math.max(1,...rows.map(r=>r.value)),min=Math.min(0,...rows.map(r=>r.value)),span=Math.max(1,max-min),w=560,h=170,p=18;
 const pts=rows.map((r,i)=>{const x=rows.length===1?w/2:p+i*(w-p*2)/(rows.length-1);const y=h-p-(r.value-min)/span*(h-p*2);return `${x},${y}`}).join(' ');
 return <div className="fv-line-wrap"><svg viewBox={`0 0 ${w} ${h}`} className="fv-line"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/></svg><div className="fv-line-labels">{rows.map(r=><small key={r.label}>{r.label}</small>)}</div></div>
}
