'use client';

import {useMemo,useState} from 'react';
import {supabase} from '@/lib/supabase';

type R=Record<string,any>;
type Props={houses:R[]};

const PERIODS=[
  {months:1,label:'1 bulan'},
  {months:3,label:'3 bulan'},
  {months:6,label:'6 bulan'},
  {months:12,label:'1 tahun'},
];

const SHEETS:[string,string][]=[
  ['income','Income'],['expenses','Expenses'],['budgets','Budget'],['budget_spends','Budget Spend'],['obligations','Kewajiban'],
  ['etf_assets','ETF Assets'],['etf_transactions','ETF Transaksi'],['gold_assets','Emas Assets'],['gold_transactions','Emas Transaksi'],
  ['dividend_stocks','Saham Dividen'],['dividend_stock_transactions','Transaksi Saham'],['dividends','Dividen'],
  ['savings','Tabungan'],['saving_transactions','Transaksi Tabungan'],['debts','Hutang'],['debt_payments','Pembayaran Hutang'],
  ['receivables','Piutang'],['receivable_payments','Pembayaran Piutang'],['wishlists','Wishlist'],['wishlist_transactions','Wishlist Funding'],
  ['wishlist_parts','Wishlist Parts'],['wishlist_part_transactions','Part Funding'],['recurring_transactions','Otomatis'],
  ['monthly_closings','Monthly Closing'],['portfolio_snapshots','Portfolio Snapshot'],
];

export default function VaultRetentionAdmin({houses}:Props){
  const [hid,setHid]=useState(houses[0]?.id||'');
  const [months,setMonths]=useState(3);
  const [busy,setBusy]=useState<'export'|'reset'|''>('');
  const [message,setMessage]=useState('');
  const [lastExport,setLastExport]=useState('');
  const house=useMemo(()=>houses.find(h=>h.id===hid),[houses,hid]);
  const exportKey=`${hid}:${months}`;

  async function exportExcel(){
    if(!hid)return;
    setBusy('export');setMessage('');
    const {data,error}=await supabase.rpc('admin_export_vault_finance',{p_household_id:hid,p_months:months});
    if(error){setMessage(error.message);setBusy('');return}
    try{
      const blob=buildWorkbook(data as R);
      const safe=(house?.name||'vault').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'');
      const stamp=new Date().toISOString().slice(0,10);
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Family-Vault-${safe}-${months}bulan-${stamp}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
      setLastExport(exportKey);setMessage(`Export Excel selesai. Data yang lebih lama dari ${months===12?'1 tahun':months+' bulan'} sudah dibackup.`);
    }catch(e:any){setMessage(e?.message||'Gagal membuat file Excel.')}
    setBusy('');
  }

  async function resetOldData(){
    if(!hid||!house)return;
    if(lastExport!==exportKey){setMessage('Export Excel dulu untuk Vault dan periode ini sebelum melakukan reset.');return}
    const typed=window.prompt(`RESET DATA LAMA\n\nVault: ${house.name}\nRetensi: simpan ${months===12?'1 tahun':months+' bulan'} terakhir.\nData yang lebih lama akan dibersihkan secara permanen.\n\nKetik nama Vault persis untuk melanjutkan:`,'');
    if(typed!==house.name){setMessage('Reset dibatalkan karena nama Vault tidak cocok.');return}
    if(!window.confirm('Konfirmasi terakhir: data lama akan dihapus permanen dari database setelah saldo penting dipadatkan menjadi saldo awal. Lanjutkan?'))return;
    setBusy('reset');setMessage('');
    const {data,error}=await supabase.rpc('admin_reset_vault_finance',{p_household_id:hid,p_months:months});
    if(error){setMessage(error.message);setBusy('');return}
    const n=Number((data as any)?.rows_deleted||0);
    setLastExport('');setMessage(`Reset selesai. ${n.toLocaleString('id-ID')} baris lama dibersihkan/dipadatkan. Data ${months===12?'1 tahun':months+' bulan'} terakhir tetap disimpan.`);setBusy('');
  }

  return <section className="admin-section vault-retention-admin">
    <div className="admin-title"><div><div className="kicker">Vault Data Retention</div><h2>Export & Reset Keuangan</h2><p className="muted small">Simpan data terbaru, export riwayat lama ke Excel, lalu bersihkan histori lama untuk mengurangi penggunaan database.</p></div><span>Admin only</span></div>
    <div className="admin-card retention-card">
      <div className="retention-grid">
        <label><span>Vault keluarga</span><select value={hid} onChange={e=>{setHid(e.target.value);setLastExport('');setMessage('')}}>{houses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
        <label><span>Retensi data</span><select value={months} onChange={e=>{setMonths(Number(e.target.value));setLastExport('');setMessage('')}}>{PERIODS.map(p=><option key={p.months} value={p.months}>Simpan {p.label} terakhir</option>)}</select></label>
      </div>
      <div className="retention-note"><b>Yang akan terjadi</b><p>Family Vault mempertahankan data {months===12?'1 tahun':months+' bulan'} terakhir. Riwayat yang lebih lama diexport ke Excel dan dapat dibersihkan. Posisi penting seperti saldo tabungan, pembayaran hutang/piutang, investasi, dividen, dan wishlist dipadatkan menjadi saldo awal agar angka berjalan tetap konsisten.</p></div>
      <div className="retention-actions"><button className="btn alt" disabled={!hid||!!busy} onClick={exportExcel}>{busy==='export'?'Membuat Excel…':'Export Excel'}</button><button className="btn danger retention-reset" disabled={!hid||!!busy||lastExport!==exportKey} onClick={resetOldData}>{busy==='reset'?'Mereset…':'Reset Data Lama'}</button></div>
      {lastExport===exportKey&&<div className="retention-ready">✓ Backup periode ini sudah dibuat. Reset sekarang dapat dijalankan.</div>}
      {message&&<p className={message.toLowerCase().includes('gagal')||message.toLowerCase().includes('dibatalkan')?'status error':'status'}>{message}</p>}
      <p className="muted small retention-foot">Reset tidak menghapus akun, Vault, anggota, relationship, atau pengaturan Vault. Fitur ini hanya mengelola data keuangan historis.</p>
    </div>
  </section>
}

