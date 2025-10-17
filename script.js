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
        if (!locked) {
          locked = true;
        } else {
          locked = false;
        }
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
  const fixedCells = new Map();

  function generateUniqueNumbers(total) {
    const numbers = Array.from({ length: total }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  }

  function generateTable() {
    table.innerHTML = "";
    const total = rows * cols;
    const numbers = generateUniqueNumbers(total);
    let index = 0;

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td");
        const key = `${r},${c}`;

        if (fixedCells.has(key)) {
          td.textContent = fixedCells.get(key);
          td.classList.add("fixed");
          td.contentEditable = "true";
        } else {
          td.textContent = numbers[index++];
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
      fixedCells.set(key, td.textContent.trim());
      td.classList.add("fixed");
      td.contentEditable = "true";
    }
  }

  reloadBtn.addEventListener("click", generateTable);

  generateTable();
}
