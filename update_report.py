#!/usr/bin/env python3
"""
update_report.py
────────────────
Actualiza JUMBO_REPORTE.xlsx con los inputs diarios de Cencosud
y sincroniza los datos a Supabase.

Lógica replicada desde las fórmulas Excel originales:
  • D0–D13  → SUMIFS(Venta!W, SKU, LocalID, Fecha = hoy-N)
  • L7D     → SUM(D0:D6)
  • L14D    → SUM(D0:D13)
  • Alerta Agencia    → Stock > 24 AND D0+D1 = 0
  • ALERTA REPOSICIÓN → Stock >= 24 AND D0 = 0
  • Región   → desde hoja Venta por Local ID
  • SUPERVISOR / ATENCION → XLOOKUP(Local ID, MAESTRO!StoreNbr, col)
  • INCENTIVO → XLOOKUP(Local ID, MAESTRO!SALA, MAESTRO!INCENTIVO)

Uso:
  python update_report.py
"""

import warnings
from datetime import date, timedelta
from pathlib import Path

import httpx
import openpyxl
import pandas as pd
from dotenv import load_dotenv
import os

warnings.filterwarnings("ignore")
load_dotenv()

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR    = Path("/Users/agustin/Library/CloudStorage/OneDrive-uc.cl/Score/Dashboard Reportes Diarios")
REPORT_PATH = BASE_DIR / "JUMBO_REPORTE.xlsx"
INPUTS_DIR  = BASE_DIR / "Inputs_Cencosud"

# ── Constantes ─────────────────────────────────────────────────────────────────
CADENAS = {"JUMBO", "SANTA ISABEL", "SPID"}
SKUS    = {2001113, 2034089, 2030990, 2030991,
           2039041, 2048972, 1776033, 2001115, 2001114}

# ── Supabase ───────────────────────────────────────────────────────────────────
SUPABASE_URL         = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ENABLED     = bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


# ── Helpers ────────────────────────────────────────────────────────────────────

def latest(prefix: str) -> Path:
    files = sorted(p for p in INPUTS_DIR.iterdir() if p.name.startswith(prefix))
    if not files:
        raise FileNotFoundError(f"No se encontró ningún archivo con prefijo '{prefix}' en {INPUTS_DIR}")
    return files[-1]


def drop_blank_cols(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(
        columns=[c for c in df.columns if str(c).strip() in ("", " ", "nan")],
        errors="ignore",
    )


def normalize_sku(df: pd.DataFrame) -> pd.DataFrame:
    df["Artículo ID"] = pd.to_numeric(df["Artículo ID"], errors="coerce").astype("Int64")
    return df


def clean_val(v):
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, pd.Timestamp):
        return v.to_pydatetime() if pd.notna(v) else None
    if hasattr(v, "item"):
        return v.item()
    return v


def df_to_records(df: pd.DataFrame) -> list[dict]:
    """Convierte un DataFrame a lista de dicts limpios para JSON."""
    records = []
    for row in df.to_dict("records"):
        records.append({k: clean_val(v) for k, v in row.items()})
    return records


# ── Supabase client (httpx) ────────────────────────────────────────────────────

def sb_upsert(table: str, records: list[dict], on_conflict: str) -> None:
    """Hace upsert en lotes de 500 filas."""
    if not SUPABASE_ENABLED or not records:
        return

    headers = {
        "apikey":        SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        f"resolution=merge-duplicates,return=minimal",
    }

    batch_size = 500
    total = len(records)
    for i in range(0, total, batch_size):
        batch = records[i : i + batch_size]
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}",
            headers=headers,
            json=batch,
            timeout=60,
        )
        if r.status_code not in (200, 201):
            print(f"  ⚠️  Supabase error en {table} lote {i//batch_size+1}: {r.text[:200]}")
        else:
            end = min(i + batch_size, total)
            print(f"  ✓ Supabase {table}: filas {i+1}–{end} de {total}")


# ── Lectura de inputs ──────────────────────────────────────────────────────────

def read_ventas() -> pd.DataFrame:
    path = latest("Ventas por Art")
    print(f"  📄 {path.name}")

    df = pd.read_excel(path)
    df = drop_blank_cols(df)
    df = df[df["Fecha"] != "Total"].copy()
    df = normalize_sku(df)
    df = df[df["Cadena"].isin(CADENAS) & df["Artículo ID"].isin(SKUS)].copy()
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")
    df = df.rename(columns={"Local": "Local DESC", "Artículo": "Artículo DESC"}, errors="ignore")
    df["SKU"] = df["Artículo ID"]
    return df


def read_stock_input() -> pd.DataFrame:
    path = latest("Maestra - Stock Detalle")
    print(f"  📄 {path.name}")

    df = pd.read_excel(path)
    df = drop_blank_cols(df)
    df = df[df["Día"] != "Total"].copy()
    df = normalize_sku(df)
    df = df[df["Cadena"].isin(CADENAS) & df["Artículo ID"].isin(SKUS)].copy()
    df["Día"] = pd.to_datetime(df["Día"], errors="coerce")
    return df


