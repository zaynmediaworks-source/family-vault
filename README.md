# Family Vault Online v1

Starter project untuk versi online Family Vault dengan:
- Next.js
- Supabase Auth
- Supabase PostgreSQL
- Login / Sign up / Forgot password
- Dashboard awal
- Struktur household bersama pasangan
- Siap deploy ke Vercel

## Supabase
1. Buat / hubungkan project Supabase.
2. Project ini memakai database Family Vault yang sudah tersedia (tabel `income`, `expenses`, `households`, dan `household_members`). Jangan menjalankan ulang schema starter lama.
3. Isi environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

## Local
```bash
npm install
npm run dev
```

## Vercel
Tambahkan environment variables yang sama di Vercel lalu deploy.

Catatan: versi ini adalah fondasi online/auth/database. Modul penuh dari Family Vault v10 (budgeting, ETF, gold, dividend stocks, savings, debt, wishlist parts) akan dipindahkan ke tabel database pada tahap berikutnya.

## Status implementasi
- Login, pendaftaran, halaman reset password, logout, pembuatan keluarga, dan dashboard baca data.
- Form pencatatan transaksi dan undangan pasangan belum diimplementasikan dalam starter ini.
- Database sudah memiliki 19 tabel; dashboard membaca tabel income dan expenses dengan RLS.
- Migrasi `secure-household-onboarding.sql` sudah diterapkan pada database Family Vault. Berkas ini adalah catatan perubahan, bukan schema lengkap. Jangan dijalankan ulang.
- Verifikasi database menggunakan transaksi yang di-rollback: pembuat keluarga menjadi owner, akun lain tidak dapat membaca transaksi atau mendaftarkan diri ke keluarga tersebut.

## Konfigurasi Auth
Di Supabase Auth URL Configuration, set Site URL ke domain production dan izinkan domain tersebut serta `/reset-password`. Pertahankan konfirmasi email. SMTP bawaan Supabase memiliki pembatasan penerima; konfigurasi SMTP sendiri diperlukan untuk pengiriman email umum.

## Build reproducible
Gunakan `pnpm install --frozen-lockfile` lalu `pnpm build`. Versi dependensi dikunci dalam package.json dan pnpm-lock.yaml. `.env.local` tidak boleh di-commit; gunakan publishable key (bukan service-role key) pada variabel publik.
