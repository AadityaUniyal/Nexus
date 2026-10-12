/**
 * Universal CSV Export Utility for Nexus Fleet & Logistics OS
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Extract headers
  const headers = Object.keys(rows[0]);

  // Escape CSV value
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsv).join(","));

  for (const row of rows) {
    const values = headers.map((header) => escapeCsv(row[header]));
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
