-- Temporary database only: payment-event index behavior.
CREATE SCHEMA qa_payment;
CREATE TABLE qa_payment.events(
 id bigint generated always as identity primary key,
 provider text not null,
 provider_event_id text not null,
 provider_payment_id text,
 event_type text not null,
 unique(provider,provider_event_id)
);
CREATE UNIQUE INDEX success_payment_id_qa
ON qa_payment.events(provider,provider_payment_id)
WHERE provider_payment_id IS NOT NULL AND event_type='payment.succeeded';
INSERT INTO qa_payment.events(provider,provider_event_id,provider_payment_id,event_type)
VALUES ('generic','paid-1','transaction-1','payment.succeeded');
INSERT INTO qa_payment.events(provider,provider_event_id,provider_payment_id,event_type)
VALUES ('generic','refund-1','transaction-1','payment.refunded');
DO $qa$
DECLARE rejected boolean;
BEGIN
 rejected:=false;
 BEGIN
  INSERT INTO qa_payment.events(provider,provider_event_id,provider_payment_id,event_type)
  VALUES('generic','paid-2','transaction-1','payment.succeeded');
 EXCEPTION WHEN unique_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Duplicate successful payment was permitted'; END IF;
 rejected:=false;
 BEGIN
  INSERT INTO qa_payment.events(provider,provider_event_id,provider_payment_id,event_type)
  VALUES('generic','paid-1','other-transaction','payment.succeeded');
 EXCEPTION WHEN unique_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Duplicate provider event identity was permitted'; END IF;
 IF (SELECT count(*) FROM qa_payment.events)<>2 THEN RAISE EXCEPTION 'Unexpected payment event count'; END IF;
 RAISE NOTICE 'PASS: provider event uniqueness and refund payment ID reuse';
END $qa$;
DROP SCHEMA qa_payment CASCADE;
