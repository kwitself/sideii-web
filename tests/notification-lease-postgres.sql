-- Only the ephemeral GitHub Actions database runs this fixture.
CREATE SCHEMA qa_lease;
CREATE TABLE qa_lease.runner(name text PRIMARY KEY,holder uuid NOT NULL,expires_at timestamptz NOT NULL);
CREATE FUNCTION qa_lease.acquire(p_holder uuid) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE claimed uuid;
BEGIN
 INSERT INTO qa_lease.runner(name,holder,expires_at) VALUES('commerce',p_holder,now()+interval '45 minutes')
 ON CONFLICT(name) DO UPDATE SET holder=excluded.holder,expires_at=excluded.expires_at
 WHERE qa_lease.runner.expires_at<now() RETURNING holder INTO claimed;
 RETURN claimed=p_holder;
END $$;
DO $assertions$
BEGIN
 IF NOT qa_lease.acquire('11111111-1111-4111-8111-111111111111') THEN
  RAISE EXCEPTION 'first lease acquisition failed';
 END IF;
 IF qa_lease.acquire('22222222-2222-4222-8222-222222222222') THEN
  RAISE EXCEPTION 'unexpired lease was stolen';
 END IF;
 UPDATE qa_lease.runner SET expires_at=now()-interval '1 minute' WHERE name='commerce';
 IF NOT qa_lease.acquire('22222222-2222-4222-8222-222222222222') THEN
  RAISE EXCEPTION 'expired lease was not acquired';
 END IF;
 IF EXISTS(SELECT 1 FROM qa_lease.runner WHERE holder='11111111-1111-4111-8111-111111111111') THEN
  RAISE EXCEPTION 'stale holder retained lease';
 END IF;
END $assertions$;
DROP SCHEMA qa_lease CASCADE;
