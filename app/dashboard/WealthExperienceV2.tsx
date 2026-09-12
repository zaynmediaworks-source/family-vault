'use client';

import {FormEvent, useEffect, useState} from 'react';
import {supabase} from '@/lib/supabase';
import {Modal, Toast} from '@/app/components/UiKit';

type R = Record<string, any>;
type Action =
  | {kind:'savingFund'|'debtPay'|'wishlistFund'|'partFund'; id:string; title:string}
  | {kind:'editSaving'|'editWishlist'|'editPart'; id:string; title:string}
  | null;

const rp=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const today=()=>new Date().toISOString().slice(0,10);
const sum=(rows:R[])=>rows.reduce((s,x)=>s+Number(x.amount||0),0);

export default function WealthExperienceV2({houses}:{houses:R[]}){
  const [uid,setUid]=useState('');
  const [hid,setHid]=useState(houses[0]?.id||'');
  const [section,setSection]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const [action,setAction]=useState<Action>(null);
  const [savings,setSavings]=useState<R[]>([]);
  const [savingTx,setSavingTx]=useState<R[]>([]);
  const [debts,setDebts]=useState<R[]>([]);
  const [debtPay,setDebtPay]=useState<R[]>([]);
  const [wishes,setWishes]=useState<R[]>([]);
  const [parts,setParts]=useState<R[]>([]);
  const [wishTx,setWishTx]=useState<R[]>([]);
  const [partTx,setPartTx]=useState<R[]>([]);
  const [recurring,setRecurring]=useState<R[]>([]);

  async function child(table:string,col:string,ids:string[]){
    if(!ids.length)return [];
    const r=await supabase.from(table).select('*').in(col,ids).order('created_at',{ascending:false});
    return r.data||[];
  }

  async function load(id:string){
    if(!id)return;
    const q=(t:string)=>supabase.from(t).select('*').eq('household_id',id).is('archived_at',null).order('created_at',{ascending:false});
    const [s,d,w,r]=await Promise.all([q('savings'),q('debts'),q('wishlists'),q('recurring_transactions')]);
    const sv=s.data||[], db=d.data||[], ws=w.data||[];
    setSavings(sv); setDebts(db); setWishes(ws); setRecurring(r.data||[]);
    const ps=await child('wishlist_parts','wishlist_id',ws.map(x=>x.id));
    setParts(ps);
    const [st,dp,wt,pt]=await Promise.all([
      child('saving_transactions','saving_id',sv.map(x=>x.id)),
      child('debt_payments','debt_id',db.map(x=>x.id)),
      child('wishlist_transactions','wishlist_id',ws.map(x=>x.id)),
      child('wishlist_part_transactions','part_id',ps.map(x=>x.id)),
    ]);
    setSavingTx(st); setDebtPay(dp); setWishTx(wt); setPartTx(pt);
  }

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUid(data.user?.id||''));
    if(houses[0]){setHid(houses[0].id);load(houses[0].id)}
  },[houses]);

  useEffect(()=>{
    const click=(e:MouseEvent)=>{
      const btn=(e.target as HTMLElement)?.closest('button');
      if(!btn || !btn.closest('.refined-sidebar'))return;
      const txt=(btn.textContent||'').trim();
      if(['Tabungan','Hutang','Wishlist','Otomatis'].includes(txt)){
        e.preventDefault(); e.stopPropagation(); setSection(txt);
      }
    };
    document.addEventListener('click',click,true);
    return()=>document.removeEventListener('click',click,true);
  },[]);

  async function refresh(msg?:string){await load(hid);if(msg)setToast(msg)}
  async function remove(table:string,id:string,label:string){
    if(!confirm(`Hapus ${label} secara permanen?`))return;
    const r=await supabase.from(table).delete().eq('id',id);
    if(r.error)setToast(r.error.message);else refresh(`${label} dihapus.`);
  }
  async function deleteDebt(d:R){
    if(!confirm(`Hapus hutang ${d.name} beserta riwayat pembayarannya?`))return;
    await supabase.from('debt_payments').delete().eq('debt_id',d.id);
    const r=await supabase.from('debts').delete().eq('id',d.id);
    if(r.error)setToast(r.error.message);else refresh('Hutang dihapus.');
  }
  async function deleteWish(w:R){
    if(!confirm(`Hapus wishlist ${w.name} beserta part dan riwayat dana?`))return;
    const ps=parts.filter(x=>x.wishlist_id===w.id);
    if(ps.length)await supabase.from('wishlist_part_transactions').delete().in('part_id',ps.map(x=>x.id));
    await supabase.from('wishlist_transactions').delete().eq('wishlist_id',w.id);
    await supabase.from('wishlist_parts').delete().eq('wishlist_id',w.id);
    const r=await supabase.from('wishlists').delete().eq('id',w.id);
    if(r.error)setToast(r.error.message);else refresh('Wishlist dihapus.');
  }

  const house=houses.find(x=>x.id===hid);

  return (
    <>
      {section && (
        <div className="wealth-overlay">
          <div className="wealth-panel">
            <header className="investment-overlay-head">
              <div>
                <div className="kicker">Family Vault</div>
                <h1>{section}</h1>
                <p className="muted">{house?.name}</p>
              </div>
              <div className="action-row">
                <select value={hid} onChange={e=>{setHid(e.target.value);load(e.target.value)}}>
                  {houses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button className="btn alt" onClick={()=>setSection(null)}>Tutup</button>
              </div>
            </header>

            {section==='Tabungan' && <Savings savings={savings} tx={savingTx} setAction={setAction} remove={remove}/>} 
            {section==='Hutang' && <Debts debts={debts} payments={debtPay} setAction={setAction} remove={remove} deleteDebt={deleteDebt}/>} 
            {section==='Wishlist' && <Wishlist wishes={wishes} parts={parts} wishTx={wishTx} partTx={partTx} setAction={setAction} remove={remove} deleteWish={deleteWish} refresh={refresh}/>} 
            {section==='Otomatis' && <Recurring rows={recurring} remove={remove} refresh={refresh}/>} 
          </div>
        </div>
      )}

      {action && <ActionModal action={action} uid={uid} savings={savings} wishes={wishes} parts={parts} debts={debts} onClose={()=>setAction(null)} onSaved={async msg=>{setAction(null);await refresh(msg)}}/>}
      <Toast message={toast} tone="success" onDone={()=>setToast('')}/>
    </>
  );
}

