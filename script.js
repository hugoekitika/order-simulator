// =============== HOME PAGE =================
if (document.getElementById("grid-selector")) {
  const grid = document.getElementById("grid-selector");
  const selectionText = document.getElementById("selection");
  const confirmBtn = document.getElementById("confirm");

  let selectedRows = 0;
  let selectedCols = 0;

  const size = 10; // dimensione massima griglia visiva
  const cells = [];

  // Crea la griglia 10x10
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      grid.appendChild(cell);
      cells.push({ element: cell, r, c });

      cell.addEventListener("mouseover", () => {
        selectedRows = r + 1;
        selectedCols = c + 1;
        highlightGrid(selectedRows, selectedCols);
        selectionText.textContent = `Righe: ${selectedRows} × Colonne: ${selectedCols}`;
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
  const rows = parseInt(localStorage.getItem("rows"));
  const cols = parseInt(localStorage.getItem("cols"));
  const container = document.getElementById("table-container");
  const reloadBtn = document.getElementById("reload");

  const table = document.createElement("table");
  const fixedCells = new Set();

  function generateTable() {
    table.innerHTML = "";
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        const key = `${r},${c}`;
        if (!fixedCells.has(key)) {
          td.textContent = Math.floor(Math.random() * 12) + 1;
        } else {
          td.classList.add("fixed");
          td.contentEditable = "true";
          td.textContent = fixedCells.get(key);
        }
        td.addEventListener("click", () => toggleFix(td, r, c));
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    container.innerHTML = "";
    container.appendChild(table);
  }

  function toggleFix(td, r, c) {
    const key = `${r},${c}`;
    if (fixedCells.has(key)) {
      fixedCells.delete(key);
      td.classList.remove("fixed");
    } else {
      const value = td.textContent.trim();
      fixedCells.add(key);
      td.classList.add("fixed");
      td.contentEditable = "true";
      fixedCells[key] = value;
    }
  }

  reloadBtn.addEventListener("click", generateTable);

  generateTable();
}
