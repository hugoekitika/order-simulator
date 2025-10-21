if (document.getElementById("table-container")) {
  const rows = parseInt(localStorage.getItem("rows"), 10) || 0;
  const cols = parseInt(localStorage.getItem("cols"), 10) || 0;
  const container = document.getElementById("table-container");
  const reloadBtn = document.getElementById("reload");
  const noteContainer = document.getElementById("note-entries");
  const table = document.createElement("table");

  const fixedCells = new Map(); // key -> numero fissato

  let tableNumbers = []; // numeri correnti della tabella (1..rows*cols)

  // generatore numeri unici da 1 a N escluse le fissate
  function generateUniquePool(total, excludedSet) {
    const pool = [];
    for (let i = 1; i <= total; i++) {
      if (!excludedSet.has(i)) pool.push(i);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function generateTable() {
    table.innerHTML = "";
    const total = rows * cols;

    // numeri già fissati
    const fixedNumbers = new Set(Array.from(fixedCells.values()).map(Number));
    // pool di numeri liberi
    const pool = generateUniquePool(total, fixedNumbers);
    let poolIndex = 0;

    tableNumbers = []; // reset lista numeri attuali

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        const key = `${r},${c}`;

        if (fixedCells.has(key)) {
          td.textContent = fixedCells.get(key);
          td.classList.add("fixed");
          td.dataset.fixed = "true";
        } else {
          td.textContent = poolIndex < pool.length ? pool[poolIndex++] : "0";
          td.dataset.fixed = "false";
        }

        tableNumbers.push(Number(td.textContent));

        td.addEventListener("click", () => handleCellClick(td, key));

        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    container.innerHTML = "";
    container.appendChild(table);

    generateNotepad();
  }

  // Click sulla cella
  function handleCellClick(td, key) {
    if (td.dataset.fixed === "false") {
      // blocca la cella
      fixedCells.set(key, td.textContent);
      td.classList.add("fixed");
      td.dataset.fixed = "true";
    } else {
      // abilita modifica manuale della cella bloccata
      const newVal = prompt(`Inserisci numero per questa cella (1-${rows*cols}):`, td.textContent);
      const valNum = parseInt(newVal, 10);
      if (!Number.isInteger(valNum) || valNum < 1 || valNum > rows*cols) {
        alert("Valore non valido.");
        return;
      }
      // controlla duplicati
      if (Array.from(fixedCells.values()).some(v => Number(v) === valNum && v !== td.textContent)) {
        alert("Numero già presente in un'altra cella fissata.");
        return;
      }
      td.textContent = valNum;
      fixedCells.set(key, valNum);
    }
    // non ricaricare altre celle
    generateNotepad();
  }

  // Aggiorna il blocco note
  function generateNotepad() {
    noteContainer.innerHTML = "";
    tableNumbers.forEach(num => {
      const rowDiv = document.createElement("div");
      const input = document.createElement("input");
      input.value = "";
      rowDiv.textContent = `${num} = `;
      rowDiv.appendChild(input);
      noteContainer.appendChild(rowDiv);
    });
  }

  reloadBtn.addEventListener("click", generateTable);

  generateTable();
}
