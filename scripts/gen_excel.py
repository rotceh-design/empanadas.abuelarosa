# Genera/actualiza empanadas_excel.xlsx: Maestro con catálogo vigente,
# Supuestos con línea dulce (relleno + queso + extra), hoja "Combinaciones Dulce"
# y hoja "Calendario del Día" (rotación completa de empanadas del día).
# Uso:  node --input-type=module -e "import {CATALOGO_SEED} from './src/data/catalogoSeed.js'; import {writeFileSync} from 'fs'; writeFileSync('tmp_catalogo.json', JSON.stringify({ings:CATALOGO_SEED}));"
#       npx vite-node scripts/dump_calendario.mjs
#       python scripts/gen_excel.py
# Idempotente: puedes correrlo las veces que quieras.
import json
import os
from copy import copy
from openpyxl import load_workbook

XLSX = os.environ.get('XLSX_OUT', 'empanadas_excel.xlsx')
SIN_EXTRA = '(sin extra)'

with open('tmp_catalogo.json', encoding='utf-8') as f:
    ings = json.load(f)['ings']

dulce_rellenos = sorted(
    [i for i in ings if i['linea'] == 'dulce' and i['categoria'] == 'proteina'],
    key=lambda i: i['orden'])
# Los quesos dulces son los mismos de la línea salada (mismo bloque en Supuestos)
dulce_quesos = sorted(
    [i for i in ings if i['linea'] == 'salada' and i['categoria'] == 'queso'],
    key=lambda i: i['orden'])
dulce_extras = sorted(
    [i for i in ings if i['linea'] == 'dulce' and i['categoria'] == 'acompanamiento'],
    key=lambda i: i['orden'])

N_REL = len(dulce_rellenos)
N_QUE = len(dulce_quesos)
N_EXT = len(dulce_extras)
N_OPC = N_REL * N_QUE * (N_EXT + 1)

wb = load_workbook(XLSX)


def copy_style(dst, src):
    dst.font = copy(src.font)
    dst.fill = copy(src.fill)
    dst.border = copy(src.border)
    dst.alignment = copy(src.alignment)
    dst.number_format = src.number_format


# ---------- 1) Maestro Ingredientes: catálogo vigente completo ----------
maestro = wb['Maestro Ingredientes']
plantilla_datos = 5
for r in range(5, maestro.max_row + 1):
    for c in range(1, 13):
        maestro.cell(row=r, column=c).value = None
fila = 5
for ing in ings:
    maestro.cell(row=fila, column=1, value=ing['id'])
    maestro.cell(row=fila, column=2, value=ing['nombre'])
    maestro.cell(row=fila, column=3, value=ing['categoria'])
    maestro.cell(row=fila, column=4, value=ing['linea'])
    maestro.cell(row=fila, column=5, value=', '.join(ing.get('tags') or []) or None)
    maestro.cell(row=fila, column=6, value='Sí' if ing.get('disponible', True) else 'No')
    maestro.cell(row=fila, column=7, value=ing.get('orden'))
    maestro.cell(row=fila, column=8, value=ing.get('porcionGramos'))
    maestro.cell(row=fila, column=9, value=ing.get('costoKg'))
    maestro.cell(row=fila, column=10, value=f'=I{fila}/1000*H{fila}')
    maestro.cell(row=fila, column=11, value=ing.get('precio'))
    maestro.cell(row=fila, column=12, value=f'=K{fila}-J{fila}')
    for c in range(1, 13):
        copy_style(maestro.cell(row=fila, column=c), maestro.cell(row=plantilla_datos, column=c))
    fila += 1
print(f'Maestro Ingredientes: {len(ings)} filas')

# ---------- 2) Supuestos: sección línea dulce ----------
sup = wb['Supuestos']
for r in range(58, 92):
    for c in range(1, 8):
        sup.cell(row=r, column=c).value = None
