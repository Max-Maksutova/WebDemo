async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.split("\n").filter(row => row.trim());
  const headers = rows[0].split(",");
  const data = rows.slice(1).map(row => {
    const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // handles commas inside quotes
    return headers.map((h, i) => values[i] || "");
  });
  return { headers, data };
}

function initDataTable(tableId, headers, data) {
  $(`#${tableId}`).DataTable({
    data: data,
    columns: headers.map(h => ({ title: h })),
    dom: 'Bfrtip',
    buttons: ['csvHtml5'],
    initComplete: function () {
      this.api().columns().every(function () {
        const column = this;
        const select = $('<select><option value=""></option></select>')
          .appendTo($(column.footer()).empty())
          .on('change', function () {
            const val = $.fn.dataTable.util.escapeRegex($(this).val());
            column.search(val ? `^${val}$` : '', true, false).draw();
          });

        column.data().unique().sort().each(function (d) {
          if (d) select.append(`<option value="${d}">${d}</option>`);
        });
      });
    }
  });
}

async function init() {
  const [crs, fin] = await Promise.all([
    loadCSV("data/sampled_crs_list.csv"),
    loadCSV("data/sampled_financial_reports.csv"),
  ]);

  initDataTable("crsTable", crs.headers, crs.data);
  initDataTable("finTable", fin.headers, fin.data);
}

init();
