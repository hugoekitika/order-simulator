// =============== HOME PAGE =================
if (document.getElementById("grid-selector")) {
  const grid = document.getElementById("grid-selector");
  const selectionText = document.getElementById("selection");
  const confirmBtn = document.getElementById("confirm");

  let selectedRows = 0;
  let selectedCols = 0;
  let locked = false;

  const size = 10; // dimensione massima griglia visiva
  const cells = [];

  // Crea la griglia 10x10
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      grid.appendChild(cell);
      cells.push({ element: cell, r, c });

      // evidenzia durante il passaggio del mouse
      cell.addEventListener("mouseover", () => {
        if (!locked) {
          selectedRows = r + 1;
          selectedCols = c + 1;
          highlightGrid(selectedRows, selectedCols);
          selectionText.textContent = `Righe: ${selectedRows} × Colonne: ${selectedCols}`;
        }
      });

      // blocca o sblocca la selezione con click
      cell.addEventListener("click", () => {
        locked = !locked;
      });
    }
  }

  function highlightGrid(rows, cols) {
    cells.forEach(({ element, r, c }) => {
      element.classList.toggle("active", r < rows && c < cols);
    });
  }

  confirmBtn.addEventListener("click", () => {
    if (selectedRows > 0 && selectedCols > 0) {
      localStorage.setItem("rows", selectedRows);
      localStorage.setItem("cols", selectedCols);
      window.location.href = "program.html";
    } else {
      alert("Seleziona almeno 1 riga e 1 colonna!");
    }
  });
}

// =============== PROGRAM PAGE =================
if (document.getElementById("table-container")) {
  const rows = parseInt(localStorage.getItem("rows"), 10) || 0;
  const cols = parseInt(localStorage.getItem("cols"), 10) || 0;
  const container = document.getElementById("table-container");
  const reloadBtn = document.getElementById("reload");
  const table = document.createElement("table");

  // Map key -> integer value (es. "0,1" -> 5)
  const fixedCells = new Map();

  // Genera array 1..total esclusi i numeri fissati
  function generateUniquePool(total, excludedSet) {
    const pool = [];
    for (let i = 1; i <= total; i++) {
      if (!excludedSet.has(i)) pool.push(i);
    }
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // Crea la tabella, assegnando i numeri unici esclusi quelli fissati
  function generateTable() {
    table.innerHTML = "";
    const total = rows * cols;

    // build set dei numeri già fissati
    const fixedNumbers = new Set(Array.from(fixedCells.values()).map(v => Number(v)));

    // se per errore un numero fissato è fuori range -> lo rimuoviamo
    for (const [k, v] of fixedCells.entries()) {
      const num = Number(v);
      if (!Number.isInteger(num) || num < 1 || num > total) {
        fixedCells.delete(k);
        fixedNumbers.delete(num);
      }
    }

    // crea pool di numeri disponibili (1..total esclusi quelli fissati)
    const pool = generateUniquePool(total, fixedNumbers);
    let poolIndex = 0;

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        const key = `${r},${c}`;

        if (fixedCells.has(key)) {
          // usa il valore fissato
          const v = fixedCells.get(key);
          td.textContent = String(v);
          td.classList.add("fixed");
          td.contentEditable = "true";
          td.dataset.prev = String(v); // valore precedente per eventuale rollback
        } else {
          // assegna next numero disponibile dal pool
          if (poolIndex < pool.length) {
            td.textContent = String(pool[poolIndex++]);
          } else {
            // caso limite: non ci sono numeri disponibili (dovrebbe essere impossibile
            // se la logica di esclusione è corretta). In tal caso scriviamo 0.
            td.textContent = "0";
          }
          td.contentEditable = "false";
        }

        // click per fissare/sbloccare
        td.addEventListener("click", () => toggleFix(td, r, c));

        // quando una cella fissata viene modificata manualmente -> validate on blur
        td.addEventListener("blur", () => {
          if (td.classList.contains("fixed")) {
            handleFixedEditBlur(td, key, total);
          }
        });

        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    container.innerHTML = "";
    container.appendChild(table);
  }

  // Tentativo di fissare/sbloccare cella
  function toggleFix(td, r, c) {
    const key = `${r},${c}`;
    const total = rows * cols;

    if (fixedCells.has(key)) {
      // sblocca
      fixedCells.delete(key);
      td.classList.remove("fixed");
      td.contentEditable = "false";
      td.removeAttribute("data-prev");
      // rigenera per riordinare senza il fisso
      generateTable();
    } else {
      // prova a fissare: valida valore corrente
      const raw = td.textContent.trim();
      const val = Number(raw);

      if (!Number.isInteger(val) || val < 1 || val > total) {
        alert(`Per fissare inserisci un numero intero valido tra 1 e ${total}.`);
        return;
      }

      // evita duplicati con altri fissati
      const fixedNumbers = new Set(Array.from(fixedCells.values()).map(v => Number(v)));
      if (fixedNumbers.has(val)) {
        alert(`Il numero ${val} è già fissato in un'altra casella. Scegline un altro.`);
        return;
      }

      fixedCells.set(key, val);
      td.classList.add("fixed");
      td.contentEditable = "true";
      td.dataset.prev = String(val);
      // rigenera per rimuovere il numero fissato dal pool
      generateTable();
    }
  }

  // Gestisce l'evento blur su una cella fissata (modifica manuale)
  function handleFixedEditBlur(td, key, total) {
    const raw = td.textContent.trim();
    const newVal = Number(raw);
    const prevVal = td.dataset.prev ? Number(td.dataset.prev) : null;

    if (!Number.isInteger(newVal) || newVal < 1 || newVal > total) {
      alert(`Valore non valido. Deve essere un intero tra 1 e ${total}. Cambio annullato.`);
      // rollback
      td.textContent = String(prevVal !== null ? prevVal : "");
      return;
    }

    // controlla duplicati: gli altri fissati non devono contenere newVal
    for (const [k, v] of fixedCells.entries()) {
      if (k !== key && Number(v) === newVal) {
        alert(`Il numero ${newVal} è già fissato in un'altra casella. Cambio annullato.`);
        td.textContent = String(prevVal !== null ? prevVal : "");
        return;
      }
    }

    // aggiornamento accettato
    fixedCells.set(key, newVal);
    td.dataset.prev = String(newVal);
    // rigenera per aggiornare pool e posizioni
    generateTable();
  }

  // Bottone reload rigenera solo le celle non fissate (pool esclude fissati)
  reloadBtn.addEventListener("click", generateTable);

  // generazione iniziale
  generateTable();
}