function Savings({savings,tx,setAction,remove}:{savings:R[];tx:R[];setAction:(a:Action)=>void;remove:(t:string,id:string,l:string)=>void}){
  return <div className="cards">{savings.map(s=>{
    const rows=tx.filter(x=>x.saving_id===s.id), value=sum(rows), target=Number(s.target||0), pct=target?Math.min(100,value/target*100):0;
    return <article className="card pad" key={s.id}>
      <div className="card-head"><div><h3>{s.name}</h3><small className="muted">{s.location||'—'}</small></div><div className="action-row"><button className="icon" onClick={()=>setAction({kind:'editSaving',id:s.id,title:`Edit ${s.name}`})}>Edit</button><button className="icon danger" onClick={()=>remove('savings',s.id,s.name)}>Hapus</button></div></div>
      <div className="big">{rp(value)}</div><p className="muted">Target {rp(target)} · Sisa {rp(Math.max(0,target-value))} · {pct.toFixed(1)}%</p><div className="progress"><div style={{width:`${pct}%`}}/></div>
      <button className="btn gap-top-sm" onClick={()=>setAction({kind:'savingFund',id:s.id,title:`Tambah dana · ${s.name}`})}>＋ Tambah Dana</button>
      <History rows={rows} remove={x=>remove('saving_transactions',x.id,'transaksi tabungan')}/>
    </article>
  })}</div>;
}

function Debts({debts,payments,setAction,remove,deleteDebt}:{debts:R[];payments:R[];setAction:(a:Action)=>void;remove:(t:string,id:string,l:string)=>void;deleteDebt:(d:R)=>void}){
  return <div className="cards">{debts.map(d=>{
    const rows=payments.filter(x=>x.debt_id===d.id), paid=sum(rows), left=Math.max(0,Number(d.original_amount||0)-paid), pct=Number(d.original_amount)?paid/Number(d.original_amount)*100:0;
    return <article className="card pad" key={d.id}>
      <div className="card-head"><div><h3>{d.name}</h3><small className="muted">{d.source||'—'}</small></div><button className="icon danger" onClick={()=>deleteDebt(d)}>Hapus</button></div>
      <div className="big">{rp(left)}</div><p className="muted">Awal {rp(d.original_amount)} · Terbayar {rp(paid)}</p><div className="progress"><div style={{width:`${Math.min(100,pct)}%`}}/></div>
      <button className="btn gap-top-sm" onClick={()=>setAction({kind:'debtPay',id:d.id,title:`Bayar · ${d.name}`})}>＋ Pembayaran</button>
      <History rows={rows} remove={x=>remove('debt_payments',x.id,'pembayaran hutang')}/>
    </article>
  })}</div>;
}