def read_maestro() -> pd.DataFrame:
    return pd.read_excel(REPORT_PATH, sheet_name="MAESTRO")


# ── Columnas calculadas ────────────────────────────────────────────────────────

def calc_daily_sales(ventas: pd.DataFrame, today: date) -> pd.DataFrame:
    pivot = ventas.pivot_table(
        index=["Local ID", "Artículo ID"],
        columns="Fecha",
        values="Venta Unidades",
        aggfunc="sum",
        fill_value=0,
    )
    result = pd.DataFrame(index=pivot.index)
    for i in range(14):
        target = pd.Timestamp(today) - timedelta(days=i + 1)
        result[f"D{i}"] = pivot[target] if target in pivot.columns else 0
    return result.reset_index()


def add_calculated_cols(
    stock: pd.DataFrame,
    ventas: pd.DataFrame,
    maestro: pd.DataFrame,
    today: date,
) -> pd.DataFrame:

    # D0–D13
    dsales = calc_daily_sales(ventas, today)
    df = stock.merge(dsales, on=["Local ID", "Artículo ID"], how="left")
    d_cols = [f"D{i}" for i in range(14)]
    df[d_cols] = df[d_cols].fillna(0).astype(int)

    # L7D, L14D
    df["L7D"]  = df[[f"D{i}" for i in range(7)]].sum(axis=1)
    df["L14D"] = df[d_cols].sum(axis=1)

    # Lookups desde MAESTRO
    m = maestro.copy()
    m["Store Nbr"] = m["Store Nbr"].astype(str).str.strip()
    lid = df["Local ID"].astype(str).str.strip()

    sup_map  = m.dropna(subset=["Encargado"]).set_index("Store Nbr")["Encargado"].to_dict()
    aten_map = m.dropna(subset=["Dia"]).set_index("Store Nbr")["Dia"].to_dict()
    inc_map  = m.dropna(subset=["INCENTIVO"]).set_index("SALA")["INCENTIVO"].to_dict()

    df["SUPERVISOR"] = lid.map(sup_map).fillna("").replace(0, "")
    df["ATENCION"]   = lid.map(aten_map).fillna("").replace(0, "")
    df["INCENTIVO"]  = lid.map(inc_map).fillna("").replace(0, "")

    # Región desde Venta
    region_map = (
        ventas.dropna(subset=["Región"])
        .drop_duplicates("Local ID")
        .set_index("Local ID")["Región"]
        .to_dict()
    )
    df["Región"] = df["Local ID"].map(region_map).fillna("")

    # Alertas
    sd = df["Stock Disponibilidad"].fillna(0)
    df["Alerta Agencia"]    = ((sd > 24)  & (df["D0"] + df["D1"] == 0)).astype(int)
    df["ALERTA REPOSICIÓN"] = ((sd >= 24) & (df["D0"] == 0)).astype(int)

    return df


# ── Escritura al Excel ─────────────────────────────────────────────────────────

def write_sheet(wb: openpyxl.Workbook, sheet_name: str, df: pd.DataFrame, header_row: int = 2) -> None:
    ws = wb[sheet_name]
    header_vals = [ws.cell(row=header_row, column=c).value for c in range(1, ws.max_column + 1)]
    if ws.max_row > header_row:
        ws.delete_rows(header_row + 1, ws.max_row - header_row)
    df_cols = set(df.columns)
    for _, row in df.iterrows():
        row_data = [
            clean_val(row[str(h).strip()]) if h and str(h).strip() in df_cols else None
            for h in header_vals
        ]
        ws.append(row_data)
    print(f"  ✓ Excel {sheet_name}: {len(df):,} filas escritas")


# ── Supabase: preparar DataFrames ──────────────────────────────────────────────

def ventas_to_sb(ventas: pd.DataFrame) -> list[dict]:
    cols = {
        "Fecha":              "fecha",
        "Cadena":             "cadena",
        "Local ID":           "local_id",
        "Local DESC":         "local_desc",
        "Artículo ID":        "articulo_id",
        "Artículo DESC":      "articulo_desc",
        "Venta Unidades":     "venta_unidades",
        "Venta Neta ($)":     "venta_neta",
        "Costo Venta ($)":    "costo_venta",
        "Contribución ($)":   "contribucion",
        "Región":             "region",
    }
    df = ventas[[c for c in cols if c in ventas.columns]].rename(columns=cols)
    if "fecha" in df.columns:
        df["fecha"] = df["fecha"].dt.strftime("%Y-%m-%d")
    # Deduplicar: si hay múltiples filas con mismo fecha+local_id+articulo_id, sumar unidades
    num_cols = ["venta_unidades", "venta_neta", "costo_venta", "contribucion"]
    key_cols  = ["fecha", "local_id", "articulo_id"]
    meta_cols = [c for c in df.columns if c not in num_cols + key_cols]
    agg = {c: "sum" for c in num_cols if c in df.columns}
    agg.update({c: "first" for c in meta_cols if c in df.columns})
    df = df.groupby(key_cols, as_index=False).agg(agg)
    return df_to_records(df)


