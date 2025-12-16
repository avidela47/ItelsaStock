// Referencias a elementos del DOM
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");

const searchArea = document.getElementById("search-area");
const searchInput = document.getElementById("search-input");
const resultsCount = document.getElementById("results-count");

const searchCodeArea = document.getElementById("search-code-area");
const codeInput = document.getElementById("code-input");
const codeBtn = document.getElementById("code-btn");
const clearBtn = document.getElementById("clear-btn");
const codeResult = document.getElementById("code-result");

const dataPanel = document.getElementById("data-panel");
const dataActions = document.getElementById("data-actions");
const changeDataBtn = document.getElementById("change-data-btn");
const reloadJsonBtn = document.getElementById("reload-json-btn");

const dataStatus = document.getElementById("data-status");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");

function setDataStatus(kind, text) {
  if (!dataStatus || !statusBadge || !statusText) return;

  dataStatus.style.display = "flex";
  statusText.textContent = text || "";

  if (kind === "success") {
    statusBadge.textContent = "Precargado";
    statusBadge.classList.add("is-success");
  } else {
    statusBadge.textContent = "Modo Excel";
    statusBadge.classList.remove("is-success");
  }
}

const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");

const PRICE_KEY = "PRECIO";
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const headerIcons = {
  CODIGO: `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <path d="M8 7h3v2H8v6h3v2H6V7h2zm10 0v10h-3v-2h3V9h-3V7h3z" fill="currentColor" />
  </svg>`,
  STOCK: `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <path d="M5 4h14v2H5zm2 4h10v2H7zm-2 4h14v2H5zm2 4h10v2H7z" fill="currentColor" />
  </svg>`,
  PRECIO: `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <path d="M12 3a3 3 0 0 1 3 3v1h2v2h-2v2h2v2h-2v1a3 3 0 0 1-3 3h-1v2H9v-2H7v-2h2v-2H7v-2h2V9H7V7h2V6a3 3 0 0 1 3-3z" fill="currentColor" />
  </svg>`
};

function parsePriceValue(value) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function formatPriceValue(value) {
  if (value === undefined || value === null || value === "") return "";
  const numericValue = parsePriceValue(value);
  if (numericValue === null) return String(value);
  return `U$D ${currencyFormatter.format(numericValue)}`;
}

// "Base de datos" en JSON (array de objetos)
let dataBase = [];
// Lista de encabezados (claves del JSON)
let headers = [];

function hydrateData(rows, infoText = "") {
  dataBase = Array.isArray(rows) ? rows : [];
  headers = dataBase.length ? Object.keys(dataBase[0]) : [];

  if (!dataBase.length) {
    fileInfo.textContent = infoText || "Sin datos disponibles.";
    renderTable([]);
    resultsCount.textContent = "Filas: 0";
    searchArea.style.display = "none";
    searchCodeArea.style.display = "none";
    return false;
  }

  renderTable(dataBase);
  searchArea.style.display = "flex";
  searchCodeArea.style.display = "flex";
  searchInput.value = "";
  codeInput.value = "";
  resultsCount.textContent = `Filas: ${dataBase.length}`;
  codeResult.textContent = "Ingrese un código y presione Buscar.";
  if (infoText) {
    fileInfo.textContent = infoText;
  }

  if (dataActions && changeDataBtn) {
    dataActions.style.display = "flex";
  }
  return true;
}

// Manejar selección de archivo
fileInput.addEventListener("change", handleFile, false);

// Manejar búsqueda de texto general
searchInput.addEventListener("input", handleSearch);

// Manejar búsqueda específica por CODIGO
codeBtn.addEventListener("click", handleSearchByCode);
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearchByCode();
  }
});
clearBtn.addEventListener("click", handleClearSearch);

if (changeDataBtn) {
  changeDataBtn.addEventListener("click", () => {
    if (fileInput) fileInput.value = "";
    if (dataPanel) dataPanel.classList.remove("data-loaded");
    if (dataActions) dataActions.style.display = "none";
    fileInfo.textContent = "Subí un Excel para actualizar los datos.";
    setDataStatus("excel", "Cargá un Excel para reemplazar los datos precargados.");
  });
}

if (reloadJsonBtn) {
  reloadJsonBtn.addEventListener("click", () => {
    fileInfo.textContent = "Reintentando precarga desde JSON...";
    loadDataFromJson();
  });
}

loadDataFromJson();

// Lee el archivo Excel y lo convierte a JSON (array de objetos)
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) {
    fileInfo.textContent = "Ningún archivo cargado.";
    return;
  }

  fileInfo.textContent = `Archivo cargado: ${file.name}`;

  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    // Usamos la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    /**
     * sheet_to_json:
     * - Toma la PRIMERA fila como encabezados.
     * - Devuelve array de objetos: [{col1: val1, col2: val2, ...}, ...]
     */
    dataBase = XLSX.utils.sheet_to_json(worksheet, {
      defval: "", // si hay celdas vacías, que devuelva string vacío
    });

    if (!dataBase || dataBase.length === 0) {
      fileInfo.textContent = "El archivo está vacío o no se pudo leer.";
      return;
    }

    hydrateData(dataBase, `Archivo cargado: ${file.name}`);

    // Log para ver la base JSON
    console.log("Base JSON cargada:", dataBase);
  };

  reader.onerror = () => {
    fileInfo.textContent = "Error al leer el archivo.";
  };

  reader.readAsArrayBuffer(file);
}

