-- SIDE:II notification queue batch safety audit (read only).
SELECT p.proname,
  position(') due;' in pg_get_functiondef(p.oid)) > 0 AS limited_before_aggregation,
  position('LIMIT greatest' in pg_get_functiondef(p.oid)) > 0 AS bounded_batch
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN ('claim_due_launch_notifications','claim_due_gift_notifications')
ORDER BY p.proname;
