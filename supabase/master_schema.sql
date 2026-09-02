-- ============================================================
--  Scouts Kriko-M — Master Database Schema & Initial Seed
--  Voer dit script uit in Supabase → SQL Editor → New query
-- ============================================================

-- ── 1. SITE-INSTELLINGEN ────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                        INTEGER PRIMARY KEY DEFAULT 1,
  scouts_year               TEXT    NOT NULL DEFAULT '2026-2027',
  bank_iban                 TEXT    NOT NULL DEFAULT '',
  bank_bic                  TEXT    NOT NULL DEFAULT '',
  bank_holder               TEXT    NOT NULL DEFAULT '',
  contact_email             TEXT    NOT NULL DEFAULT 'groepsleiding@kriko-m.be',
  webshop_email             TEXT    NOT NULL DEFAULT 'groepsleiding@kriko-m.be',
  contact_phone             TEXT    NOT NULL DEFAULT '',
  contact_address           TEXT    NOT NULL DEFAULT '',
  reg_fee_first             NUMERIC(8,2) NOT NULL DEFAULT 50.00,
  reg_fee_extra             NUMERIC(8,2) NOT NULL DEFAULT 45.00,
  home_leiding_foto         TEXT    NOT NULL DEFAULT '/images/leiding_25-26.jpg',
  takken                    JSONB   NOT NULL DEFAULT '{}'::jsonb,
  concept                   JSONB   NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT settings_single_row CHECK (id = 1)
);

