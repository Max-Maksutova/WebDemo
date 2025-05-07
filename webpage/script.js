async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.split("\n").filter(row => row.trim());
  const headers = rows[0].split(",");
  const data = rows.slice(1).map(row => {
    const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // split on commas outside quotes
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
  return { headers, data };
}

function renderTable(containerId, headers, data) {
  const table = document.getElementById(containerId);
  const thead = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";
  const rows = data.map(row => 
    "<tr>" + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>"
  ).join("");
  table.innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;
}

function setupSearch(inputId, tableId, data, headers) {
  document.getElementById(inputId).addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const filtered = data.filter(row =>
      headers.some(h => (row[h] || "").toLowerCase().includes(query))
    );
    renderTable(tableId, headers, filtered);
  });
}

async function init() {
  const [crs, fin] = await Promise.all([
    loadCSV("data/sampled_crs_list.csv"),
    loadCSV("data/sampled_financial_reports.csv"),
  ]);

  renderTable("crsTable", crs.headers, crs.data);
  setupSearch("crsSearch", "crsTable", crs.data, crs.headers);

  renderTable("finTable", fin.headers, fin.data);
  setupSearch("finSearch", "finTable", fin.data, fin.headers);
}

init();
