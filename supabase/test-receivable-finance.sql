-- Run against a configured Family Vault database. All test writes roll back.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.household_members limit 1),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare h uuid; r uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); e uuid; i uuid; before_e numeric; before_i numeric; n numeric;
begin
 select id into h from public.households where status='active' limit 1;
 if h is null then raise exception 'An active member household is required'; end if;
 select coalesce(sum(amount),0) into before_e from public.expenses where household_id=h and archived_at is null;
 select coalesce(sum(amount),0) into before_i from public.income where household_id=h and archived_at is null;
 insert into public.receivables(id,household_id,borrower_name,original_amount,created_by) values(r,h,'Integration test',1000000,auth.uid());
 select id into e from public.expenses where receivable_id=r and amount=1000000 and category='Piutang Diberikan';
 if e is null then raise exception 'Missing Expense'; end if;
 insert into public.receivables(id,household_id,borrower_name,original_amount,created_by) values(r,h,'Integration test',1000000,auth.uid()) on conflict(id) do nothing;
 if (select count(*) from public.expenses where receivable_id=r)<>1 then raise exception 'Duplicate expense'; end if;
 insert into public.receivable_payments(id,receivable_id,amount,created_by) values(p,r,250000,auth.uid());
 insert into public.receivable_payments(id,receivable_id,amount,created_by) values(p,r,250000,auth.uid()) on conflict(id) do nothing;
 select id into i from public.income where receivable_payment_id=p and amount=250000;
 if i is null or (select count(*) from public.income where receivable_payment_id=p)<>1 then raise exception 'Missing/duplicate Income'; end if;
 select sum(amount)-before_e into n from public.expenses where household_id=h and archived_at is null;
 if n<>1000000 then raise exception 'Expense summary incorrect'; end if;
 select sum(amount)-before_i into n from public.income where household_id=h and archived_at is null;
 if n<>250000 then raise exception 'Income summary incorrect'; end if;
 update public.receivables set original_amount=1200000,borrower_name='Updated borrower',lent_at='2026-09-01',note='Updated note' where id=r;
 if not exists(select 1 from public.expenses where id=e and amount=1200000 and happened_at='2026-09-01' and name='Piutang ke Updated borrower') then raise exception 'Expense edit failed'; end if;
 if not exists(select 1 from public.income where id=i and source='Pembayaran Piutang - Updated borrower') then raise exception 'Borrower sync failed'; end if;
 update public.receivable_payments set amount=400000,paid_at='2026-09-02',note='Updated payment' where id=p;
 if not exists(select 1 from public.income where id=i and amount=400000 and happened_at='2026-09-02' and note='Updated payment') then raise exception 'Income edit failed'; end if;
 begin
  update public.receivable_payments set amount=1300000 where id=p;
  raise exception 'Overpayment was accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 begin
  delete from public.expenses where id=e;
  raise exception 'Direct linked Expense delete was accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 begin
  update public.income set archived_at=now() where id=i;
  raise exception 'Direct linked Income archive was accepted' using errcode='XX000';
 exception when raise_exception then null; end;
 update public.receivables set archived_at=now() where id=r;
 if exists(select 1 from public.expenses where id=e and archived_at is null) or exists(select 1 from public.income where id=i and archived_at is null) then raise exception 'Archive sync failed'; end if;
 update public.receivables set archived_at=null where id=r;
 delete from public.receivable_payments where id=p;
 if exists(select 1 from public.income where id=i) then raise exception 'Income delete failed'; end if;
 insert into public.receivable_payments(id,receivable_id,amount,created_by) values(p,r,1200000,auth.uid());
 if (select status from public.receivables where id=r)<>'lunas' then raise exception 'Settlement status failed'; end if;
 delete from public.receivables where id=r;
 if exists(select 1 from public.expenses where id=e) or exists(select 1 from public.income where receivable_payment_id=p) or exists(select 1 from public.receivable_payments where id=p) then raise exception 'Cascade deletion failed'; end if;
 if (select coalesce(sum(amount),0) from public.expenses where household_id=h and archived_at is null)<>before_e or (select coalesce(sum(amount),0) from public.income where household_id=h and archived_at is null)<>before_i then raise exception 'Summary did not return to baseline'; end if;
end $$;
select 'PASS: add, retry, installment, edit, archive/restore, delete, settlement and Finance totals' as result;
rollback;
