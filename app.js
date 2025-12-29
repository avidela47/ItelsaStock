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
const viewJsonBtn = document.getElementById("view-json-btn");

const jsonModal = document.getElementById("json-modal");
const jsonPre = document.getElementById("json-pre");
const jsonCloseBtn = document.getElementById("json-close-btn");

const dataStatus = document.getElementById("data-status");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");

const DEFAULT_WHATSAPP_NUMBER = "5493512890110";

function normalizeWhatsAppNumber(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits;
}

function buildWhatsAppLink(numberDigits, message) {
  const digits = normalizeWhatsAppNumber(numberDigits);
  if (!digits) return null;
  const encoded = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${encoded}`;
}

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

function openJsonModal() {
  if (!jsonModal) return;
  jsonModal.classList.add("is-open");
  jsonModal.setAttribute("aria-hidden", "false");
}

function closeJsonModal() {
  if (!jsonModal) return;
  jsonModal.classList.remove("is-open");
  jsonModal.setAttribute("aria-hidden", "true");
}

async function showJsonViewer() {
  if (!jsonPre) return;
  openJsonModal();

  try {
    jsonPre.textContent = "Cargando...";
    const response = await fetch("data/stock-data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const payload = await response.json();
    jsonPre.textContent = JSON.stringify(payload, null, 2);
  } catch (error) {
    jsonPre.textContent = `No se pudo cargar el JSON.\n\n${String(error)}`;
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
  // Mostrar siempre el símbolo $ antes del valor
  return `$ ${currencyFormatter.format(numericValue)}`;
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
    fileInfo.textContent = "Subí un Excel para reemplazar los datos.";
    setDataStatus("excel", "Cargá un Excel para reemplazar los datos precargados.");
  });
}

if (reloadJsonBtn) {
  reloadJsonBtn.addEventListener("click", () => {
    fileInfo.textContent = "Reintentando precarga desde JSON...";
    loadDataFromJson();
  });
}

if (viewJsonBtn) {
  viewJsonBtn.addEventListener("click", showJsonViewer);
}

if (jsonCloseBtn) {
  jsonCloseBtn.addEventListener("click", closeJsonModal);
}

if (jsonModal) {
  jsonModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.getAttribute && target.getAttribute("data-close") === "true") {
      closeJsonModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeJsonModal();
});

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
    // Cache-busting: en algunos entornos/CDNs el cache del navegador/proxy puede interferir.
    // Con este query param garantizamos que el fetch pida la versión más reciente.
    const jsonUrl = `data/stock-data.json?v=${Date.now()}`;
    const response = await fetch(jsonUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const updatedLabel = payload.updatedAt
      ? new Date(payload.updatedAt).toLocaleString("es-AR", {
          timeZone: "America/Argentina/Cordoba",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
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
    fileInfo.textContent = "No se pudo precargar el JSON. Podés subir un Excel manualmente.";
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
  title.innerHTML = `
    <span class="code-card-title-label">Resultado para CODIGO:</span>
    <span class="code-card-code">${String(item["CODIGO"] ?? "")}<\/span>
  `;
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

  // Acción rápida: enviar por WhatsApp (solo si existe el registro)
  const waNumber = DEFAULT_WHATSAPP_NUMBER;
  const stockValue = item["STOCK"] ?? "";
  const priceValue = formatPriceValue(item[PRICE_KEY] ?? item["PRECIO"]);
  const messageLines = [
  `Hola Ariel, cotizame CANTIDAD: ____ de este producto para CLIENTE: ____`,
    `CODIGO: ${item["CODIGO"]}`,
    stockValue !== "" ? `STOCK: ${stockValue}` : null,
    priceValue ? `PRECIO: ${priceValue}` : null,
  ].filter(Boolean);
  const message = messageLines.join("\n");

  if (waNumber) {
    const waLink = buildWhatsAppLink(waNumber, message);
    if (waLink) {
      const actions = document.createElement("div");
      actions.className = "code-card-actions";

      const waBtn = document.createElement("a");
      waBtn.className = "whatsapp-btn";
      waBtn.href = waLink;
      waBtn.target = "_blank";
      waBtn.rel = "noopener noreferrer";
      waBtn.setAttribute("aria-label", "Enviar por WhatsApp");
      waBtn.innerHTML = `
        <span class="btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation" focusable="false">
            <path d="M12 2a10 10 0 0 0-8.66 15.02L2 22l5.11-1.31A10 10 0 1 0 12 2zm0 18.1c-1.56 0-3.06-.41-4.39-1.19l-.31-.18-3.03.78.8-2.95-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.53-5.86c-.25-.13-1.48-.73-1.71-.82-.23-.08-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.3.19-.55.06-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.51.11-.11.25-.3.37-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.48-.41-.42-.57-.42h-.48c-.17 0-.45.06-.68.32-.23.25-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.77 4.38 3.88.61.26 1.08.42 1.45.54.61.19 1.17.16 1.61.1.49-.07 1.48-.6 1.69-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" fill="currentColor" />
          </svg>
        </span>
        <span class="btn-label">Enviar a WhatsApp</span>
      `;

      actions.appendChild(waBtn);
      card.appendChild(actions);
    }
  }

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