SUP_TITULO = 58
SUP_REL_HDR = 59
SUP_REL_INI = 60
SUP_REL_FIN = SUP_REL_INI + N_REL - 1
# Los quesos usan el bloque de la salada (Supuestos filas 18-21)
SUP_QUE_INI = 18
SUP_QUE_FIN = 21
SUP_EXT_HDR = SUP_REL_FIN + 2
SUP_EXT_INI = SUP_EXT_HDR + 1
SUP_EXT_FIN = SUP_EXT_INI + N_EXT - 1
SUP_MIN = SUP_EXT_FIN + 3
SUP_MAX = SUP_MIN + 1

sup.cell(row=SUP_TITULO, column=1, value='LÍNEA DULCE — 1 relleno + 1 queso (los de la salada) + hasta 4 extras opcionales (rango de precio propio)')
copy_style(sup.cell(row=SUP_TITULO, column=1), sup.cell(row=7, column=1))

def escribir_bloque(titulo_hdr_row, nombre_col, items):
    for col, txt in enumerate([nombre_col, 'Formato (kg)', 'Precio formato', 'Precio x gramo', 'Porción (g)', 'Costo x porción', 'Aporte $'], 1):
        sup.cell(row=titulo_hdr_row, column=col, value=txt)
        copy_style(sup.cell(row=titulo_hdr_row, column=col), sup.cell(row=8, column=col))
    for k, ing in enumerate(items):
        r = titulo_hdr_row + 1 + k
        sup.cell(row=r, column=1, value=ing['nombre'])
        sup.cell(row=r, column=2, value=1)
        sup.cell(row=r, column=3, value=ing['costoKg'])
        sup.cell(row=r, column=4, value=f'=C{r}/(B{r}*1000)')
        sup.cell(row=r, column=5, value=ing['porcionGramos'])
        sup.cell(row=r, column=6, value=f'=D{r}*E{r}')
        sup.cell(row=r, column=7, value=ing['precio'])
        for c in range(1, 8):
            copy_style(sup.cell(row=r, column=c), sup.cell(row=9, column=c))

escribir_bloque(SUP_REL_HDR, 'Relleno dulce', dulce_rellenos)
escribir_bloque(SUP_EXT_HDR, 'Extra dulce', dulce_extras)
sup.cell(row=SUP_MIN, column=1, value='Precio venta MÍN empanada dulce')
sup.cell(row=SUP_MIN, column=2, value=2790)
sup.cell(row=SUP_MIN, column=3, value='Piso garantizado línea dulce')
sup.cell(row=SUP_MAX, column=1, value='Precio venta MÁX empanada dulce (tope)')
sup.cell(row=SUP_MAX, column=2, value=3390)
sup.cell(row=SUP_MAX, column=3, value='Nunca se pasa, ni con extra')
for r in (SUP_MIN, SUP_MAX):
    for c in range(1, 4):
        copy_style(sup.cell(row=r, column=c), sup.cell(row=47, column=c))
print(f'Supuestos: dulce (rellenos {SUP_REL_INI}-{SUP_REL_FIN}, quesos salada {SUP_QUE_INI}-{SUP_QUE_FIN}, extras {SUP_EXT_INI}-{SUP_EXT_FIN}, rango B{SUP_MIN}-B{SUP_MAX})')

# ---------- 3) Hoja Combinaciones Dulce ----------
if 'Combinaciones Dulce' in wb.sheetnames:
    del wb['Combinaciones Dulce']
idx = wb.sheetnames.index('Combinaciones') + 1
cd = wb.create_sheet('Combinaciones Dulce', idx)
combs = wb['Combinaciones']
for col_letter in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']:
    cd.column_dimensions[col_letter].width = combs.column_dimensions[col_letter].width

cd.cell(row=1, column=1, value=f'COMBINACIONES DULCE — {N_OPC} opciones ({N_REL} rellenos × {N_QUE} quesos × {N_EXT + 1} extras, incluye sin extra) con costo, precio y margen')
copy_style(cd.cell(row=1, column=1), combs.cell(row=1, column=1))
headers = ['Relleno', 'Queso', 'Extra', 'Costo masa', 'Costo relleno', 'Costo queso', 'Costo extra', 'Costo total', 'Aporte precio', 'Precio venta', 'Ganancia bruta', 'Margen %']
for c, txt in enumerate(headers, 1):
    cd.cell(row=2, column=c, value=txt)
    copy_style(cd.cell(row=2, column=c), combs.cell(row=2, column=min(c, 15)))