async function loadDataFromJson() {
  try {
    const response = await fetch("data/stock-data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const updatedLabel = payload.updatedAt
      ? new Date(payload.updatedAt).toLocaleString("es-AR")
      : null;
    const suffix = updatedLabel ? ` • Actualizado: ${updatedLabel}` : "";
    const infoText = `Datos precargados (${rows.length} filas)${suffix}`;
    const ok = hydrateData(rows, infoText);
    if (ok && dataPanel) {
      dataPanel.classList.add("data-loaded");
    }

    if (ok) {
      setDataStatus("success", infoText);
    }
  } catch (error) {
    console.warn("No se pudo cargar data/stock-data.json", error);
    fileInfo.textContent = "No se pudo cargar el JSON remoto. Podés subir un Excel manualmente.";
    setDataStatus("excel", "No se pudo precargar el JSON. Usá la carga manual.");
  }
}

// Renderiza la tabla a partir de un array de OBJETOS (JSON)
function renderTable(rowsJson) {
  // Encabezados
  tableHead.innerHTML = "";
  const headerRow = document.createElement("tr");

  headers.forEach((headerKey) => {
    const th = document.createElement("th");
    const iconKey = headerKey.trim().toUpperCase();
    const headerIconSvg = headerIcons[iconKey];

    if (headerIconSvg) {
      const content = document.createElement("span");
      content.className = "th-content";

      const iconSpan = document.createElement("span");
      iconSpan.className = "th-icon";
      iconSpan.setAttribute("aria-hidden", "true");
      iconSpan.innerHTML = headerIconSvg;

      const labelSpan = document.createElement("span");
      labelSpan.className = "th-label";
      labelSpan.textContent = headerKey;

      content.appendChild(iconSpan);
      content.appendChild(labelSpan);
      th.appendChild(content);
    } else {
      th.textContent = headerKey;
    }

    headerRow.appendChild(th);
  });

  tableHead.appendChild(headerRow);

  // Cuerpo
  tableBody.innerHTML = "";

  rowsJson.forEach((rowObj) => {
    const tr = document.createElement("tr");

    headers.forEach((headerKey) => {
      const td = document.createElement("td");
      const cellValue = rowObj[headerKey];
      const normalizedKey = headerKey.trim().toUpperCase();
      const displayValue =
        normalizedKey === PRICE_KEY ? formatPriceValue(cellValue) : cellValue ?? "";
      td.textContent = displayValue;
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

// Búsqueda general en TODAS las columnas
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!dataBase.length) return;

  if (query === "") {
    renderTable(dataBase);
    resultsCount.textContent = `Filas: ${dataBase.length}`;
    return;
  }

  // Filtramos filas donde ALGÚN campo contenga el texto
  const filtered = dataBase.filter((rowObj) => {
    return Object.values(rowObj).some((value) => {
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(query);
    });
  });

  renderTable(filtered);
  resultsCount.textContent = `Coincidencias: ${filtered.length}`;
}

// Búsqueda específica por CODIGO
function handleSearchByCode() {
  if (!dataBase.length) {
    codeResult.textContent = "Primero cargue un archivo.";
    return;
  }

  const code = codeInput.value.trim();
  if (code === "") {
    codeResult.textContent = "Ingrese un código para buscar.";
    return;
  }

  // IMPORTANTE:
  // Si tu columna en Excel se llama distinto (ejemplo "Código" con tilde),
  // cambiá "CODIGO" por el nombre exacto de la columna.
  const item = dataBase.find((row) => {
    const value = row["CODIGO"]; // <- acá el nombre de la columna
    if (value === undefined || value === null) return false;
    return String(value).toLowerCase() === code.toLowerCase();
  });

  if (!item) {
    codeResult.textContent = `No se encontró ningún registro con CODIGO "${code}".`;
    return;
  }

  // Armamos una "tarjeta" con todos los campos del registro
  codeResult.innerHTML = ""; // limpio

  const card = document.createElement("div");
  card.className = "code-card";

  const title = document.createElement("div");
  title.className = "code-card-title";
  title.textContent = `Resultado para CODIGO: ${item["CODIGO"]}`;
  card.appendChild(title);

  // Si querés mostrar solo CODIGO, STOCK, PRECIO, podrías hacerlo explícito.
  // Acá lo hacemos genérico: recorre todos los campos.
  headers.forEach((key) => {
    const row = document.createElement("div");
    row.className = "code-card-item";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = key;

    const valueSpan = document.createElement("span");
    const normalizedKey = key.trim().toUpperCase();
    const rawValue = item[key];
    valueSpan.textContent =
      normalizedKey === PRICE_KEY ? formatPriceValue(rawValue) : rawValue ?? "";

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    card.appendChild(row);
  });

  codeResult.appendChild(card);
}

function handleClearSearch() {
  searchInput.value = "";
  codeInput.value = "";

  if (!dataBase.length) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    resultsCount.textContent = "";
    codeResult.textContent = "Ingrese un código y presione Buscar.";
    return;
  }

  renderTable(dataBase);
  resultsCount.textContent = `Filas: ${dataBase.length}`;
  codeResult.textContent = "Ingrese un código y presione Buscar.";
  codeInput.focus();
}
