// ==========================================
// SELF-CONTAINED REPORT EXPORTERS
// ==========================================
// The project intentionally has no third-party spreadsheet or PDF
// libraries. These helpers generate real downloadable files using
// only the browser platform:
//   - Excel: an HTML worksheet saved with an .xls extension, which
//     Microsoft Excel, LibreOffice and Google Sheets all open.
//   - PDF: a minimal, valid PDF 1.4 document written by hand using
//     the built-in Helvetica font (no font embedding required).

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;
const BODY_SIZE = 8.5;
const HEADER_SIZE = 8.5;
const TITLE_SIZE = 15;
const LINE_HEIGHT = 14;

// ==========================================
// TEXT HELPERS
// ==========================================

const asciiFold = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "");
};

const escapePdfText = (value) =>
  asciiFold(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const displayCell = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const truncate = (value, maxChars) => {
  const text = asciiFold(value);

  if (text.length <= maxChars) return text;

  if (maxChars <= 1) return text.slice(0, maxChars);

  return text.slice(0, maxChars - 1) + "\u2026";
};

const byteLength = (value) => new TextEncoder().encode(value).length;

const pad10 = (value) => String(value).padStart(10, "0");

// ==========================================
// DOWNLOAD
// ==========================================

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

// ==========================================
// PDF BUILDER
// ==========================================

const drawText = (x, y, size, text, ops) => {
  ops.push(
    `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`
  );
};

const drawRect = (x, y, w, h, gray, ops) => {
  ops.push(
    `${gray} ${gray} ${gray} rg ${x} ${y} ${w} ${h} re f 0 0 0 rg`
  );
};

const drawLine = (x1, y1, x2, y2, gray, ops) => {
  ops.push(
    `${gray} ${gray} ${gray} RG ${x1} ${y1} m ${x2} ${y2} l S 0 0 0 RG`
  );
};

const buildPage = (rowChunks, columns, meta, pageIndex, totalPages) => {
  const ops = [];

  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

  let y = PAGE_HEIGHT - MARGIN;

  if (pageIndex === 0) {
    drawText(MARGIN, y - TITLE_SIZE, TITLE_SIZE, meta.title, ops);
    y -= TITLE_SIZE + 6;

    if (meta.subtitle) {
      drawText(MARGIN, y - 9, 9, meta.subtitle, ops);
      y -= 14;
    }

    if (meta.summary && meta.summary.length) {
      y -= 2;

      drawText(MARGIN, y - 9, 9, "Report Summary", ops);
      y -= 13;

      meta.summary.forEach((item) => {
        drawText(
          MARGIN,
          y - 8,
          8,
          `${item.label}: ${item.value}`,
          ops
        );
        y -= 11;
      });
    }

    y -= 6;
  } else {
    drawText(MARGIN, y - 10, 10, meta.title, ops);
    y -= 18;
  }

  const headerY = y;

  drawRect(MARGIN, headerY - 4, tableWidth, 16, 0.9, ops);

  let x = MARGIN + 3;

  columns.forEach((column) => {
    drawText(
      x,
      headerY,
      HEADER_SIZE,
      truncate(
        column.label,
        Math.max(1, Math.floor(column.width / (HEADER_SIZE * 0.52)))
      ),
      ops
    );
    x += column.width;
  });

  y = headerY - 12;

  drawLine(MARGIN, y + 8, MARGIN + tableWidth, y + 8, 0.75, ops);

  rowChunks.forEach((row) => {
    x = MARGIN + 3;

    columns.forEach((column, index) => {
      const maxChars = Math.max(
        1,
        Math.floor(column.width / (BODY_SIZE * 0.52))
      );

      drawText(
        x,
        y,
        BODY_SIZE,
        truncate(displayCell(row[index]), maxChars),
        ops
      );

      x += column.width;
    });

    y -= LINE_HEIGHT;

    drawLine(MARGIN, y + 4, MARGIN + tableWidth, y + 4, 0.9, ops);
  });

  drawText(
    MARGIN,
    MARGIN - 14,
    8,
    `Generated ${meta.generatedAt} by ${meta.generatedBy}`,
    ops
  );

  drawText(
    PAGE_WIDTH - MARGIN - 60,
    MARGIN - 14,
    8,
    `Page ${pageIndex + 1} of ${totalPages}`,
    ops
  );

  return ops.join("\n");
};

const buildPdf = (pagesContent) => {
  const totalPages = pagesContent.length;

  const pageObjectNumbers = [];
  const contentObjectNumbers = [];

  for (let i = 0; i < totalPages; i += 1) {
    pageObjectNumbers.push(4 + i * 2);
    contentObjectNumbers.push(5 + i * 2);
  }

  const totalObjects = 3 + totalPages * 2;

  const bodies = {};

  bodies[1] = "<< /Type /Catalog /Pages 2 0 R >>";

  bodies[2] =
    "<< /Type /Pages /Kids [" +
    pageObjectNumbers.map((n) => `${n} 0 R`).join(" ") +
    `] /Count ${totalPages} >>`;

  bodies[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica " +
    "/Encoding /WinAnsiEncoding >>";

  pagesContent.forEach((content, index) => {
    const pageNumber = pageObjectNumbers[index];

    const contentNumber = contentObjectNumbers[index];

    bodies[pageNumber] =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
      `${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      "/Resources << /Font << /F1 3 0 R >> >> " +
      `/Contents ${contentNumber} 0 R >>`;

    bodies[contentNumber] =
      `<< /Length ${byteLength(content)} >>\nstream\n` +
      content +
      "\nendstream";
  });

  let output = "%PDF-1.4\n";

  const offsets = {};

  for (let i = 1; i <= totalObjects; i += 1) {
    offsets[i] = byteLength(output);

    output += `${i} 0 obj\n${bodies[i]}\nendobj\n`;
  }

  const xrefOffset = byteLength(output);

  output += `xref\n0 ${totalObjects + 1}\n`;

  output += "0000000000 65535 f \n";

  for (let i = 1; i <= totalObjects; i += 1) {
    output += `${pad10(offsets[i])} 00000 n \n`;
  }

  output +=
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob(
    [new TextEncoder().encode(output)],
    { type: "application/pdf" }
  );
};

// ==========================================
// EXPORT PDF
// ==========================================

export const buildReportPdfBlob = ({
  title,
  subtitle,
  summary,
  columns,
  rows,
  generatedBy
}) => {
  const availableWidth = PAGE_WIDTH - MARGIN * 2;

  const totalWidth = columns.reduce(
    (sum, c) => sum + c.width,
    0
  );

  const scaled = columns.map((c) => ({
    ...c,
    width: (c.width / totalWidth) * availableWidth
  }));

  const rowsPerPage = 42;

  const pagesContent = [];

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / rowsPerPage)
  );

  for (let i = 0; i < totalPages; i += 1) {
    const chunk = rows.slice(
      i * rowsPerPage,
      (i + 1) * rowsPerPage
    );

    pagesContent.push(
      buildPage(
        chunk,
        scaled,
        {
          title,
          subtitle,
          summary,
          generatedAt: new Date().toLocaleString(),
          generatedBy: generatedBy || "Unknown user"
        },
        i,
        totalPages
      )
    );
  }

  return buildPdf(pagesContent);
};

export const exportReportPdf = ({
  title,
  subtitle,
  summary,
  columns,
  rows,
  fileName,
  generatedBy
}) => {
  const blob = buildReportPdfBlob({
    title,
    subtitle,
    summary,
    columns,
    rows,
    generatedBy
  });

  downloadBlob(blob, fileName);
};

// ==========================================
// EXPORT EXCEL
// ==========================================

const escapeHtml = (value) =>
  displayCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildReportExcelBlob = ({
  title,
  subtitle,
  summary,
  columns,
  rows,
  generatedBy
}) => {
  const headCells = columns
    .map(
      (column) =>
        `<th style="background:#1d4ed8;color:#ffffff;` +
        `border:1px solid #93c5fd;padding:6px 8px;` +
        `text-align:left;font-size:12px;">` +
        `${escapeHtml(column.label)}</th>`
    )
    .join("");

  const bodyRows = rows
    .map(
      (row) =>
        "<tr>" +
        row
          .map(
            (cell) =>
              `<td style="border:1px solid #dbeafe;` +
              `padding:5px 8px;font-size:12px;` +
              `vertical-align:top;">${escapeHtml(cell)}</td>`
          )
          .join("") +
        "</tr>"
    )
    .join("");

  const summaryRows = (summary || [])
    .map(
      (item) =>
        "<tr>" +
        `<td style="border:1px solid #dbeafe;` +
        `padding:5px 8px;font-size:12px;font-weight:bold;` +
        `background:#f1f5f9;">${escapeHtml(item.label)}</td>` +
        `<td style="border:1px solid #dbeafe;` +
        `padding:5px 8px;font-size:12px;">${escapeHtml(item.value)}</td>` +
        "</tr>"
    )
    .join("");

  const summaryBlock =
    summaryRows.length > 0
      ? '<h3 style="font-family:Arial;color:#1e293b;">' +
        "Report Summary</h3>" +
        '<table cellspacing="0" cellpadding="0" ' +
        `style="margin-bottom:14px;">${summaryRows}</table>`
      : "";

  const html =
    "\ufeff" +
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8" />' +
    "<style>table{border-collapse:collapse;}</style></head><body>" +
    `<h2 style="font-family:Arial;color:#1e293b;">${escapeHtml(title)}</h2>` +
    (subtitle
      ? `<p style="font-family:Arial;color:#475569;font-size:12px;">` +
        `${escapeHtml(subtitle)}</p>`
      : "") +
    summaryBlock +
    '<table cellspacing="0" cellpadding="0">' +
    `<thead><tr>${headCells}</tr></thead>` +
    `<tbody>${bodyRows || ""}</tbody>` +
    "</table>" +
    `<p style="font-family:Arial;color:#64748b;font-size:11px;">` +
    `Generated ${escapeHtml(new Date().toLocaleString())} by ` +
    `${escapeHtml(generatedBy || "Unknown user")}</p>` +
    "</body></html>";

  return new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8"
  });
};

export const exportReportExcel = ({
  title,
  subtitle,
  summary,
  columns,
  rows,
  fileName,
  generatedBy
}) => {
  const blob = buildReportExcelBlob({
    title,
    subtitle,
    summary,
    columns,
    rows,
    generatedBy
  });

  downloadBlob(blob, fileName);
};