row = 3
for rel in dulce_rellenos:
    for que in dulce_quesos:
        for extra in [None] + dulce_extras:
            cd.cell(row=row, column=1, value=rel['nombre'])
            cd.cell(row=row, column=2, value=que['nombre'])
            cd.cell(row=row, column=3, value=extra['nombre'] if extra else SIN_EXTRA)
            cd.cell(row=row, column=4, value='=Supuestos!$C$5')
            cd.cell(row=row, column=5, value=f'=INDEX(Supuestos!$F${SUP_REL_INI}:$F${SUP_REL_FIN},MATCH($A{row},Supuestos!$A${SUP_REL_INI}:$A${SUP_REL_FIN},0))')
            cd.cell(row=row, column=6, value=f'=INDEX(Supuestos!$F${SUP_QUE_INI}:$F${SUP_QUE_FIN},MATCH($B{row},Supuestos!$A${SUP_QUE_INI}:$A${SUP_QUE_FIN},0))')
            cd.cell(row=row, column=7, value=f'=IF($C{row}="{SIN_EXTRA}",0,INDEX(Supuestos!$F${SUP_EXT_INI}:$F${SUP_EXT_FIN},MATCH($C{row},Supuestos!$A${SUP_EXT_INI}:$A${SUP_EXT_FIN},0)))')
            cd.cell(row=row, column=8, value=f'=D{row}+E{row}+F{row}+G{row}')
            cd.cell(row=row, column=9, value=f'=INDEX(Supuestos!$G${SUP_REL_INI}:$G${SUP_REL_FIN},MATCH($A{row},Supuestos!$A${SUP_REL_INI}:$A${SUP_REL_FIN},0))+INDEX(Supuestos!$G${SUP_QUE_INI}:$G${SUP_QUE_FIN},MATCH($B{row},Supuestos!$A${SUP_QUE_INI}:$A${SUP_QUE_FIN},0))+IF($C{row}="{SIN_EXTRA}",0,INDEX(Supuestos!$G${SUP_EXT_INI}:$G${SUP_EXT_FIN},MATCH($C{row},Supuestos!$A${SUP_EXT_INI}:$A${SUP_EXT_FIN},0)))')
            cd.cell(row=row, column=10, value=f'=MEDIAN(Supuestos!$B${SUP_MIN},I{row},Supuestos!$B${SUP_MAX})')
            cd.cell(row=row, column=11, value=f'=J{row}-H{row}')
            cd.cell(row=row, column=12, value=f'=K{row}/J{row}')
            for c in range(1, 13):
                copy_style(cd.cell(row=row, column=c), combs.cell(row=3, column=min(c, 15)))
            row += 1
ULTIMA = row - 1
print(f'Combinaciones Dulce: {ULTIMA - 2} filas (3-{ULTIMA})')

# ---------- 4) Guía: índice + regla de precio dulce ----------
guia = wb['Guía']
ya_indexada = any(
    guia.cell(row=r, column=2).value == 'Combinaciones Dulce'
    for r in range(1, guia.max_row + 1)
)
if not ya_indexada:
    guia.insert_rows(14)
    for c in range(1, 4):
        copy_style(guia.cell(row=14, column=c), guia.cell(row=13, column=c))
    for r in range(15, 19):
        v = guia.cell(row=r, column=1).value
        if isinstance(v, int):
            guia.cell(row=r, column=1, value=v + 1)
if ya_indexada:
    for r in range(1, guia.max_row + 1):
        if guia.cell(row=r, column=2).value == 'Combinaciones Dulce':
            guia.cell(row=r, column=3, value=f'Las {N_OPC} opciones de la línea dulce ({N_REL} rellenos × {N_QUE} quesos × extras) con costo, precio (tope $3.390) y margen')
else:
    guia.cell(row=14, column=1, value=9)
    guia.cell(row=14, column=2, value='Combinaciones Dulce')
    guia.cell(row=14, column=3, value=f'Las {N_OPC} opciones de la línea dulce ({N_REL} rellenos × {N_QUE} quesos × extras) con costo, precio (tope $3.390) y margen')
