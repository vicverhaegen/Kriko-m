-- ============================================================
--  Scouts Kriko-M — Update: 3 Agenda's & 'grl' audience tag
--  Voer dit script uit in Supabase → SQL Editor → New query
-- ============================================================
--
-- Dit script:
-- 1. Past de CHECK constraint op `calendar` aan zodat de verborgen tag 'grl'
--    is toegestaan naast de bestaande tags ('leiding','kapoenen','welpen','jonggivers','givers','groep').
-- 2. Voegt de kolom `groepsleiding_ics_token` toe aan de `settings`-tabel en genereert
--    een uniek token voor de private groepsleiding-ICS-feed.
--
-- Idempotent: veilig om meermaals te draaien.

-- ── 1. Oude audience-CHECK droppen ─────────────────────────
ALTER TABLE calendar DROP CONSTRAINT IF EXISTS calendar_audience_valid;

-- ── 2. Nieuwe audience-CHECK inclusief 'grl' ────────────────
ALTER TABLE calendar ADD CONSTRAINT calendar_audience_valid
  CHECK (audience <@ ARRAY['leiding','kapoenen','welpen','jonggivers','givers','groep','grl']::text[]);

-- ── 3. ICS token voor de private groepsleiding-feed toevoegen ─
ALTER TABLE settings ADD COLUMN IF NOT EXISTS groepsleiding_ics_token TEXT NOT NULL DEFAULT '';

-- ── 4. Uniek token genereren indien nog niet aanwezig ────────
UPDATE settings
  SET groepsleiding_ics_token = replace(gen_random_uuid()::text, '-', '')
  WHERE id = 1 AND (groepsleiding_ics_token IS NULL OR groepsleiding_ics_token = '');
