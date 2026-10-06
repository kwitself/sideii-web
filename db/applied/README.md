# Applied database migrations

This directory contains snapshots of production migrations that were applied directly through the Supabase migration API before this repository adopted a local migration directory.

Rules:

- File names use the exact version and name stored in `supabase_migrations.schema_migrations`.
- These files are historical snapshots, not migrations to re-run blindly.
- For future schema work, create a normal local Supabase migration first, review it, then apply and commit it.
- Production migration history remains the source of truth for whether a migration has already run.

Captured pre-launch hardening:
- public archived catalogue read policy
- Control Room alert ordering fix
- admin RPC hardening
- legacy/user RPC surface closure
- internal trigger function EXECUTE restriction
- supporting foreign-key indexes
