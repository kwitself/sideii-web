-- Read-only regression check for guest-order authorization.
-- Both gift-edit RPCs must require ownership OR a matching guest access token.
DO $$
DECLARE name text; definition text;
BEGIN
 FOREACH name IN ARRAY ARRAY['attach_order_commerce_context','set_order_gift_details','set_order_gift_details_v2'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p
  WHERE p.pronamespace='public'::regnamespace AND p.proname=name;
  IF definition IS NULL OR position('p_guest_access_token IS DISTINCT FROM o.guest_access_token' IN definition)=0 THEN
   RAISE EXCEPTION 'Missing guest-token ownership boundary: %',name;
  END IF;
 END LOOP;
 RAISE NOTICE 'All three guest-order write RPC authorization guards present';
END $$;
