'use client';
import {useState} from 'react';
import {Modal} from '@/app/components/UiKit';
import {supabase} from '@/lib/supabase';
type R=Record<string,any>;
const labels:Record<string,string>={income:'Income',expenses:'Expenses',budgets:'Budgeting',obligations:'Kewajiban',debts:'Hutang',debt_payments:'Pembayaran Hutang',receivables:'Piutang',receivable_payments:'Pembayaran Piutang',etf_assets:'ETF',etf_transactions:'Transaksi ETF',gold_assets:'Emas',gold_transactions:'Transaksi Emas',dividend_stocks:'Saham',dividend_stock_transactions:'Transaksi Saham',dividends:'Dividen',savings:'Tabungan',saving_transactions:'Transaksi Tabungan',wishlists:'Wishlist',wishlist_parts:'Rincian Wishlist',recurring_transactions:'Otomatis',portfolio_snapshots:'Snapshot',monthly_closings:'Penutupan Periode'};
function cell(v:any){let s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');if(typeof v==='string'&&/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
export default function CsvExport({hid,period,data,summary}:{hid:string;period:string;data:Record<string,R[]>;summary:R}){
const[open,setOpen]=useState(false),[choice,setChoice]=useState('expenses'),[busy,setBusy]=useState(false),[error,setError]=useState('');
async function download(){setBusy(true);setError('');try{
 const groups={...data};
 if(choice==='all'||choice==='receivables'||choice==='receivable_payments'){
 const r=await supabase.from('receivables').select('*').eq('household_id',hid).is('archived_at',null);if(r.error)throw r.error;groups.receivables=r.data||[];
 const ids=groups.receivables.map(x=>x.id);groups.receivable_payments=[];
 if(ids.length){const p=await supabase.from('receivable_payments').select('*').in('receivable_id',ids);if(p.error)throw p.error;groups.receivable_payments=p.data||[];}
 }
 let rows:any[][]=[];
 if(choice==='summary')rows=[['Periode','Indikator','Nilai'],...Object.entries(summary).map(([k,v])=>[period,k,v])];
 else{
 const names=choice==='all'?Object.keys(labels):[choice];
 const fields=Array.from(new Set(names.flatMap(k=>(groups[k]||[]).flatMap(Object.keys))));
 rows=[['Menu',...fields],...names.flatMap(k=>(groups[k]||[]).map(r=>[labels[k],...fields.map(f=>r[f])]))];
 if(rows.length===1)rows.push(['Tidak ada data']);
 }
 const blob=new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='family-vault-'+choice+'-'+period+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setOpen(false);
}catch(e){setError(e instanceof Error?e.message:'Ekspor gagal.')}finally{setBusy(false)}}
return <><button className="btn alt" onClick={()=>setOpen(true)}>Export CSV</button><Modal open={open} title="Export CSV" onClose={()=>{if(!busy)setOpen(false)}}><label>Data yang diekspor<select value={choice} disabled={busy} onChange={e=>setChoice(e.target.value)}><option value="summary">Ringkasan dashboard saja</option><option value="all">Semua menu</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><p>Per menu dan semua menu mencakup data aktif Vault ini sepanjang waktu. Ringkasan mengikuti periode dashboard yang dipilih ({period}). Data arsip tidak disertakan.</p>{error&&<p role="alert">{error}</p>}<button className="btn" disabled={busy} onClick={download}>{busy?'Menyiapkan…':'Unduh CSV'}</button></Modal></>;
}