def stock_to_sb(stock: pd.DataFrame) -> list[dict]:
    cols = {
        "Día":                   "dia",
        "Cadena":                "cadena",
        "Local ID":              "local_id",
        "Local DESC":            "local_desc",
        "Artículo ID":           "articulo_id",
        "Artículo DESC":         "articulo_desc",
        "Stock Disponibilidad":  "stock_disponibilidad",
        "Stock LU":              "stock_lu",
        "Stock Tránsito":        "stock_transito",
        "Forecast":              "forecast",
        "Cubicaje":              "cubicaje",
        "Min Exhibición":        "min_exhibicion",
        "DDS":                   "dds",
        "D0":"d0","D1":"d1","D2":"d2","D3":"d3","D4":"d4","D5":"d5","D6":"d6",
        "D7":"d7","D8":"d8","D9":"d9","D10":"d10","D11":"d11","D12":"d12","D13":"d13",
        "L7D":                   "l7d",
        "L14D":                  "l14d",
        "Alerta Agencia":        "alerta_agencia",
        "ALERTA REPOSICIÓN":     "alerta_reposicion",
        "Región":                "region",
        "SUPERVISOR":            "supervisor",
        "ATENCION":              "atencion",
        "INCENTIVO":             "incentivo",
    }
    df = stock[[c for c in cols if c in stock.columns]].rename(columns=cols)
    if "dia" in df.columns:
        df["dia"] = df["dia"].dt.strftime("%Y-%m-%d")
    return df_to_records(df)


def maestro_to_sb(maestro: pd.DataFrame) -> list[dict]:
    cencosud = maestro[maestro["Cadena"].str.upper().isin(CADENAS)].copy()
    # Seleccionar y renombrar columnas sin claves duplicadas
    keep = {
        "Store Nbr":   "local_id",      # J403, N797, O415 — clave de join
        "Cadena":      "cadena",
        "Store Name":  "store_name",
        "COMUNA":      "comuna",
        "Encargado":   "encargado",
        "Incentivo":   "incentivo",
        "SUPERVISOR":  "supervisor",
    }
    available = {k: v for k, v in keep.items() if k in cencosud.columns}
    df = cencosud[list(available.keys())].rename(columns=available)
    df["sala"] = df["local_id"]
    df = df.dropna(subset=["local_id"])
    return df_to_records(df)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    today = date.today()
    sep = "═" * 54

    print(f"\n{sep}")
    print(f"  Score Energy — Actualización Cencosud")
    print(f"  Fecha de ejecución: {today:%d/%m/%Y}")
    print(f"  Supabase: {'✅ activo' if SUPABASE_ENABLED else '⚠️  desactivado (sin credenciales)'}")
    print(f"{sep}\n")

    # 1. Leer inputs
    print("📂 Leyendo inputs...")
    ventas  = read_ventas()
    stock   = read_stock_input()
    maestro = read_maestro()

    print(f"     Ventas : {len(ventas):,} filas | "
          f"{ventas['Fecha'].min():%d/%m} → {ventas['Fecha'].max():%d/%m/%Y}")
    print(f"     Stock  : {len(stock):,} filas")

    # 2. Calcular columnas derivadas
    print("\n🧮 Calculando columnas derivadas...")
    stock_final = add_calculated_cols(stock, ventas, maestro, today)

    # 3. Actualizar Excel
    print("\n💾 Actualizando JUMBO_REPORTE.xlsx...")
    wb = openpyxl.load_workbook(REPORT_PATH)
    write_sheet(wb, "Venta", ventas)
    write_sheet(wb, "Stock", stock_final)
    wb.save(REPORT_PATH)

    # 4. Sincronizar a Supabase
    if SUPABASE_ENABLED:
        print("\n☁️  Sincronizando a Supabase...")
        sb_upsert("maestro", maestro_to_sb(maestro),    "local_id")
        sb_upsert("ventas",  ventas_to_sb(ventas),      "fecha,local_id,articulo_id")
        sb_upsert("stock",   stock_to_sb(stock_final),  "dia,local_id,articulo_id")

    # 5. Resumen
    alerts_ag   = stock_final["Alerta Agencia"].sum()
    alerts_repo = stock_final["ALERTA REPOSICIÓN"].sum()

    print(f"\n{sep}")
    print(f"  ✅ Reporte actualizado exitosamente")
    print(f"     Ventas escritas  : {len(ventas):,} filas")
    print(f"     Stock escrito    : {len(stock_final):,} filas")
    print(f"     Alertas Agencia  : {alerts_ag}")
    print(f"     Alertas Repos.   : {alerts_repo}")
    print(f"{sep}\n")


if __name__ == "__main__":
    main()
