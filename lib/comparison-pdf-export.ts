import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportComparisonToPDF = async (
  filteredTests: any[],
  dates: any[],
  getTestValue: (name: string, indices: number[]) => any,
  analyses: any[]
) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 1400px;
    height: 900px;
    border: none;
  `;
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    alert('Ошибка: не удалось создать iframe');
    return;
  }

  const uniqueLabs = new Set(analyses.map(a => a.fileName?.split('_')[0] || 'Unknown')).size;

  const tableHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.4;
      padding: 40px;
    }
    .header {
      background: linear-gradient(135deg, #722F37 0%, #C17F59 50%, #D4A574 100%);
      padding: 35px 40px;
      margin: -40px -40px 30px -40px;
      color: white;
    }
    .logo {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.95;
      margin-bottom: 10px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0;
      color: white;
      letter-spacing: -0.5px;
    }
    .header .date {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 8px;
      font-weight: 400;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding: 0;
    }
    .summary-box {
      background: #f0f0f0;
      border-radius: 12px;
      padding: 20px 28px;
      min-width: 160px;
      flex: 1;
    }
    .summary-box .label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .summary-box .value {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }
    th {
      background-color: #e8e8e8;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      color: #444;
      border-bottom: 2px solid #d0d0d0;
      font-size: 12px;
    }
    th:first-child {
      border-radius: 8px 0 0 0;
      padding-left: 16px;
    }
    th:last-child {
      border-radius: 0 8px 0 0;
      padding-right: 16px;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e8e8e8;
      vertical-align: middle;
    }
    td:first-child { padding-left: 16px; }
    td:last-child { padding-right: 16px; }
    tr { background-color: white; }
    .test-name {
      font-weight: 500;
      color: #1a1a1a;
      font-size: 13px;
    }
    .ref-value {
      color: #666;
      font-size: 12px;
    }
    .unit {
      color: #888;
      font-size: 12px;
    }
    .status-normal {
      color: #16a34a;
      font-weight: 600;
      text-align: center;
      font-size: 13px;
    }
    .status-high {
      color: #dc2626;
      font-weight: 600;
      text-align: center;
      font-size: 13px;
    }
    .status-low {
      color: #d97706;
      font-weight: 600;
      text-align: center;
      font-size: 13px;
    }
    .status-missing {
      color: #ccc;
      text-align: center;
    }
    .date-col {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">BloodReports</div>
    <h1>Сравнение анализов крови</h1>
    <div class="date">Сгенерировано BloodParser — ${new Date().toLocaleDateString('ru-RU')}</div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Всего показателей</div>
      <div class="value">${filteredTests.length}</div>
    </div>
    <div class="summary-box">
      <div class="label">Дат анализов</div>
      <div class="value">${dates.length}</div>
    </div>
    <div class="summary-box">
      <div class="label">Лабораторий</div>
      <div class="value">${uniqueLabs}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Показатель</th>
        <th style="width: 15%;">Референс</th>
        <th style="width: 10%;">Ед. изм.</th>
        ${dates.map(d => `<th class="date-col" style="width: ${47 / dates.length}%;">${d.date}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${filteredTests.map((test) => `
        <tr>
          <td class="test-name">${test.name}</td>
          <td class="ref-value">${test.normalRange || '—'}</td>
          <td class="unit">${test.unit}</td>
          ${dates.map(d => {
            const t = getTestValue(test.name, d.indices);
            if (!t) {
              return '<td class="status-missing date-col">—</td>';
            }
            const statusClass = t.status === 'Normal' ? 'status-normal' : t.status === 'High' ? 'status-high' : 'status-low';
            return `<td class="${statusClass} date-col">${t.value}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  iframeDoc.open();
  iframeDoc.write(tableHTML);
  iframeDoc.close();

  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: false,
      windowWidth: 1400,
      windowHeight: 900
    });

    const imgWidth = dates.length > 3 ? 297 : 210;
    const pageHeight = dates.length > 3 ? 210 : 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: dates.length > 3 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    if (imgHeight <= pageHeight) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;
      let firstPage = true;
      const imgData = canvas.toDataURL('image/png');

      while (heightLeft > 0) {
        if (!firstPage) {
          doc.addPage();
        }
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        firstPage = false;
      }
    }

    doc.save(`сравнение-анализов-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Ошибка при создании PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    document.body.removeChild(iframe);
  }
};
