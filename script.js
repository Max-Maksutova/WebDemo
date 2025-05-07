// script.js
async function loadCSV(url, defaultType) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim() || ""]));
    obj.reportType = obj.reportType || defaultType;
    return obj;
  });
  return data;
}

function getUniqueValues(data, key) {
  return [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
}

function renderDropdown(id, values) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">${id === "agencyFilter" ? "Topic/Agency" : "Year"}</option>`;
  values.forEach(v => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

function renderTags(types) {
  const tagContainer = document.getElementById("tagContainer");
  tagContainer.innerHTML = "";
  types.forEach(type => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = type;
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
  const agencyOrTopic = document.getElementById("agencyFilter").value;
  const year = document.getElementById("yearFilter").value;
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

  const filtered = reportData.filter(row => {
    const matchesSearch = !searchVal || row.title.toLowerCase().includes(searchVal) || row.summary.toLowerCase().includes(searchVal);
    const matchesType = activeTags.length === 0 || activeTags.includes(row.reportType);
    const matchesAgencyOrTopic = !agencyOrTopic || (row.reportType === "CRS" ? row.topic === agencyOrTopic : row.agency === agencyOrTopic);
    const matchesYear = !year || row.date.startsWith(year);
    return matchesSearch && matchesType && matchesAgencyOrTopic && matchesYear;
  });

  const container = document.getElementById("reportList");
  container.innerHTML = "";

  filtered.forEach(row => {
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <div class="badge">${row.reportType}</div>
      <h3>${row.title}</h3>
      <p>${row.summary}</p>
      <p><strong>${row.reportType === "CRS" ? row.topic : row.agency}</strong></p>
      <p>${row.date}</p>
    `;
    container.appendChild(card);
  });
}

async function init() {
  const crsData = await loadCSV("data/sampled_crs_list.csv", "CRS");
  const finData = await loadCSV("data/sampled_financial_reports.csv", "");

  reportData = [...crsData, ...finData].map(row => {
    const isCRS = row.reportType === "CRS";
    return {
      title: row["title"] || row["Title"] || "Untitled",
      summary: row["summary"] || row["Summary"] || "",
      agency: isCRS ? "" : row["source"] || row["Agency"] || "Unknown",
      topic: isCRS ? (row["topics"] || row["Topic"] || "Misc").split(";")[0].trim() : "",
      date: row["date"] || row["Date"] || "",
      reportType: row["reportType"] || "Unknown"
    };
  });

  const combinedValues = [...reportData.map(r => r.reportType === "CRS" ? r.topic : r.agency)];
  renderDropdown("agencyFilter", getUniqueValues(combinedValues));
  renderDropdown("yearFilter", getUniqueValues(reportData.map(r => r.date.split("-")[0])));
  renderTags(["CRS", "AFR", "PAR", "CJ"]);

  document.getElementById("searchInput").oninput = renderReports;
  document.getElementById("agencyFilter").onchange = renderReports;
  document.getElementById("yearFilter").onchange = renderReports;

  renderReports();
}

init();
