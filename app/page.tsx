'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
      router.replace(recovery ? '/reset-password' : data.session ? '/dashboard' : '/login');
    }).catch(() => router.replace('/login'));
  }, [router]);

  return <main className="center"><div className="card">Loading Family Vault…</div></main>;
}
