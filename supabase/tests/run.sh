#!/usr/bin/env bash
# Runs the migrations, seed and security checks on a local Postgres.
# Usage: PGHOST=/tmp PGPORT=5432 PGUSER=postgres ./supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=abondhu_test
psql -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"
for f in tests/supabase_stub.sql migrations/*.sql seed.sql; do
  psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f"
done
psql -q -v ON_ERROR_STOP=1 -d $DB -f tests/policy_test.sql 2>&1 | grep -E 'ok|FAILED|PASSED|ERROR'
