// script.js
async function loadCSVasDataFrame(url, reportType) {
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.split(/\r?\n/);
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;
    const values = [];
    let inQuotes = false;
    let value = '';
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(value);
        value = '';
      } else {
        value += char;
      }
    }
    values.push(value);
    const obj = Object.fromEntries(headers.map((h, idx) => [h.trim(), values[idx]?.trim() || ""]));
    if (reportType) obj.reportType = reportType;
    rows.push(obj);
  }

  return rows;
}

function extractUnique(df, key, splitter = null) {
  const all = df.flatMap(row => {
    const value = row[key] || "";
    return splitter ? value.split(splitter).map(v => v.trim()) : [value.trim()];
  });
  return [...new Set(all.filter(Boolean))].sort();
}

function renderMultiselect(id, values) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  values.forEach(v => {
    const option = document.createElement("option");
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

let reportData = [];
let agencyOptions = [];
let topicOptions = [];

function getSelectedValues(select) {
  return [...select.selectedOptions].map(opt => opt.value);
}

function renderReports() {
  const searchVal = document.getElementById("searchInput").value.toLowerCase();
  const selectedAgencies = getSelectedValues(document.getElementById("agencyFilter"));
  const selectedTopics = getSelectedValues(document.getElementById("topicFilter"));
  const year = document.getElementById("yearFilter").value;
  const activeTags = [...document.querySelectorAll(".tag.active")].map(t => t.textContent);

  const filtered = reportData.filter(row => {
    const matchesSearch = !searchVal || row.title.toLowerCase().includes(searchVal) || row.summary.toLowerCase().includes(searchVal);
    const matchesType = activeTags.length === 0 || activeTags.includes(row.reportType);
    const matchesAgency = row.reportType !== "CRS" ?
      (selectedAgencies.length === 0 || selectedAgencies.some(a => row.agency === a)) : true;
    const matchesTopic = row.reportType === "CRS" ?
      (selectedTopics.length === 0 || row.topics.some(t => selectedTopics.includes(t))) : true;
    const matchesYear = !year || row.date.startsWith(year);
    return matchesSearch && matchesType && matchesAgency && matchesTopic && matchesYear;
  });

  const container = document.getElementById("reportList");
  container.innerHTML = "";

  filtered.forEach(row => {
    const card = document.createElement("div");
    card.className = "report-card";
    const pdfLink = row.pdf_url ? `<p><a href="${row.pdf_url}" target="_blank">PDF Report</a></p>` : "";
    const webLink = row.web_url ? `<p><a href="${row.web_url}" target="_blank">Web Page</a></p>` : "";
    card.innerHTML = `
      <div class="badge">${row.reportType}</div>
      <h3>${row.title}</h3>
      <p class="summary">${row.summary}</p>
      <p><strong>${row.reportType === "CRS" ? row.topicDisplay : row.agency}</strong></p>
      <p>${row.date}</p>
      ${pdfLink}
      ${webLink}
    `;
    const summaryEl = card.querySelector(".summary");
    summaryEl.addEventListener("click", () => summaryEl.classList.toggle("expanded"));
    container.appendChild(card);
  });
}

async function init() {
  const crsRaw = await loadCSVasDataFrame("data/sampled_crs_list.csv", "CRS");
  const finRaw = await loadCSVasDataFrame("data/sampled_financial_reports.csv", "");

  reportData = [...crsRaw.map(row => ({
    title: row.title || "Untitled",
    summary: row.summary || "",
    agency: "",
    topicDisplay: (row.topics || "Misc").split(",")[0].trim(),
    topics: (row.topics || "").split(",").map(s => s.trim()).filter(Boolean),
    date: row.publishDate || "",
    reportType: "CRS",
    pdf_url: row.pdf_url || "",
    web_url: row.web_url || ""
  })),
  ...finRaw.map(row => ({
    title: row.title || "Untitled",
    summary: row.summary || "",
    agency: row.Agency || row.source || "Unknown",
    topicDisplay: "",
    topics: [],
    date: row.date || row.Date || "",
    reportType: row.reportType || "Unknown",
    pdf_url: row.pdf_url || "",
    web_url: row.web_url || ""
  }))];

  agencyOptions = extractUnique(finRaw, "Agency");
  topicOptions = extractUnique(crsRaw, "topics", ",");
  renderMultiselect("agencyFilter", agencyOptions);
  renderMultiselect("topicFilter", topicOptions);

  const years = [...new Set(reportData.map(r => r.date.split("-")[0]).filter(Boolean))].sort();
  renderMultiselect("yearFilter", years);

  renderTags(["CRS", "AFR", "PAR", "CJ"]);

  document.getElementById("searchInput").oninput = renderReports;
  document.getElementById("agencyFilter").onchange = renderReports;
  document.getElementById("topicFilter").onchange = renderReports;
  document.getElementById("yearFilter").onchange = renderReports;

  renderReports();
}

init();
