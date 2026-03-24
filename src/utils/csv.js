export const exportCSV = (data, columns, filename) => {
  const header = columns.map(c => c.label).join(",");
  const rows = data.map(row => columns.map(c => {
    let v = typeof c.key === "function" ? c.key(row) : row[c.key];
    if (v == null) v = "";
    v = String(v).replace(/"/g, '""');
    return `"${v}"`;
  }).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
