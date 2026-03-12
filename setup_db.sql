-- ══════════════════════════════════════════════════════
--  Score Energy Dashboard — Supabase Schema
-- ══════════════════════════════════════════════════════

-- 1. MAESTRO: info de cada sala
CREATE TABLE IF NOT EXISTS maestro (
  local_id    TEXT PRIMARY KEY,
  cadena      TEXT,
  store_name  TEXT,
  store_nbr   TEXT,
  comuna      TEXT,
  encargado   TEXT,
  sala        TEXT,
  incentivo   TEXT,
  supervisor  TEXT
);

-- 2. VENTAS: una fila por fecha × sala × SKU
CREATE TABLE IF NOT EXISTS ventas (
  id              BIGSERIAL PRIMARY KEY,
  fecha           DATE    NOT NULL,
  cadena          TEXT,
  local_id        TEXT,
  local_desc      TEXT,
  articulo_id     BIGINT,
  articulo_desc   TEXT,
  venta_unidades  NUMERIC,
  venta_neta      NUMERIC,
  costo_venta     NUMERIC,
  contribucion    NUMERIC,
  region          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: evita duplicados al re-ejecutar el script
CREATE UNIQUE INDEX IF NOT EXISTS ventas_uq
  ON ventas (fecha, local_id, articulo_id);

-- 3. STOCK: snapshot diario por sala × SKU
CREATE TABLE IF NOT EXISTS stock (
  id                   BIGSERIAL PRIMARY KEY,
  dia                  DATE    NOT NULL,
  cadena               TEXT,
  local_id             TEXT,
  local_desc           TEXT,
  articulo_id          BIGINT,
  articulo_desc        TEXT,
  stock_disponibilidad NUMERIC,
  stock_lu             NUMERIC,
  stock_transito       NUMERIC,
  forecast             NUMERIC,
  cubicaje             NUMERIC,
  min_exhibicion       NUMERIC,
  dds                  NUMERIC,
  d0   NUMERIC, d1  NUMERIC, d2  NUMERIC, d3  NUMERIC,
  d4   NUMERIC, d5  NUMERIC, d6  NUMERIC, d7  NUMERIC,
  d8   NUMERIC, d9  NUMERIC, d10 NUMERIC, d11 NUMERIC,
  d12  NUMERIC, d13 NUMERIC,
  l7d                  NUMERIC,
  l14d                 NUMERIC,
  alerta_agencia       SMALLINT DEFAULT 0,
  alerta_reposicion    SMALLINT DEFAULT 0,
  region               TEXT,
  supervisor           TEXT,
  atencion             TEXT,
  incentivo            TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único: evita duplicados al re-ejecutar el script
CREATE UNIQUE INDEX IF NOT EXISTS stock_uq
  ON stock (dia, local_id, articulo_id);

-- ══════════════════════════════════════════════════════
--  Row Level Security: lectura pública, escritura solo service_role
-- ══════════════════════════════════════════════════════
ALTER TABLE maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read maestro" ON maestro FOR SELECT USING (true);
CREATE POLICY "public read ventas"  ON ventas  FOR SELECT USING (true);
CREATE POLICY "public read stock"   ON stock   FOR SELECT USING (true);