function buildWorkbook(payload:R){
  const meta=payload?.meta||{};
  const h=meta.household||{};
  const summaryRows:any[][]=[
    ['FAMILY VAULT — FINANCIAL BACKUP'],
    ['Vault',h.name||h.id||'—'],
    ['Jenis Vault',h.vault_type||'—'],
    ['Retensi',`${meta.months||''} bulan`],
    ['Cutoff',meta.cutoff||'—'],
    ['Diexport',meta.exported_at||new Date().toISOString()],
    [],
    ['Kategori','Jumlah baris'],
    ...SHEETS.map(([key,label])=>[label,Array.isArray(payload[key])?payload[key].length:0]),
  ];
  const sheets:{name:string;rows:any[][]}[]=[{name:'Ringkasan',rows:summaryRows}];
  for(const [key,label] of SHEETS){
    const rows=Array.isArray(payload[key])?payload[key]:[];
    sheets.push({name:label,rows:objectsToRows(rows)});
  }
  return makeXlsx(sheets);
}

function objectsToRows(rows:R[]){
  if(!rows.length)return [['Tidak ada data']];
  const preferred=['happened_at','paid_at','period_start','period_end','snapshot_date','due_date','created_at','ticker','name','source','category','type','amount','units','grams','status','note'];
  const all=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));
  const keys=[...preferred.filter(k=>all.includes(k)),...all.filter(k=>!preferred.includes(k))];
  return [keys.map(pretty),...rows.map(r=>keys.map(k=>normalizeCell(r[k])))];
}
function pretty(s:string){return s.replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function normalizeCell(v:any){if(v===null||v===undefined)return '';if(Array.isArray(v))return v.join(', ');if(typeof v==='object')return JSON.stringify(v);return v}
function xmlEscape(v:any){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function colName(n:number){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function sheetXml(rows:any[][]){
  const body=rows.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>cellXml(v,ri,ci)).join('')}</row>`).join('');
  const maxCols=Math.max(1,...rows.map(r=>r.length));
  const cols=Array.from({length:maxCols},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===0?24:18}" customWidth="1"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${colName(maxCols)}1"/><freezePanes/></worksheet>`;
}
function cellXml(v:any,ri:number,ci:number){
  const ref=`${colName(ci+1)}${ri+1}`;const style=ri===0?2:0;
  if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}" s="${style}" t="n"><v>${v}</v></c>`;
  if(typeof v==='boolean')return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${v?'Ya':'Tidak'}</t></is></c>`;
  const text=xmlEscape(v);return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function makeXlsx(sheets:{name:string;rows:any[][]}[]){
  const safeNames=uniqueSheetNames(sheets.map(s=>s.name));
  const entries:{name:string;data:Uint8Array}[]=[];
  const enc=new TextEncoder();
  const add=(name:string,text:string)=>entries.push({name,data:enc.encode(text)});
  add('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  add('_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safeNames.map((n,i)=>`<sheet name="${xmlEscape(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`);
  add('xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F6F70"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/></cellXfs></styleSheet>`);
  sheets.forEach((s,i)=>add(`xl/worksheets/sheet${i+1}.xml`,sheetXml(s.rows)));
  return new Blob([zipStore(entries)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function uniqueSheetNames(names:string[]){const used=new Set<string>();return names.map(name=>{let base=name.replace(/[\\/*?:\[\]]/g,' ').slice(0,31)||'Sheet';let out=base,n=2;while(used.has(out)){const suf=` ${n++}`;out=base.slice(0,31-suf.length)+suf}used.add(out);return out})}
function zipStore(entries:{name:string;data:Uint8Array}[]){
  const parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
  for(const e of entries){const name=new TextEncoder().encode(e.name);const crc=crc32(e.data);const local=new Uint8Array(30+name.length);const dv=new DataView(local.buffer);dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0,true);dv.setUint16(8,0,true);dv.setUint16(10,0,true);dv.setUint16(12,0,true);dv.setUint32(14,crc,true);dv.setUint32(18,e.data.length,true);dv.setUint32(22,e.data.length,true);dv.setUint16(26,name.length,true);dv.setUint16(28,0,true);local.set(name,30);parts.push(local,e.data);
    const c=new Uint8Array(46+name.length);const cd=new DataView(c.buffer);cd.setUint32(0,0x02014b50,true);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint16(8,0,true);cd.setUint16(10,0,true);cd.setUint16(12,0,true);cd.setUint16(14,0,true);cd.setUint32(16,crc,true);cd.setUint32(20,e.data.length,true);cd.setUint32(24,e.data.length,true);cd.setUint16(28,name.length,true);cd.setUint16(30,0,true);cd.setUint16(32,0,true);cd.setUint16(34,0,true);cd.setUint16(36,0,true);cd.setUint32(38,0,true);cd.setUint32(42,offset,true);c.set(name,46);central.push(c);offset+=local.length+e.data.length;
  }
  const centralSize=central.reduce((s,x)=>s+x.length,0);const end=new Uint8Array(22);const ed=new DataView(end.buffer);ed.setUint32(0,0x06054b50,true);ed.setUint16(4,0,true);ed.setUint16(6,0,true);ed.setUint16(8,entries.length,true);ed.setUint16(10,entries.length,true);ed.setUint32(12,centralSize,true);ed.setUint32(16,offset,true);ed.setUint16(20,0,true);return concat([...parts,...central,end]);
}
function concat(parts:Uint8Array[]){const n=parts.reduce((s,p)=>s+p.length,0);const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function crc32(data:Uint8Array){let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
