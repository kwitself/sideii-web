-- SIDE:II prelaunch catalogue check: READ-ONLY.
-- QA-* SKUs are test-fixture indicators; approve a genuine catalogue before live launch.
select sku,format,active,price,currency,stock_qty,reserved_qty,
       coalesce(preorder_enabled,false) as preorder,
       case
         when sku ilike 'QA-%' then 'QA_FIXTURE_REVIEW'
         when active and (sku is null or trim(sku)='') then 'MISSING_SKU'
         when active and (price is null or price<=0) then 'PRICE_REVIEW'
         when active and lower(coalesce(format,''))<>'digital'
              and coalesce(stock_qty,0)=0 and not coalesce(preorder_enabled,false) then 'SOLD_OUT'
         when active and (iyzilink_url is null or trim(iyzilink_url)='') then 'PAYMENT_LINK_PENDING'
         else 'REVIEW_READY'
       end as launch_status
from public.product_variants
order by sku;
