-- ============================================================
--  Scouts Kriko-M — Webshop Betaling, Status & Financiële Notificatie
--  Voer dit script uit in Supabase → SQL Editor → New query
-- ============================================================

-- 1. Voeg betalingsmethode toe aan de orders tabel
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'overschrijving';

-- 2. Werk de status constraint bij voor orders zodat 'niet_betaald', 'betaald', 'afgehaald' ondersteund worden
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('niet_betaald', 'betaald', 'afgehaald', 'pending', 'paid', 'completed', 'cancelled'));

-- 3. Voeg financieel e-mailadres toe aan de settings tabel
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS webshop_financial_email TEXT NOT NULL DEFAULT 'financieel@kriko-m.be';

-- 4. Pas order_ref aan naar KM- formaat (zelfde formaat als overschrijvingsmededeling)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_ref' AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE orders DROP COLUMN order_ref;
    ALTER TABLE orders ADD COLUMN order_ref TEXT GENERATED ALWAYS AS ('KM-' || LPAD(order_number::text, 4, '0')) STORED;
  END IF;
END $$;