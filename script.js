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
          td.contentEditable = "false"; // fixed by default not editable until user toggles edit mode
          td.dataset.prev = String(v); // valore precedente per eventuale rollback
          td.dataset.state = 'fixed';
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

        // click per ciclare gli stati: free -> fixed -> fixed-edit -> free
        td.addEventListener("click", () => cycleFix(td, r, c));

        // quando una cella fissata viene modificata manualmente -> validate on blur
        td.addEventListener("blur", () => {
          // validate only if in edit mode
          if (td.dataset.state === 'fixed-edit') {
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

  // Ciclo di stato per la cella: free -> fixed -> fixed-edit -> free
  function cycleFix(td, r, c) {
    const key = `${r},${c}`;
    const total = rows * cols;
    const state = td.dataset.state || 'free';

    if (state === 'free') {
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
      td.contentEditable = "false"; // locked by default
      td.dataset.prev = String(val);
      td.dataset.state = 'fixed';
      // Non rigenerare la tabella qui: aggiorneremo le celle solo quando l'utente clicca 'Genera di nuovo'

    } else if (state === 'fixed') {
      // passa alla modalità edit per permettere la modifica manuale
      td.dataset.state = 'fixed-edit';
      td.classList.add('fixed-edit');
      td.contentEditable = 'true';
      // posizioniamo il cursore alla fine
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(td);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      td.focus();

    } else if (state === 'fixed-edit') {
      // terzo click: sblocca la casella
      fixedCells.delete(key);
      td.classList.remove('fixed', 'fixed-edit');
      td.contentEditable = 'false';
      delete td.dataset.prev;
      delete td.dataset.state;
      // Non rigenerare ora
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
      // torna alla modalità fixed (non-edit)
      td.dataset.state = 'fixed';
      td.classList.remove('fixed-edit');
      td.contentEditable = 'false';
      return;
    }

    // controlla duplicati: gli altri fissati non devono contenere newVal
    for (const [k, v] of fixedCells.entries()) {
      if (k !== key && Number(v) === newVal) {
        alert(`Il numero ${newVal} è già fissato in un'altra casella. Cambio annullato.`);
        td.textContent = String(prevVal !== null ? prevVal : "");
        td.dataset.state = 'fixed';
        td.classList.remove('fixed-edit');
        td.contentEditable = 'false';
        return;
      }
    }

    // aggiornamento accettato
    fixedCells.set(key, newVal);
    td.dataset.prev = String(newVal);
    // Non rigenerare qui: generateTable verrà chiamata solo quando l'utente clicca su 'Genera di nuovo'
    // Manteniamo la cella in stato 'fixed' non-edit
    td.dataset.state = 'fixed';
    td.classList.remove('fixed-edit');
    td.contentEditable = 'false';
  }

  // Bottone reload rigenera solo le celle non fissate (pool esclude fissati)
  reloadBtn.addEventListener("click", generateTable);

  // generazione iniziale
  generateTable();
}
