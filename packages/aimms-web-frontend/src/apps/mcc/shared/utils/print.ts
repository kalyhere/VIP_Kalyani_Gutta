import { Case } from "../../types"

export const printCase = (currentCase: Case | null) => {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${currentCase?.name || "Medical Case"}</title>
        <style>
          @media print {
            @page {
              size: auto;
              margin: 20mm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px;
            color: #2196f3;
          }
          .table-title {
            font-weight: bold;
            margin: 15px 0 5px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            margin: 4px;
          }
          .image-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentCase?.name || "Medical Case"}</h1>
        </div>
        ${
          currentCase && currentCase.sections && currentCase.sections.length > 0
            ? currentCase.sections
                .map(
                  (section) => `
            <div class="section-title">${section.title}</div>
            ${section.tables
              .map(
                (table) => `
              <div class="table-title">${table.title}</div>
              <table>
                ${table.rows
                  .map(
                    (row) => `
                  <tr>
                    ${row.cells
                      .map(
                        (cell) => `
                      <${row.cells[0] === cell && table.hasHeader ? "th" : "td"}>
                        ${
                          cell.imageUrls && cell.imageUrls.length > 0
                            ? `<div class="image-grid">
                            ${cell.imageUrls
                              .map(
                                (url) =>
                                  `<img src="${url.split("#")[0]}" alt="" style="max-width: 100%; max-height: 200px; object-fit: contain;">`
                              )
                              .join("")}
                          </div>`
                            : cell.content
                        }
                      </${row.cells[0] === cell && table.hasHeader ? "th" : "td"}>
                    `
                      )
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
              </table>
            `
              )
              .join("")}
          `
                )
                .join("")
            : ""
        }
      </body>
    </html>
  `

  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.print()
}
