'use client';

import {FormEvent,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';

type R=Record<string,any>;

export default function AdminBrandExperiencePanel(){
  const [settings,setSettings]=useState<R|null>(null);
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const [saving,setSaving]=useState(false);

  useEffect(()=>{(async()=>{
    const r=await supabase.from('platform_settings').select('welcome_message,quote_enabled,quote_image_url,quote_text,quote_author,login_quote_text,login_quote_author,login_ticker_enabled,login_ticker_text,dashboard_ticker_enabled,dashboard_ticker_text').eq('id',true).maybeSingle();
    if(r.error)setErr(r.error.message);else setSettings(r.data||{});
  })()},[]);

  async function save(e:FormEvent){
    e.preventDefault();if(!settings)return;setSaving(true);setErr('');setMsg('');
    const {data:u}=await supabase.auth.getUser();
    const r=await supabase.from('platform_settings').update({
      welcome_message:settings.welcome_message||'',
      quote_enabled:settings.quote_enabled!==false,
      quote_image_url:settings.quote_image_url||null,
      quote_text:settings.quote_text||'',
      quote_author:settings.quote_author||'',
      login_quote_text:settings.login_quote_text||'',
      login_quote_author:settings.login_quote_author||'',
      login_ticker_enabled:settings.login_ticker_enabled!==false,
      login_ticker_text:settings.login_ticker_text||'',
      dashboard_ticker_enabled:!!settings.dashboard_ticker_enabled,
      dashboard_ticker_text:settings.dashboard_ticker_text||'',
      updated_by:u.user?.id||null,
      updated_at:new Date().toISOString(),
    }).eq('id',true);
    setSaving(false);
    if(r.error)setErr(r.error.message);else setMsg('Brand experience dashboard dan login berhasil diperbarui.');
  }

  if(!settings)return <section className="admin-section"><div className="admin-card">Memuat pengaturan tampilan…</div></section>;
  return <section className="admin-section fv-admin-brand-section">
    <div className="admin-title"><div><div className="kicker">Brand Experience</div><h2>Dashboard & Login Experience</h2><p className="muted small">Konten global untuk seluruh pengguna Family Vault.</p></div><span>GLOBAL</span></div>
    <form className="admin-card fv-brand-admin-card" onSubmit={save}>
      <div className="kicker">Dashboard</div>
      <div className="admin-form-grid">
        <label className="span2">Pesan sambutan dashboard<textarea value={settings.welcome_message||''} onChange={e=>setSettings({...settings,welcome_message:e.target.value})} placeholder="Kelola hari ini, tumbuhkan masa depan finansial dengan lebih tenang."/></label>
        <label className="span2">URL foto quote<input value={settings.quote_image_url||''} onChange={e=>setSettings({...settings,quote_image_url:e.target.value})} placeholder="https://.../foto.jpg"/></label>
        <label className="span2">Quote dashboard<textarea value={settings.quote_text||''} onChange={e=>setSettings({...settings,quote_text:e.target.value})} placeholder="Tuliskan kutipan..."/></label>
        <label>Penulis / sumber quote<input value={settings.quote_author||''} onChange={e=>setSettings({...settings,quote_author:e.target.value})} placeholder="Family Vault"/></label>
        <label className="fv-admin-toggle"><input type="checkbox" checked={settings.quote_enabled!==false} onChange={e=>setSettings({...settings,quote_enabled:e.target.checked})}/><span><b>Tampilkan foto quote</b><small>Bisa dimatikan tanpa menghapus kontennya.</small></span></label>
      </div>
      {settings.quote_image_url&&<div className="fv-admin-quote-preview" style={{backgroundImage:`linear-gradient(90deg,rgba(8,35,41,.08),rgba(8,35,41,.38)),url("${String(settings.quote_image_url).replace(/"/g,'')}")`}}><span>Preview Quote Image</span></div>}
      <div className="kicker" style={{marginTop:24}}>Dashboard Announcement</div>
      <div className="admin-form-grid">
        <label className="fv-admin-toggle"><input type="checkbox" checked={!!settings.dashboard_ticker_enabled} onChange={e=>setSettings({...settings,dashboard_ticker_enabled:e.target.checked})}/><span><b>Running text dashboard</b><small>Tampilkan pengumuman berjalan di bagian atas Dashboard.</small></span></label>
        <label className="span2">Isi pengumuman / running text<textarea value={settings.dashboard_ticker_text||''} onChange={e=>setSettings({...settings,dashboard_ticker_text:e.target.value})} placeholder="Contoh: Jangan lupa review budget bulanan sebelum tanggal 22."/></label>
      </div>
      <div className="kicker" style={{marginTop:24}}>Login & Signup</div>
      <div className="admin-form-grid">
        <label className="span2">Quote halaman login<textarea value={settings.login_quote_text||''} onChange={e=>setSettings({...settings,login_quote_text:e.target.value})} placeholder="A strong future starts with small, consistent choices today."/></label>
        <label>Penulis quote login<input value={settings.login_quote_author||''} onChange={e=>setSettings({...settings,login_quote_author:e.target.value})} placeholder="Family Vault"/></label>
        <label className="fv-admin-toggle"><input type="checkbox" checked={settings.login_ticker_enabled!==false} onChange={e=>setSettings({...settings,login_ticker_enabled:e.target.checked})}/><span><b>Running text login</b><small>Tampil di bagian atas Login dan Buat Akun.</small></span></label>
        <label className="span2">Isi running text<input value={settings.login_ticker_text||''} onChange={e=>setSettings({...settings,login_ticker_text:e.target.value})} placeholder="Welcome to Family Vault · Grow · Protect · Plan"/></label>
      </div>
      {err&&<p className="status error">{err}</p>}{msg&&<p className="status positive">{msg}</p>}
      <div className="admin-actions"><button className="btn" disabled={saving}>{saving?'Menyimpan…':'Simpan Tampilan Global'}</button></div>
    </form>
  </section>;
}
