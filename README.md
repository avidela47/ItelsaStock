# ItelsaStock

App estática (HTML/CSS/JS) para consultar stock y precio.

## Cómo se cargan los datos

Hay 2 modos:

1. **Precarga automática (recomendado para Vercel)**
   - La app intenta obtener `data/stock-data.json` al abrirse.
   - Si el JSON está disponible, se muestran los datos sin necesidad de subir el Excel.

2. **Carga manual de Excel (fallback)**
   - Si no existe el JSON (o falla la descarga), podés subir un `.xlsx` desde la interfaz.

## Generar / actualizar `data/stock-data.json`

El Excel fuente es `ItelsaStockDB.xlsx`.

### Requisitos

- Node.js 18+ (recomendado)

### Generación

En la raíz del proyecto:

```bash
npm install
npm run convert:json
```

Esto genera/actualiza:

- `data/stock-data.json`

## Deploy en Vercel (estático)

### Opción A (simple): mantener el JSON versionado

1. Ejecutá `npm run convert:json` localmente.
2. Commit de `data/stock-data.json` junto con los cambios.
3. Subí el repo a Vercel como **Static Site**.

Vercel va a servir:

- `index.html`
- `styles.css`
- `app.js`
- `data/stock-data.json`

### Opción B (automatizar el JSON en el build)

Si querés que Vercel regenere el JSON durante el build (útil si el Excel también está en el repo):

- Asegurate de tener `ItelsaStockDB.xlsx` en el repo.
- Configurá en Vercel:
  - **Build Command**: `npm install && npm run convert:json`
  - **Output Directory**: `.`

> Nota: este proyecto es un sitio estático; no necesita un framework. Vercel sirve los archivos tal cual.

## Notas

- La columna `PRECIO` se muestra formateada como `U$D` con 2 decimales.
- Si en tu Excel el nombre de columna para código no es exactamente `CODIGO`, ajustá el campo en `app.js` (función `handleSearchByCode`).