function Wishlist({wishes,parts,wishTx,partTx,setAction,remove,deleteWish,refresh}:{wishes:R[];parts:R[];wishTx:R[];partTx:R[];setAction:(a:Action)=>void;remove:(t:string,id:string,l:string)=>void;deleteWish:(w:R)=>void;refresh:(m?:string)=>Promise<void>}){
  return <div className="cards">{wishes.map(w=>{
    const ps=parts.filter(x=>x.wishlist_id===w.id), mainRows=wishTx.filter(x=>x.wishlist_id===w.id), mainFund=Number(w.saved||0)+sum(mainRows);
    const partProgress=ps.reduce((n,p)=>{const funded=sum(partTx.filter(x=>x.part_id===p.id));return n+(p.bought?Number(p.price||0):Math.min(Number(p.price||0),funded))},0);
    const target=Number(w.target||0)||ps.reduce((n,p)=>n+Number(p.price||0),0), done=Math.min(target,mainFund+partProgress), pct=target?done/target*100:0, complete=w.status==='completed';
    return <article className={`card goal ${complete?'goal-complete':''}`} key={w.id}>
      {w.image_url?<img className="goal-img" src={w.image_url} alt=""/>:<div className="goal-img placeholder">No image</div>}
      <div className="pad">
        <div className="card-head"><div><span className={`badge ${complete?'done':'pending'}`}>{complete?'Selesai':'Berjalan'}</span><h3>{w.name}</h3><small className="muted">{w.brand||'—'}</small></div><div className="action-row"><button className="icon" onClick={()=>setAction({kind:'editWishlist',id:w.id,title:`Edit ${w.name}`})}>Edit</button><button className="icon danger" onClick={()=>deleteWish(w)}>Hapus</button></div></div>
        <p><b>{rp(done)}</b> / {rp(target)} · {pct.toFixed(1)}%</p><div className="progress"><div style={{width:`${Math.min(100,pct)}%`}}/></div>
        <button className="btn gap-top-sm" onClick={()=>setAction({kind:'wishlistFund',id:w.id,title:`Tambah dana · ${w.name}`})}>＋ Dana Wishlist</button>
        <History rows={mainRows} remove={x=>remove('wishlist_transactions',x.id,'dana wishlist')}/>
        <div className="parts">{ps.map(p=>{
          const rows=partTx.filter(x=>x.part_id===p.id), fund=sum(rows), pp=Number(p.price)?Math.min(100,(p.bought?Number(p.price):fund)/Number(p.price)*100):0;
          return <div className="part-card" key={p.id}>
            <div className="card-head"><label><input type="checkbox" checked={!!p.bought} onChange={async e=>{await supabase.from('wishlist_parts').update({bought:e.target.checked}).eq('id',p.id);await refresh('Status part diperbarui.')}}/><span className={p.bought?'strike':''}><b>{p.name}</b><small>{p.brand||'—'}</small></span></label><div className="action-row"><button className="icon" onClick={()=>setAction({kind:'partFund',id:p.id,title:`Tambah dana · ${p.name}`})}>＋ Dana</button><button className="icon" onClick={()=>setAction({kind:'editPart',id:p.id,title:`Edit ${p.name}`})}>Edit</button><button className="icon danger" onClick={()=>remove('wishlist_parts',p.id,p.name)}>Hapus</button></div></div>
            <p className="muted">Dana {rp(fund)} / {rp(p.price)} · {pp.toFixed(1)}%</p><div className="progress"><div style={{width:`${pp}%`}}/></div>
            <History rows={rows} remove={x=>remove('wishlist_part_transactions',x.id,'dana part')}/>
          </div>
        })}</div>
      </div>
    </article>
  })}</div>;
}

