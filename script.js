async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0];
  const data = rows.slice(1).map(row => Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim() || ""])));
  return data;
}

function getUniqueValues(data, key) {
  return [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
}

function renderDropdown(id, values) {
  const select = document.getElementById(id);
  values.forEach(v => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

function renderTags(tags) {
  const tagContainer = document.getElementById("tagContainer");
  tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    span.onclick = () => {
      span.classList.toggle("active");
      renderReports();
    };
    tagContainer.appendChild(span);
  });
}

let reportData = [];

function renderReports() {
  const searchVal = document.getElementById("searchInput").value.toLowerCase();
  const agency = document.getElementById("agencyFilter").value;
  const year = document.getElementById("yearFilter").value;
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

  const filtered = reportData.filter(row => {
    return (!searchVal || row.title.toLowerCase().includes(searchVal) || row.summary.toLowerCase().includes(searchVal)) &&
           (!agency || row.agency === agency) &&
           (!year || row.date.startsWith(year)) &&
           (activeTags.length === 0 || activeTags.some(tag => row.tags?.includes(tag)));
  });

  const container = document.getElementById("reportList");
  container.innerHTML = "";

  filtered.forEach(row => {
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <h3>${row.title}</h3>
      <p>${row.summary}</p>
      <p><strong>${row.agency}</strong></p>
      <p>${row.date}</p>
    `;
    container.appendChild(card);
  });
}

async function init() {
  const crs = await loadCSV("data/sampled_crs_list.csv");

  // normalize column names
  reportData = crs.map(row => ({
    title: row["title"] || row["Title"] || "Untitled",
    summary: row["summary"] || row["Summary"] || "",
    agency: row["source"] || row["Agency"] || "Unknown",
    date: row["date"] || row["Date"] || "",
    tags: (row["topics"] || row["Tags"] || "").split(";").map(t => t.trim()).filter(Boolean),
  }));

  renderDropdown("agencyFilter", getUniqueValues(reportData, "agency"));
  renderDropdown("yearFilter", getUniqueValues(reportData.map(r => r.date.split("-")[0])));
  renderTags([...new Set(reportData.flatMap(r => r.tags || []))]);

  document.getElementById("searchInput").oninput = renderReports;
  document.getElementById("agencyFilter").onchange = renderReports;
  document.getElementById("yearFilter").onchange = renderReports;

  renderReports();
}

init();