INSERT INTO settings (
  id, scouts_year, bank_iban, bank_bic, bank_holder,
  contact_email, webshop_email, contact_phone, contact_address,
  reg_fee_first, reg_fee_extra, home_leiding_foto, takken
) VALUES (
  1, '2026-2027',
  'BE76 1234 5678 9012', 'KRIKOBE2B', 'Scouts Kriko-M vzw',
  'groepsleiding@kriko-m.be', 'groepsleiding@kriko-m.be', '+32 3 776 00 00', 'Industriepark-Noord 33, 9100 Sint-Niklaas',
  50.00, 45.00,
  '/images/leiding_25-26.jpg',
  '{
    "kapoenen":   {"name":"Kapoenen",   "age_range":"6 - 8 jaar",   "school_year":"1e & 2e leerjaar",              "email":"kapoenenleiding@kriko-m.be",   "class":"kapoenen"},
    "welpen":     {"name":"Welpen",     "age_range":"8 - 11 jaar",  "school_year":"3e, 4e & 5e leerjaar",         "email":"welpenleiding@kriko-m.be",     "class":"welpen"},
    "jonggivers": {"name":"Jonggivers", "age_range":"11 - 14 jaar", "school_year":"6e leerjaar, 1e & 2e middelbaar","email":"jonggiverleiding@kriko-m.be", "class":"jonggivers"},
    "givers":     {"name":"Givers",     "age_range":"14 - 17 jaar", "school_year":"3e, 4e & 5e middelbaar",       "email":"giverleiding@kriko-m.be",      "class":"givers"}
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  contact_email = EXCLUDED.contact_email,
  webshop_email = EXCLUDED.webshop_email;


-- ── 2. SITE CONTENT (Dynamische Teksten & Afbeeldingen) ────
CREATE TABLE IF NOT EXISTS site_content (
  key         TEXT PRIMARY KEY,
  page        TEXT NOT NULL,
  section     TEXT NOT NULL,
  title       TEXT,
  content     TEXT,
  image_url   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  updated_by  TEXT
);


-- ── 3. KALENDER ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar (
  id          TEXT    PRIMARY KEY DEFAULT 'cal_' || gen_random_uuid(),
  title       TEXT    NOT NULL,
  date        DATE    NOT NULL,
  time        TEXT    NOT NULL DEFAULT '',
  location    TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  tak         TEXT    NOT NULL DEFAULT 'groep' CHECK (tak IN ('groep','kapoenen','welpen','jonggivers','givers')),
  werkjaar    TEXT    NOT NULL DEFAULT '2026-2027',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_werkjaar_idx ON calendar(werkjaar);


-- ── 4. KRIKO ECHO''S ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS echos (
  id          TEXT    PRIMARY KEY DEFAULT 'echo_' || gen_random_uuid(),
  title       TEXT    NOT NULL,
  month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        SMALLINT NOT NULL,
  tak         TEXT    NOT NULL CHECK (tak IN ('kapoenen','welpen','jonggivers','givers')),
  file_name   TEXT    NOT NULL,
  approved    BOOLEAN NOT NULL DEFAULT false,
  werkjaar    TEXT    NOT NULL DEFAULT '2026-2027',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS echos_werkjaar_idx ON echos(werkjaar);


-- ── 5. WEBSHOP PRODUCTEN ────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_products (
  id          TEXT    PRIMARY KEY DEFAULT 'item_' || gen_random_uuid(),
  name        TEXT    NOT NULL,
  price       NUMERIC(8,2) NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sizes       TEXT[]  NOT NULL DEFAULT '{}',
  image       TEXT    NOT NULL DEFAULT '',
  category    TEXT    NOT NULL DEFAULT 'kledij',
  active      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO shop_products (id, name, price, description, sizes, image, category, active, sort_order) VALUES
  ('item_1', 'Kriko-M T-shirt (Bordeaux)', 12.00, 'Het officiële Kriko-M scouts t-shirt van stevig bordeaux katoen.', ARRAY['6 jaar','8 jaar','10 jaar','12 jaar','XS','S','M','L','XL'], '/images/shop/tshirt.jpg', 'kledij', true, 1),
  ('item_2', 'Kriko-M Trui (Comfortabele Hoodie)', 28.00, 'Onze heerlijke, warme bordeaux scouts hoodie met capuchon en buidelzak.', ARRAY['8 jaar','10 jaar','12 jaar','XS','S','M','L','XL','XXL'], '/images/shop/hoodie.jpg', 'kledij', true, 2),
  ('item_3', 'Kriko-M Groepsdas', 10.00, 'De officiële tweekleurige groepsdas van Kriko-M (bordeaux met beige boordje).', ARRAY['Eén maat'], '/images/shop/das.jpg', 'uniform', true, 3),
  ('item_4', 'Kriko Jaarkenteken', 2.00, 'Het nieuwste jaarkenteken van Scouts en Gidsen Vlaanderen.', ARRAY['Standaard'], '/images/shop/kenteken.jpg', 'accessoires', true, 4)
ON CONFLICT (id) DO NOTHING;


-- ── 6. BESTELLINGEN ─────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT    PRIMARY KEY DEFAULT 'ord_' || gen_random_uuid(),
  order_number    INTEGER NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
  order_ref       TEXT    GENERATED ALWAYS AS ('KM-' || LPAD(order_number::text, 4, '0')) STORED,
  status          TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','waiting_approval','paid','completed','cancelled')),
  customer_name   TEXT    NOT NULL,
  child_name      TEXT    NOT NULL DEFAULT '',
  child_tak       TEXT    NOT NULL DEFAULT '',
  email           TEXT    NOT NULL,
  items           JSONB   NOT NULL DEFAULT '[]'::jsonb,
  total           NUMERIC(10,2) NOT NULL DEFAULT 0,
  communication   TEXT    NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx    ON orders(status);
CREATE INDEX IF NOT EXISTS orders_email_idx     ON orders(email);


-- ── 7. PORTAL RESOURCES (Documenten & Links) ───────────────
CREATE TABLE IF NOT EXISTS portal_resources (
  id          TEXT PRIMARY KEY DEFAULT 'res_' || gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('quicklink', 'document')),
  category    TEXT NOT NULL DEFAULT 'Algemeen',
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'fa-solid fa-file',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO portal_resources (id, type, category, label, description, url, icon, sort_order) VALUES
  ('res_q1', 'quicklink', 'Snelkoppelingen', 'Groepsadmin', 'Leden & leiding administratie', 'https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/client/', 'fa-solid fa-users-gear', 1),
  ('res_q2', 'quicklink', 'Snelkoppelingen', 'Google Drive', 'Gedeelde mappen & bestanden', 'https://drive.google.com', 'fa-brands fa-google-drive', 2),
  ('res_q3', 'quicklink', 'Snelkoppelingen', 'Facebook', 'Officiële Kriko-M pagina', 'https://www.facebook.com/ScoutsKrikoM', 'fa-brands fa-facebook', 3),
  ('res_q4', 'quicklink', 'Snelkoppelingen', 'Scouts & Gidsen VL', 'Spelaanbod & richtlijnen', 'https://www.scoutsengidsenvlaanderen.be', 'fa-solid fa-compass-drafting', 4)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
--  ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar           ENABLE ROW LEVEL SECURITY;
ALTER TABLE echos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_resources   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publiek: settings lezen"       ON settings           FOR SELECT USING (true);
CREATE POLICY "Publiek: site_content lezen"   ON site_content       FOR SELECT USING (true);
CREATE POLICY "Publiek: kalender lezen"       ON calendar           FOR SELECT USING (true);
CREATE POLICY "Publiek: echos lezen"          ON echos              FOR SELECT USING (true);
CREATE POLICY "Publiek: shop lezen"           ON shop_products      FOR SELECT USING (true);
CREATE POLICY "Publiek: resources lezen"      ON portal_resources   FOR SELECT USING (true);
