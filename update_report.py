#!/usr/bin/env python3
"""
update_report.py
────────────────
Actualiza JUMBO_REPORTE.xlsx con los inputs diarios de Cencosud.

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

import openpyxl
import pandas as pd

warnings.filterwarnings("ignore")

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR    = Path("/Users/agustin/Library/CloudStorage/OneDrive-uc.cl/Score/Dashboard Reportes Diarios")
REPORT_PATH = BASE_DIR / "JUMBO_REPORTE.xlsx"
INPUTS_DIR  = BASE_DIR / "Inputs_Cencosud"

# ── Constantes ─────────────────────────────────────────────────────────────────
CADENAS = {"JUMBO", "SANTA ISABEL", "SPID"}
SKUS    = {2001113, 2034089, 2030990, 2030991,
           2039041, 2048972, 1776033, 2001115, 2001114}


# ── Helpers ────────────────────────────────────────────────────────────────────

def latest(prefix: str) -> Path:
    """Retorna el archivo más reciente cuyo nombre comienza con el prefijo dado."""
    files = sorted(p for p in INPUTS_DIR.iterdir() if p.name.startswith(prefix))
    if not files:
        raise FileNotFoundError(f"No se encontró ningún archivo con prefijo '{prefix}' en {INPUTS_DIR}")
    return files[-1]


def drop_blank_cols(df: pd.DataFrame) -> pd.DataFrame:
    """Elimina columnas sin nombre (artefactos de Excel)."""
    return df.drop(
        columns=[c for c in df.columns if str(c).strip() in ("", " ", "nan")],
        errors="ignore",
    )


def normalize_sku(df: pd.DataFrame) -> pd.DataFrame:
    """Convierte Artículo ID a entero nullable (maneja float del input)."""
    df["Artículo ID"] = pd.to_numeric(df["Artículo ID"], errors="coerce").astype("Int64")
    return df


def clean_val(v):
    """Convierte tipos pandas/numpy a tipos Python nativos para openpyxl."""
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, pd.Timestamp):
        return v.to_pydatetime() if pd.notna(v) else None
    if hasattr(v, "item"):          # numpy scalar → Python nativo
        return v.item()
    return v


# ── Lectura de inputs ──────────────────────────────────────────────────────────

def read_ventas() -> pd.DataFrame:
    path = latest("Ventas por Art")
    print(f"  📄 {path.name}")

    df = pd.read_excel(path)                     # header=0 por defecto
    df = drop_blank_cols(df)
    df = df[df["Fecha"] != "Total"].copy()       # eliminar fila "Total"
    df = normalize_sku(df)

    df = df[df["Cadena"].isin(CADENAS) & df["Artículo ID"].isin(SKUS)].copy()
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")

    # Renombrar columnas del input para que coincidan con la hoja Venta
    df = df.rename(
        columns={"Local": "Local DESC", "Artículo": "Artículo DESC"},
        errors="ignore",
    )

    # SKU = Artículo ID como entero (columna calculada en la hoja Venta)
    df["SKU"] = df["Artículo ID"]
    return df


def read_stock_input() -> pd.DataFrame:
    path = latest("Maestra - Stock Detalle")
    print(f"  📄 {path.name}")

    df = pd.read_excel(path)                     # header=0 por defecto
    df = drop_blank_cols(df)
    df = df[df["Día"] != "Total"].copy()         # eliminar fila "Total"
    df = normalize_sku(df)

    df = df[df["Cadena"].isin(CADENAS) & df["Artículo ID"].isin(SKUS)].copy()
    df["Día"] = pd.to_datetime(df["Día"], errors="coerce")
    return df


def read_maestro() -> pd.DataFrame:
    return pd.read_excel(REPORT_PATH, sheet_name="MAESTRO")


# ── Columnas calculadas ────────────────────────────────────────────────────────

def calc_daily_sales(ventas: pd.DataFrame, today: date) -> pd.DataFrame:
    """
    Pivota la hoja Venta para obtener D0–D13 por sala × SKU.
    D0 = ayer (today-1), D1 = anteayer (today-2), ..., D13 = today-14.
    Replica: SUMIFS(Venta!$W, SKU=F, LocalID=D, Fecha=TODAY()-N)
    """
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
    """Agrega todas las columnas calculadas al DataFrame de stock."""

    # ── D0–D13 ────────────────────────────────────────────────────────────────
    dsales = calc_daily_sales(ventas, today)
    df = stock.merge(dsales, on=["Local ID", "Artículo ID"], how="left")
    d_cols = [f"D{i}" for i in range(14)]
    df[d_cols] = df[d_cols].fillna(0).astype(int)

    # ── L7D, L14D ─────────────────────────────────────────────────────────────
    df["L7D"]  = df[[f"D{i}" for i in range(7)]].sum(axis=1)
    df["L14D"] = df[d_cols].sum(axis=1)

    # ── Lookups desde MAESTRO ─────────────────────────────────────────────────
    # XLOOKUP(Local ID, MAESTRO!StoreNbr, MAESTRO!Encargado) → SUPERVISOR
    # XLOOKUP(Local ID, MAESTRO!StoreNbr, MAESTRO!Dia)       → ATENCION
    # XLOOKUP(Local ID, MAESTRO!SALA,     MAESTRO!INCENTIVO)  → INCENTIVO
    m = maestro.copy()
    m["Store Nbr"] = m["Store Nbr"].astype(str).str.strip()
    lid = df["Local ID"].astype(str).str.strip()

    sup_map  = m.dropna(subset=["Encargado"]).set_index("Store Nbr")["Encargado"].to_dict()
    aten_map = m.dropna(subset=["Dia"]).set_index("Store Nbr")["Dia"].to_dict()
    inc_map  = m.dropna(subset=["INCENTIVO"]).set_index("SALA")["INCENTIVO"].to_dict()

    df["SUPERVISOR"] = lid.map(sup_map).fillna("").replace(0, "")
    df["ATENCION"]   = lid.map(aten_map).fillna("").replace(0, "")
    df["INCENTIVO"]  = lid.map(inc_map).fillna("").replace(0, "")

    # ── Región desde Venta ────────────────────────────────────────────────────
    # XLOOKUP(Local ID, Venta!H, Venta!F) → Región
    region_map = (
        ventas.dropna(subset=["Región"])
        .drop_duplicates("Local ID")
        .set_index("Local ID")["Región"]
        .to_dict()
    )
    df["Región"] = df["Local ID"].map(region_map).fillna("")

    # ── Alertas ───────────────────────────────────────────────────────────────
    # Alerta Agencia    = IF(AND(Stock Disp > 24, D0+D1=0), 1, 0)
    # ALERTA REPOSICIÓN = IF(AND(Stock Disp >= 24, D0=0),   1, 0)
    sd = df["Stock Disponibilidad"].fillna(0)
    df["Alerta Agencia"]    = ((sd > 24)  & (df["D0"] + df["D1"] == 0)).astype(int)
    df["ALERTA REPOSICIÓN"] = ((sd >= 24) & (df["D0"] == 0)).astype(int)

    return df


# ── Escritura al Excel ─────────────────────────────────────────────────────────

def write_sheet(
    wb: openpyxl.Workbook,
    sheet_name: str,
    df: pd.DataFrame,
    header_row: int = 2,
) -> None:
    """
    Reemplaza los datos de una hoja preservando:
      - Fila 1 (template / fórmulas de referencia)
      - Fila header_row (encabezados)
    El orden de columnas se toma del encabezado actual del Excel.
    """
    ws = wb[sheet_name]

    # Leer encabezado → lista ordenada de nombres de columna
    header_vals = [
        ws.cell(row=header_row, column=c).value
        for c in range(1, ws.max_column + 1)
    ]

    # Borrar filas de data anteriores
    if ws.max_row > header_row:
        ws.delete_rows(header_row + 1, ws.max_row - header_row)

    # Escribir nuevas filas (ws.append es más eficiente que ws.cell en loop)
    df_cols = set(df.columns)
    for _, row in df.iterrows():
        row_data = [
            clean_val(row[str(h).strip()]) if h and str(h).strip() in df_cols else None
            for h in header_vals
        ]
        ws.append(row_data)

    print(f"  ✓ {sheet_name}: {len(df):,} filas escritas")


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    today = date.today()
    sep = "═" * 54

    print(f"\n{sep}")
    print(f"  Score Energy — Actualización Cencosud")
    print(f"  Fecha de ejecución: {today:%d/%m/%Y}")
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

    # 3. Escribir al reporte
    print("\n💾 Actualizando JUMBO_REPORTE.xlsx...")
    wb = openpyxl.load_workbook(REPORT_PATH)
    write_sheet(wb, "Venta",  ventas)
    write_sheet(wb, "Stock",  stock_final)
    wb.save(REPORT_PATH)

    # 4. Resumen
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
