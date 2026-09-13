'use client';

import {FormEvent,useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from '@/lib/supabase';
import {DEFAULT_TIMEZONE,todayInTimeZone} from '@/lib/timezone';
import {Modal,Toast} from '@/app/components/UiKit';

type R=Record<string,any>;
type Mode='new'|'edit'|'payment'|'editPayment'|null;
const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const fmt=(d:string)=>d?new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${d}T00:00:00`)):'—';

export default function ReceivableExperience({houses}:{houses:R[]}){
 const[uid,setUid]=useState(''),[hid,setHid]=useState(houses[0]?.id||''),[host,setHost]=useState<HTMLElement|null>(null),[visible,setVisible]=useState(false);
 const[rows,setRows]=useState<R[]>([]),[payments,setPayments]=useState<R[]>([]),[mode,setMode]=useState<Mode>(null),[selected,setSelected]=useState<R|null>(null),[toast,setToast]=useState(''),[tone,setTone]=useState<'success'|'error'|'info'>('success');
 const house=houses.find(h=>h.id===hid)||houses[0],timezone=house?.timezone||DEFAULT_TIMEZONE,today=todayInTimeZone(timezone);

 async function load(id:string){
  if(!id)return;
  const r=await supabase.from('receivables').select('*').eq('household_id',id).is('archived_at',null).order('created_at',{ascending:false});
  if(r.error){setTone('error');setToast(r.error.message);return}
  const rs=r.data||[];setRows(rs);
  if(!rs.length){setPayments([]);return}
  const p=await supabase.from('receivable_payments').select('*').in('receivable_id',rs.map(x=>x.id)).order('paid_at',{ascending:false});
  setPayments(p.data||[]);
 }
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUid(data.user?.id||''))},[]);
 useEffect(()=>{if(houses[0]){setHid(houses[0].id);load(houses[0].id)}},[houses]);
 useEffect(()=>{
  let stopped=false;let timer:any;
  const sync=()=>{
   if(stopped)return;
   const panel=document.querySelector('.wealth-panel') as HTMLElement|null;
   const title=(panel?.querySelector('.investment-overlay-head h1')?.textContent||'').trim();
   const show=!!panel&&title==='Hutang';setVisible(show);
   if(show&&panel){
    let el=document.getElementById('fv-receivable-host') as HTMLElement|null;
    const head=panel.querySelector('.investment-overlay-head');
    if(!el){el=document.createElement('div');el.id='fv-receivable-host';head?.insertAdjacentElement('afterend',el)}
    setHost(el);
    let selectedHouse='';panel.querySelectorAll('select').forEach((s:any)=>{if(houses.some(h=>h.id===s.value))selectedHouse=s.value});
    const next=selectedHouse||houses[0]?.id||'';
    if(next&&next!==hid){setHid(next);load(next)}
   }
  };
  sync();timer=setInterval(sync,600);return()=>{stopped=true;clearInterval(timer);document.getElementById('fv-receivable-host')?.remove()}
 },[houses,hid]);

 const paid=(id:string)=>payments.filter(x=>x.receivable_id===id).reduce((s,x)=>s+Number(x.amount||0),0);
 const active=rows.filter(r=>Math.max(0,Number(r.original_amount||0)-paid(r.id))>0);
 const totalOutstanding=active.reduce((s,r)=>s+Math.max(0,Number(r.original_amount||0)-paid(r.id)),0);
 const overdue=active.filter(r=>r.due_date&&r.due_date<today).length;
 const sorted=useMemo(()=>[...rows].sort((a,b)=>{
  const al=Math.max(0,Number(a.original_amount||0)-payments.filter(x=>x.receivable_id===a.id).reduce((s,x)=>s+Number(x.amount||0),0));
  const bl=Math.max(0,Number(b.original_amount||0)-payments.filter(x=>x.receivable_id===b.id).reduce((s,x)=>s+Number(x.amount||0),0));
  return Number(bl>0)-Number(al>0)||(a.due_date||'9999').localeCompare(b.due_date||'9999');
 }),[rows,payments]);
 async function refresh(msg?:string){await load(hid);window.dispatchEvent(new CustomEvent("fv-finance-changed",{detail:{householdId:hid}}));if(msg){setTone('success');setToast(msg)}}
 async function del(r:R){if(!confirm(`Hapus piutang ${r.borrower_name} beserta seluruh riwayat cicilan dan transaksi Finance terkait?`))return;const q=await supabase.from('receivables').delete().eq('id',r.id);if(q.error){setTone('error');setToast(q.error.message)}else refresh('Piutang dihapus.')}
 async function deletePayment(p:R){if(!confirm('Hapus pembayaran cicilan ini beserta Income terkait?'))return;const q=await supabase.from('receivable_payments').delete().eq('id',p.id);if(q.error){setTone('error');setToast(q.error.message);return}refresh('Pembayaran dihapus.')}

 if(!visible||!host)return <>{mode&&<ReceivableModal mode={mode} row={selected} hid={hid} uid={uid} timezone={timezone} currentPaid={selected?paid(selected.receivable_id||selected.id):0} onClose={()=>{setMode(null);setSelected(null)}} onSaved={async m=>{setMode(null);setSelected(null);await refresh(m)}}/>}<Toast message={toast} tone={tone} onDone={()=>setToast('')}/></>;
 return <>{createPortal(<section className="receivable-section">
   <div className="receivable-head"><div><div className="kicker">UANG YANG DIPINJAMKAN</div><h2>Piutang</h2><p className="muted">Catat siapa yang meminjam, tanggal pemberian, janji pengembalian, cicilan, dan progres pelunasan.</p></div><button className="btn" onClick={()=>{setSelected(null);setMode('new')}}>＋ Tambah Piutang</button></div>
   <div className="receivable-metrics"><div><span>Sisa Piutang</span><b>{rp(totalOutstanding)}</b></div><div><span>Belum Lunas</span><b>{active.length}</b></div><div><span>Lewat Jatuh Tempo</span><b>{overdue}</b></div></div>
   {sorted.length===0?<div className="receivable-empty">Belum ada piutang. Catat uang yang kamu pinjamkan agar progres pengembaliannya tidak terlupakan.</div>:<div className="receivable-grid">{sorted.map(r=>{const pRows=payments.filter(x=>x.receivable_id===r.id),p=paid(r.id),amount=Number(r.original_amount||0),left=Math.max(0,amount-p),pct=amount?Math.min(100,p/amount*100):0,done=left<=0,late=!done&&r.due_date&&r.due_date<today;return <article className={`receivable-card ${done?'is-done':''} ${late?'is-late':''}`} key={r.id}>
    <div className="receivable-card-head"><div><div className="receivable-badges"><span className={`badge ${done?'done':'pending'}`}>{done?'Lunas':'Belum Lunas'}</span>{late&&<span className="receivable-late">Terlambat</span>}<span className="receivable-method">{r.repayment_type==='sekali'?'Sekali Bayar':'Cicilan'}</span></div><h3>{r.borrower_name}</h3><small>{r.purpose||'Tanpa keterangan tujuan'}</small></div><div className="action-row"><button className="icon" onClick={()=>{setSelected(r);setMode('edit')}}>Edit</button><button className="icon danger" onClick={()=>del(r)}>Hapus</button></div></div>
    <div className="receivable-money"><div><span>Sisa</span><strong>{rp(left)}</strong></div><div><span>Piutang awal</span><b>{rp(amount)}</b></div></div>
    <div className="progress receivable-progress"><div style={{width:`${pct}%`}}/></div><div className="receivable-progress-copy"><span>Sudah kembali {rp(p)}</span><b>{pct.toFixed(1)}%</b></div>
    <div className="receivable-details"><div><span>Diberikan</span><b>{fmt(r.lent_at)}</b></div><div><span>Janji kembali</span><b>{fmt(r.due_date)}</b></div>{r.contact&&<div><span>Kontak</span><b>{r.contact}</b></div>}{r.repayment_type==='cicilan'&&(r.planned_installments||r.planned_installment_amount)&&<div><span>Rencana cicilan</span><b>{r.planned_installments?`${r.planned_installments}x`:''}{r.planned_installments&&r.planned_installment_amount?' · ':''}{r.planned_installment_amount?rp(r.planned_installment_amount):''}</b></div>}</div>
    {r.note&&<p className="receivable-note">{r.note}</p>}
    {!done&&<button className="btn receivable-pay-btn" onClick={()=>{setSelected(r);setMode('payment')}}>＋ Catat Pembayaran / Cicilan</button>}
    {pRows.length>0&&<details className="receivable-history"><summary>Riwayat pembayaran ({pRows.length})</summary>{pRows.map(x=><div className="receivable-history-row" key={x.id}><div><b>{rp(x.amount)}</b><span>{fmt(x.paid_at)}{x.note?` · ${x.note}`:''}</span></div><div className="action-row"><button className="icon" onClick={()=>{setSelected({...r,...x,original_amount:r.original_amount,borrower_name:r.borrower_name});setMode('editPayment')}}>Edit</button><button className="icon danger" onClick={()=>deletePayment(x)}>Hapus</button></div></div>)}</details>}
   </article>})}</div>}
   <div className="receivable-divider"><span>Hutang Saya</span><i/></div>
 </section>,host)}
 <ReceivableModal mode={mode} row={selected} hid={hid} uid={uid} timezone={timezone} currentPaid={selected?paid(selected.receivable_id||selected.id):0} onClose={()=>{setMode(null);setSelected(null)}} onSaved={async m=>{setMode(null);setSelected(null);await refresh(m)}}/>
 <Toast message={toast} tone={tone} onDone={()=>setToast('')}/></>;
}

function ReceivableModal({mode,row,hid,uid,timezone,currentPaid,onClose,onSaved}:{mode:Mode;row:R|null;hid:string;uid:string;timezone:string;currentPaid:number;onClose:()=>void;onSaved:(m:string)=>Promise<void>}){
 const requestId=useRef(''),submitting=useRef(false);
 const today=todayInTimeZone(timezone);
 const[borrower,setBorrower]=useState(row?.borrower_name||''),[contact,setContact]=useState(row?.contact||''),[purpose,setPurpose]=useState(row?.purpose||''),[amount,setAmount]=useState(String(row?.original_amount||'')),[lentAt,setLentAt]=useState(row?.lent_at||today),[due,setDue]=useState(row?.due_date||''),[repayment,setRepayment]=useState(row?.repayment_type||'cicilan'),[installments,setInstallments]=useState(String(row?.planned_installments||'')),[installmentAmount,setInstallmentAmount]=useState(String(row?.planned_installment_amount||'')),[note,setNote]=useState(row?.note||'');
 const[payAmount,setPayAmount]=useState(''),[payDate,setPayDate]=useState(today),[payNote,setPayNote]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 useEffect(()=>{requestId.current=crypto.randomUUID()},[mode,row?.id]);
 useEffect(()=>{setBorrower(row?.borrower_name||'');setContact(row?.contact||'');setPurpose(row?.purpose||'');setAmount(String(row?.original_amount||''));setLentAt(row?.lent_at||today);setDue(row?.due_date||'');setRepayment(row?.repayment_type||'cicilan');setInstallments(String(row?.planned_installments||''));setInstallmentAmount(String(row?.planned_installment_amount||''));setNote(row?.note||'');setPayAmount(mode==='editPayment'?String(row?.amount||''):'');setPayDate(mode==='editPayment'?row?.paid_at||today:today);setPayNote(mode==='editPayment'?row?.note||'':'');setErr('')},[mode,row?.id,today]);
 if(!mode)return null;
 async function submit(e:FormEvent){e.preventDefault();if(submitting.current)return;submitting.current=true;setErr('');setBusy(true);try{
  if((mode==='payment'||mode==='editPayment')&&row){const value=Number(payAmount||0),remaining=Math.max(0,Number(row.original_amount||0)-currentPaid+(mode==='editPayment'?Number(row.amount):0));if(value<=0){setErr('Nominal pembayaran harus lebih dari 0.');setBusy(false);return}if(value>remaining){setErr(`Pembayaran melebihi sisa piutang ${rp(remaining)}.`);setBusy(false);return}const payment={amount:value,paid_at:payDate,note:payNote.trim()||null};const q=mode==='editPayment'?await supabase.from('receivable_payments').update(payment).eq('id',row.id):await supabase.from('receivable_payments').upsert({...payment,id:requestId.current,receivable_id:row.id,created_by:uid},{onConflict:'id',ignoreDuplicates:true});if(q.error){setErr(q.error.message);setBusy(false);return}const lunas=currentPaid-(mode==='editPayment'?Number(row.amount):0)+value>=Number(row.original_amount||0);setBusy(false);await onSaved(lunas?'Piutang sudah lunas.':'Pembayaran piutang dicatat.');return}
  const value=Number(amount||0);if(!borrower.trim()||value<=0){setErr('Nama peminjam dan nominal piutang wajib diisi.');setBusy(false);return}if(value<currentPaid){setErr(`Nominal piutang tidak boleh lebih kecil dari total pembayaran yang sudah tercatat (${rp(currentPaid)}).`);setBusy(false);return}
  const payload={household_id:hid,borrower_name:borrower.trim(),contact:contact.trim()||null,purpose:purpose.trim()||null,original_amount:value,lent_at:lentAt,due_date:due||null,repayment_type:repayment,planned_installments:repayment==='cicilan'&&installments?Number(installments):null,planned_installment_amount:repayment==='cicilan'&&installmentAmount?Number(installmentAmount):null,note:note.trim()||null,status:currentPaid>=value?'lunas':'belum',updated_at:new Date().toISOString()};
  const q=mode==='edit'&&row?await supabase.from('receivables').update(payload).eq('id',row.id):await supabase.from('receivables').upsert({...payload,id:requestId.current,created_by:uid},{onConflict:'id',ignoreDuplicates:true});setBusy(false);if(q.error)setErr(q.error.message);else await onSaved(mode==='edit'?'Piutang diperbarui.':'Piutang baru ditambahkan.');
 }catch(error:any){setErr(error.message||'Gagal menyimpan. Silakan coba lagi.')}finally{submitting.current=false;setBusy(false)}
 }
 const title=mode==='new'?'Tambah Piutang':mode==='edit'?`Edit Piutang · ${row?.borrower_name||''}`:`Catat Pembayaran · ${row?.borrower_name||''}`;
 return <Modal open={!!mode} title={title} onClose={()=>{if(!submitting.current)onClose()}}><form className="receivable-form" onSubmit={submit}>{(mode==='payment'||mode==='editPayment')?<>
   <div className="receivable-payment-summary"><span>Sisa piutang</span><strong>{rp(Math.max(0,Number(row?.original_amount||0)-currentPaid+(mode==='editPayment'?Number(row?.amount):0)))}</strong></div>
   <label>Nominal pembayaran<input type="number" min="1" step="1" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="Contoh: 500000" required/></label><label>Tanggal pembayaran<input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)} required/></label><label>Catatan pembayaran<textarea value={payNote} onChange={e=>setPayNote(e.target.value)} placeholder="Transfer / tunai / cicilan ke-2, dll."/></label>
 </>:<>
   <div className="receivable-form-grid"><label>Nama peminjam<input value={borrower} onChange={e=>setBorrower(e.target.value)} placeholder="Nama orang" required/></label><label>Kontak / nomor HP<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Opsional"/></label><label>Nominal piutang<input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} required/></label><label>Tujuan / keperluan<input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Mis. pinjam pribadi, barang, darurat"/></label><label>Tanggal diberikan<input type="date" value={lentAt} onChange={e=>setLentAt(e.target.value)} required/></label><label>Janji pengembalian<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Metode pengembalian<select value={repayment} onChange={e=>setRepayment(e.target.value)}><option value="cicilan">Cicilan</option><option value="sekali">Sekali bayar</option></select></label>{repayment==='cicilan'&&<><label>Rencana jumlah cicilan<input type="number" min="1" step="1" value={installments} onChange={e=>setInstallments(e.target.value)} placeholder="Mis. 4 kali"/></label><label>Target nominal per cicilan<input type="number" min="0" step="1" value={installmentAmount} onChange={e=>setInstallmentAmount(e.target.value)} placeholder="Opsional"/></label></>}</div><label>Catatan<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Kesepakatan, cara bayar, informasi penting lainnya."/></label>
 </>}{err&&<p className="status error">{err}</p>}<div className="action-row receivable-form-actions"><button type="button" className="btn alt" disabled={busy} onClick={onClose}>Batal</button><button className="btn" disabled={busy}>{busy?'Menyimpan…':(mode==='payment'||mode==='editPayment')?'Simpan Pembayaran':'Simpan Piutang'}</button></div></form></Modal>;
}