if not any('línea dulce' in str(guia.cell(row=r, column=1).value or '') for r in range(1, guia.max_row + 1)):
    guia.cell(row=guia.max_row + 2, column=1, value='• La línea dulce (1 relleno + 1 queso dulce + hasta 4 extras) tiene rango propio: mínimo $2.790 y tope $3.390 — ver hoja Combinaciones Dulce.')
    copy_style(guia.cell(row=guia.max_row, column=1), guia.cell(row=24, column=1))
print('Guía: índice actualizado + regla dulce')

# ---------- 5) Resumen Costos: bloque línea dulce ----------
rc = wb['Resumen Costos']
if any('LÍNEA DULCE' in str(rc.cell(row=r, column=1).value or '') for r in range(1, rc.max_row + 1)):
    base = next(r for r in range(1, rc.max_row + 1) if 'LÍNEA DULCE' in str(rc.cell(row=r, column=1).value))
else:
    base = rc.max_row + 2
rc.cell(row=base, column=1, value='LÍNEA DULCE — resumen')
copy_style(rc.cell(row=base, column=1), rc.cell(row=17, column=1))
bloque = [
    ('Opciones (rellenos × quesos × extras, incluye sin extra)', f"=COUNTA('Combinaciones Dulce'!A3:A{ULTIMA})"),
    ('Precio venta mínimo', f"=MIN('Combinaciones Dulce'!J3:J{ULTIMA})"),
    ('Precio venta máximo', f"=MAX('Combinaciones Dulce'!J3:J{ULTIMA})"),
    ('Precio venta promedio', f"=AVERAGE('Combinaciones Dulce'!J3:J{ULTIMA})"),
    ('Ganancia bruta promedio', f"=AVERAGE('Combinaciones Dulce'!K3:K{ULTIMA})"),
    ('Margen % promedio', f"=AVERAGE('Combinaciones Dulce'!L3:L{ULTIMA})"),
]
for k, (label, formula) in enumerate(bloque):
    rc.cell(row=base + 1 + k, column=1, value=label)
    rc.cell(row=base + 1 + k, column=2, value=formula)
    copy_style(rc.cell(row=base + 1 + k, column=1), rc.cell(row=3, column=1))
    copy_style(rc.cell(row=base + 1 + k, column=2), rc.cell(row=3, column=2))
print(f'Resumen Costos: bloque dulce en fila {base}')

# ---------- 6) Hoja Calendario del Día: rotación completa ----------
def cl(n):
    """Número con separador de miles chileno (8.096)."""
    return f'{n:,}'.replace(',', '.')

