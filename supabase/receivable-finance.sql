-- Atomic receivable cashflow integration. Reverse unique foreign keys provide
-- one Expense per receivable and one Income per payment, including cascade delete.
begin;
alter table public.expenses add column receivable_id uuid unique references public.receivables(id) on delete cascade;
alter table public.income add column receivable_payment_id uuid unique references public.receivable_payments(id) on delete cascade;

-- Backfill existing records once, preserving their original dates and households.
insert into public.expenses(household_id,name,category,amount,happened_at,note,created_by,archived_at,tags,receivable_id)
select r.household_id,'Piutang ke '||r.borrower_name,'Piutang Diberikan',r.original_amount,r.lent_at,
 concat_ws(E'\n',r.purpose,r.note),coalesce(r.created_by,h.created_by),r.archived_at,array['Piutang Diberikan'],r.id
from public.receivables r join public.households h on h.id=r.household_id;
insert into public.income(household_id,source,amount,happened_at,note,created_by,archived_at,tags,receivable_payment_id)
select r.household_id,'Pembayaran Piutang - '||r.borrower_name,p.amount,p.paid_at,p.note,
 coalesce(p.created_by,r.created_by,h.created_by),r.archived_at,array['Pembayaran Piutang'],p.id
from public.receivable_payments p join public.receivables r on r.id=p.receivable_id join public.households h on h.id=r.household_id;

-- Definer is necessary to sync a household member's edit without changing the
-- original Finance creator (existing Finance RLS requires created_by=auth.uid()).
-- These private trigger functions cannot be invoked as RPCs; membership is checked.
create function private.receivable_finance_sync() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_household_member(new.household_id) then
  raise exception 'Akses vault ditolak' using errcode='42501';
 end if;
 if tg_op='UPDATE' and (new.household_id<>old.household_id or new.id<>old.id) then
  raise exception 'Piutang tidak dapat dipindahkan ke vault lain';
 end if;
 if new.original_amount < (select coalesce(sum(amount),0) from public.receivable_payments where receivable_id=new.id) then
  raise exception 'Nominal piutang lebih kecil dari total pembayaran';
 end if;
 insert into public.expenses(household_id,name,category,amount,happened_at,note,created_by,archived_at,tags,receivable_id)
 values(new.household_id,'Piutang ke '||new.borrower_name,'Piutang Diberikan',new.original_amount,new.lent_at,
 concat_ws(E'\n',new.purpose,new.note),auth.uid(),new.archived_at,array['Piutang Diberikan'],new.id)
 on conflict(receivable_id) do update set name=excluded.name,category=excluded.category,amount=excluded.amount,
 happened_at=excluded.happened_at,note=excluded.note,archived_at=excluded.archived_at,tags=excluded.tags;
 update public.income i set source='Pembayaran Piutang - '||new.borrower_name,archived_at=new.archived_at
 from public.receivable_payments p where p.id=i.receivable_payment_id and p.receivable_id=new.id;
 return new;
end $$;

create function private.receivable_payment_validate() returns trigger
language plpgsql security invoker set search_path='' as $$
declare r public.receivables; total numeric;
begin
 if tg_op='UPDATE' and (new.receivable_id<>old.receivable_id or new.id<>old.id) then
  raise exception 'Pembayaran tidak dapat dipindahkan ke piutang lain';
 end if;
 select * into r from public.receivables where id=new.receivable_id for update;
 if r.id is null or auth.uid() is null then
  raise exception 'Akses vault ditolak' using errcode='42501';
 end if;
 if r.archived_at is not null then raise exception 'Piutang sudah diarsipkan'; end if;
 select coalesce(sum(amount),0) into total from public.receivable_payments where receivable_id=r.id and id<>new.id;
 if total+new.amount>r.original_amount then raise exception 'Pembayaran melebihi sisa piutang'; end if;
 return new;
end $$;

create function private.receivable_payment_finance_sync() returns trigger
language plpgsql security definer set search_path='' as $$
declare r public.receivables; rid uuid;
begin
 rid:=case when tg_op='DELETE' then old.receivable_id else new.receivable_id end;
 select * into r from public.receivables where id=rid for update;
 -- A parent deletion already cascades to both payment and Finance rows.
 if r.id is null and tg_op='DELETE' then return old; end if;
 if auth.uid() is null or not private.is_household_member(r.household_id) then
  raise exception 'Akses vault ditolak' using errcode='42501';
 end if;
 if tg_op<>'DELETE' then
  insert into public.income(household_id,source,amount,happened_at,note,created_by,archived_at,tags,receivable_payment_id)
  values(r.household_id,'Pembayaran Piutang - '||r.borrower_name,new.amount,new.paid_at,new.note,auth.uid(),r.archived_at,array['Pembayaran Piutang'],new.id)
  on conflict(receivable_payment_id) do update set source=excluded.source,amount=excluded.amount,
   happened_at=excluded.happened_at,note=excluded.note,archived_at=excluded.archived_at,tags=excluded.tags;
 end if;
 update public.receivables set status=case when original_amount<=(select coalesce(sum(amount),0) from public.receivable_payments where receivable_id=rid) then 'lunas' else 'belum' end,updated_at=now() where id=rid;
 return coalesce(new,old);
end $$;

-- Linked cashflow is edited through its source, so Finance cannot become detached.
create function private.protect_receivable_finance() returns trigger
language plpgsql security invoker set search_path='' as $$
declare linked boolean;
begin
 if tg_table_name='expenses' then
  linked:=case when tg_op='INSERT' then new.receivable_id is not null when tg_op='DELETE' then old.receivable_id is not null else old.receivable_id is not null or new.receivable_id is not null end;
 else
  linked:=case when tg_op='INSERT' then new.receivable_payment_id is not null when tg_op='DELETE' then old.receivable_payment_id is not null else old.receivable_payment_id is not null or new.receivable_payment_id is not null end;
 end if;
 if linked and pg_trigger_depth()<2 then raise exception 'Transaksi ini terhubung ke Piutang. Ubah atau hapus melalui menu Piutang.'; end if;
 return coalesce(new,old);
end $$;

create trigger receivable_finance_sync after insert or update on public.receivables for each row execute function private.receivable_finance_sync();
create trigger receivable_payment_validate before insert or update on public.receivable_payments for each row execute function private.receivable_payment_validate();
create trigger receivable_payment_finance_sync after insert or update or delete on public.receivable_payments for each row execute function private.receivable_payment_finance_sync();
create trigger protect_receivable_finance before insert or update or delete on public.expenses for each row execute function private.protect_receivable_finance();
create trigger protect_receivable_finance before insert or update or delete on public.income for each row execute function private.protect_receivable_finance();
revoke all on function private.receivable_finance_sync(),private.receivable_payment_validate(),private.receivable_payment_finance_sync(),private.protect_receivable_finance() from public,anon,authenticated;
commit;
