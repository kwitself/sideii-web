-- Applied to SIDE II Supabase on 2026-10-13.
-- Unissued draft preparation only; never sends invoices to GIB.
create or replace function public.admin_finance_invoice_draft_create(
 p_order_id uuid,p_type text,p_recipient_name text,p_tax_id text default null,p_tax_office text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_order public.orders%rowtype;v_id uuid;v_item_count integer;v_snap_count integer;v_verified integer;v_items jsonb;v_tax text;
begin
 if coalesce(auth.jwt()->'app_metadata'->>'role','')<>'admin' then raise exception 'Admin required';end if;
 if p_type not in ('e_invoice','e_archive') then raise exception 'Invalid draft type';end if;
 if char_length(trim(coalesce(p_recipient_name,''))) not between 2 and 200 then raise exception 'Invalid recipient name';end if;
 v_tax=nullif(trim(p_tax_id),'');
 if v_tax is not null and (char_length(v_tax) not in (10,11) or translate(v_tax,'0123456789','')<>'') then raise exception 'Invalid tax ID';end if;
 select * into v_order from public.orders where id=p_order_id;
 if not found or v_order.currency<>'TRY' then raise exception 'TRY order required';end if;
 if v_order.payment_status not in ('paid','partially_refunded') or v_order.status in ('cancelled','refunded') then raise exception 'Eligible paid order required';end if;
 select count(*) into v_item_count from public.order_items where order_id=p_order_id;
 select count(*),count(*) filter(where vat_configured and estimated_item_net is not null and estimated_item_vat is not null and vat_rate between 0 and 100) into v_snap_count,v_verified from public.finance_order_item_snapshots where order_id=p_order_id;
 if v_item_count=0 or v_item_count<>v_snap_count or v_item_count<>v_verified then raise exception 'Complete item VAT snapshots required';end if;
 select jsonb_agg(jsonb_build_object('order_item_id',order_item_id,'quantity',quantity,'gross_estimate',item_gross,'net_estimate',estimated_item_net,'vat_estimate',estimated_item_vat,'vat_rate',vat_rate) order by order_item_id) into v_items from public.finance_order_item_snapshots where order_id=p_order_id;
 insert into public.finance_invoice_drafts(order_id,document_type,recipient_name,recipient_tax_id,recipient_tax_office,recipient_address,document_data,status)
 values(p_order_id,p_type,trim(p_recipient_name),v_tax,nullif(trim(p_tax_office),''),v_order.invoice_address,jsonb_build_object('order_no',v_order.order_no,'order_total',v_order.total,'shipping_total',v_order.shipping_total,'items',v_items,'warning','Unissued invoice draft: shipping, discounts, refunds and tax validity require independent review'),'needs_review')
 returning id into v_id;
 return v_id;
end $$;