CAL_ULT = None
rs = None
if os.path.exists('tmp_calendario.json'):
    with open('tmp_calendario.json', encoding='utf-8') as f:
        cal = json.load(f)
    rs = cal['resumen']
    if 'Calendario del Día' in wb.sheetnames:
        del wb['Calendario del Día']
    cal_ws = wb.create_sheet('Calendario del Día')
    cal_ws.cell(row=1, column=1, value=(
        f"CALENDARIO EMPANADAS DEL DÍA — universo completo {cl(rs['recetasTotales'])} recetas "
        f"({cl(rs['saladas'])} saladas + {cl(rs['dulcesTotal'])} dulces), 3 por día, ciclo de {cl(rs['diasCiclo'])} días "
        f"({cal['inicio']} a {cal['fin']}, ~{rs['anos']} años) sin repetir. "
        f"Dulces: {rs['dulcesMostradas']} repartidas en {rs['diasConDulce']} días."
    ))
    copy_style(cal_ws.cell(row=1, column=1), combs.cell(row=1, column=1))
    cal_headers = ['Fecha', 'Día', 'Slot', 'Línea', 'Proteína', 'Queso', 'Acompañamientos', 'Precio día', 'Precio normal']
    for c, txt in enumerate(cal_headers, 1):
        cal_ws.cell(row=2, column=c, value=txt)
        copy_style(cal_ws.cell(row=2, column=c), combs.cell(row=2, column=min(c, 15)))
    cal_row = 3
    for fil in cal['filas']:
        cal_ws.cell(row=cal_row, column=1, value=fil['fecha'])
        cal_ws.cell(row=cal_row, column=2, value=fil['dia'])
        cal_ws.cell(row=cal_row, column=3, value=fil['slot'])
        cal_ws.cell(row=cal_row, column=4, value=fil['linea'])
        cal_ws.cell(row=cal_row, column=5, value=fil['proteina'])
        cal_ws.cell(row=cal_row, column=6, value=fil['queso'])
        cal_ws.cell(row=cal_row, column=7, value=fil['acompanamientos'])
        cal_ws.cell(row=cal_row, column=8, value=fil['precioDia'])
        cal_ws.cell(row=cal_row, column=9, value=fil['precioNormal'])
        for c in range(1, 10):
            copy_style(cal_ws.cell(row=cal_row, column=c), combs.cell(row=3, column=min(c, 15)))
        cal_row += 1
    CAL_ULT = cal_row - 1
    for col, w in {'A': 12, 'B': 7, 'C': 6, 'D': 9, 'E': 18, 'F': 16, 'G': 44, 'H': 12, 'I': 14}.items():
        cal_ws.column_dimensions[col].width = w
    cal_ws.freeze_panes = 'A3'
    cal_ws.auto_filter.ref = f'A2:I{CAL_ULT}'
    print(f'Calendario del Día: {CAL_ULT - 2} filas (3-{CAL_ULT}) — {cal["inicio"]} a {cal["fin"]}')
else:
    print('Calendario del Día: omitido (falta tmp_calendario.json — corre dump_calendario.mjs)')

# ---------- 7) Guía: índice de Calendario + regla del día vigente ----------
if rs:
    guia_idx_ok = any(guia.cell(row=r, column=2).value == 'Calendario del Día' for r in range(1, guia.max_row + 1))
    if not guia_idx_ok:
        filas_idx = [r for r in range(5, guia.max_row + 1)
                     if isinstance(guia.cell(row=r, column=1).value, int) and guia.cell(row=r, column=2).value]
        last_idx = max(filas_idx)
        r = last_idx + 1
        if all(guia.cell(row=r, column=c).value in (None, '') for c in range(1, 4)):
            # La fila destino puede ser un spacer combinado: descombinar para poder escribir.
            for mr in list(guia.merged_cells.ranges):
                if mr.min_row <= r <= mr.max_row:
                    guia.unmerge_cells(str(mr))
            guia.cell(row=r, column=1, value=guia.cell(row=last_idx, column=1).value + 1)
            guia.cell(row=r, column=2, value='Calendario del Día')
            guia.cell(row=r, column=3, value=f'La rotación completa de las 3 empanadas del día: {cl(rs["diasCiclo"])} días que cubren las {cl(rs["recetasTotales"])} combinaciones sin repetir')
            for c in range(1, 4):
                copy_style(guia.cell(row=r, column=c), guia.cell(row=last_idx, column=c))
    # Regla del día: reemplaza el texto obsoleto ("terrestre/mar/vegana") por el ciclo vigente
    for r in range(1, guia.max_row + 1):
        v = str(guia.cell(row=r, column=1).value or '')
        if 'empanadas del día' in v and 'cambian cada día' in v:
            guia.cell(row=r, column=1, value=(
                f"· Las 3 empanadas del día rotan sobre las {cl(rs['recetasTotales'])} combinaciones "
                f"({cl(rs['saladas'])} saladas + {cl(rs['dulcesTotal'])} dulces): 3 al día, siempre distintas, y cada receta "
                f"vuelve al completar los {cl(rs['diasCiclo'])} días del ciclo (~{rs['anos']} años). "
                "Se venden a $2.990 fijo y cambian a las 00:00."
            ))
            break
    print('Guía: índice Calendario + regla del día actualizada')

wb.save(XLSX)
print(f'{XLSX} actualizado — {len(wb.sheetnames)} hojas, {N_OPC} combinaciones dulce')
