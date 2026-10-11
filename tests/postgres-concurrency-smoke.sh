#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL must target an ephemeral integration-test PostgreSQL instance}"
case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*|*postgres-test*) ;;
  *) echo "Refusing to run: use local/ephemeral PostgreSQL only" >&2; exit 2 ;;
esac
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA qa_parallel;
CREATE TABLE qa_parallel.stock (id int primary key, stock_qty int not null, reserved_qty int not null);
INSERT INTO qa_parallel.stock VALUES (1,1,0);
CREATE TABLE qa_parallel.grants (token text primary key, used_at timestamptz);
INSERT INTO qa_parallel.grants VALUES ('test-only-token',null);
SQL

# Connection 1 holds a row lock. Connection 2 must wait, then observe updated state.
psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -c "BEGIN; SELECT id FROM qa_parallel.stock WHERE id=1 FOR UPDATE; SELECT pg_sleep(2); UPDATE qa_parallel.stock SET reserved_qty=reserved_qty+1 WHERE id=1 AND stock_qty-reserved_qty>=1; COMMIT;" > /tmp/sideii-stock-1.log &
pid1=$!
sleep 0.3
stock_second=$(psql "$DATABASE_URL" -XqAt -v ON_ERROR_STOP=1 -c "UPDATE qa_parallel.stock SET reserved_qty=reserved_qty+1 WHERE id=1 AND stock_qty-reserved_qty>=1 RETURNING id;")
wait "$pid1"
stock_state=$(psql "$DATABASE_URL" -XAt -c "SELECT reserved_qty FROM qa_parallel.stock WHERE id=1")
test -z "$stock_second"
test "$stock_state" = "1"

psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -c "BEGIN; SELECT token FROM qa_parallel.grants WHERE token='test-only-token' FOR UPDATE; SELECT pg_sleep(2); UPDATE qa_parallel.grants SET used_at=now() WHERE token='test-only-token' AND used_at IS NULL; COMMIT;" > /tmp/sideii-grant-1.log &
pid2=$!
sleep 0.3
grant_second=$(psql "$DATABASE_URL" -XqAt -v ON_ERROR_STOP=1 -c "UPDATE qa_parallel.grants SET used_at=now() WHERE token='test-only-token' AND used_at IS NULL RETURNING token;")
wait "$pid2"
used_count=$(psql "$DATABASE_URL" -XAt -c "SELECT count(*) FROM qa_parallel.grants WHERE used_at IS NOT NULL")
test -z "$grant_second"
test "$used_count" = "1"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA qa_parallel CASCADE;"
echo "PASS: PostgreSQL concurrent stock and single-use grant invariants"