function Recurring({rows,remove,refresh}:{rows:R[];remove:(t:string,id:string,l:string)=>void;refresh:(m?:string)=>Promise<void>}){
  return <div className="cards">{rows.map(x=><article className="card pad" key={x.id}><div className="card-head"><div><span className="badge pending">{x.kind}</span><h3>{x.name}</h3></div><div className="action-row"><button className="icon" onClick={async()=>{await supabase.from('recurring_transactions').update({active:!x.active}).eq('id',x.id);await refresh('Jadwal diperbarui.')}}>{x.active?'Pause':'Aktifkan'}</button><button className="icon danger" onClick={()=>remove('recurring_transactions',x.id,x.name)}>Hapus</button></div></div><div className="big">{rp(x.amount)}</div><p className="muted">{x.frequency} · berikutnya {x.next_run}</p></article>)}</div>;
}

function History({rows,remove}:{rows:R[];remove:(x:R)=>void}){
  return <details className="inv-history"><summary>Riwayat dana ({rows.length})</summary>{rows.length===0?<p className="empty">Belum ada transaksi.</p>:<div className="history-list">{rows.map(x=><div className="history-row" key={x.id}><div><b>{rp(x.amount)}</b><small>{x.happened_at}{x.note?` · ${x.note}`:''}</small></div><button className="icon danger" onClick={()=>remove(x)}>Hapus</button></div>)}</div>}</details>;
}

function ActionModal({action,uid,savings,wishes,parts,debts,onClose,onSaved}:{action:Exclude<Action,null>;uid:string;savings:R[];wishes:R[];parts:R[];debts:R[];onClose:()=>void;onSaved:(m:string)=>void}){
  const entity=[...savings,...wishes,...parts,...debts].find(x=>x.id===action.id);
  const [amount,setAmount]=useState('');
  const [date,setDate]=useState(today());
  const [note,setNote]=useState('');
  const [name,setName]=useState(entity?.name||'');
  const [brand,setBrand]=useState(entity?.brand||'');
  const [target,setTarget]=useState(String(entity?.target??entity?.price??0));
  const [status,setStatus]=useState(entity?.status||'active');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const edit=['editSaving','editWishlist','editPart'].includes(action.kind);

  async function submit(e:FormEvent){
    e.preventDefault(); setBusy(true); setErr(''); let r:any;
    if(action.kind==='savingFund')r=await supabase.from('saving_transactions').insert({saving_id:action.id,amount:Number(amount),happened_at:date,created_by:uid});
    if(action.kind==='debtPay')r=await supabase.from('debt_payments').insert({debt_id:action.id,amount:Number(amount),happened_at:date,created_by:uid});
    if(action.kind==='wishlistFund')r=await supabase.from('wishlist_transactions').insert({wishlist_id:action.id,amount:Number(amount),happened_at:date,note:note||null,created_by:uid});
    if(action.kind==='partFund')r=await supabase.from('wishlist_part_transactions').insert({part_id:action.id,amount:Number(amount),happened_at:date,note:note||null,created_by:uid});
    if(action.kind==='editSaving')r=await supabase.from('savings').update({name:name.trim(),target:Number(target)}).eq('id',action.id);
    if(action.kind==='editWishlist')r=await supabase.from('wishlists').update({name:name.trim(),brand:brand||null,target:Number(target),status}).eq('id',action.id);
    if(action.kind==='editPart')r=await supabase.from('wishlist_parts').update({name:name.trim(),brand:brand||null,price:Number(target)}).eq('id',action.id);
    setBusy(false);
    if(r?.error)setErr(r.error.message);else onSaved('Data berhasil diperbarui.');
  }

  return <Modal open title={action.title} onClose={onClose} footer={<div className="fv-modal-actions"><button className="btn alt" type="button" onClick={onClose}>Batal</button><button className="btn" form="wealth-action-v2" disabled={busy}>{busy?'Menyimpan…':'Simpan'}</button></div>}>
    <form id="wealth-action-v2" className="fv-form-grid" onSubmit={submit}>
      {edit ? <>
        <label>Nama<input value={name} onChange={e=>setName(e.target.value)} required/></label>
        {action.kind!=='editSaving'&&<label>Brand / model<input value={brand} onChange={e=>setBrand(e.target.value)}/></label>}
        <label>{action.kind==='editPart'?'Harga part':'Target'}<input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} required/></label>
        {action.kind==='editWishlist'&&<label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Berjalan</option><option value="completed">Selesai</option></select></label>}
      </> : <>
        <label>Nominal<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} required/></label>
        <label>Tanggal<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
        {(action.kind==='wishlistFund'||action.kind==='partFund')&&<label className="span2">Catatan<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Opsional"/></label>}
      </>}
      {err&&<div className="status error span2">{err}</div>}
    </form>
  </Modal>;
}
