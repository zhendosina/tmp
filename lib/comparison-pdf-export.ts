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
    width: 1800px;
    height: 1200px;
    border: none;
  `;
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    alert('Ошибка: не удалось создать iframe');
    return;
  }

  // Get unique categories
  const categories = [...new Set(filteredTests.map(t => t.category))];
  
  // Get first patient info
  const firstAnalysis = analyses[0];
  const patientName = firstAnalysis?.patient_info?.name || 'Не указано';
  const patientAge = firstAnalysis?.patient_info?.age || '';
  const patientGender = firstAnalysis?.patient_info?.gender === 'Male' ? 'М' : firstAnalysis?.patient_info?.gender === 'Female' ? 'Ж' : '';
  
  // Get date range
  const dateList = dates.map(d => d.date).filter(Boolean);
  const periodText = dateList.length >= 2 
    ? `${dateList[0]} - ${dateList[dateList.length - 1]}`
    : dateList[0] || '';

  const tableHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: white;
      color: #000000;
      line-height: 1.5;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
    }
    .header .patient-info {
      font-size: 14px;
      color: #4a5568;
      margin-bottom: 4px;
    }
    .header .period {
      font-size: 14px;
      color: #4a5568;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: linear-gradient(to right, #5dade2, #3498db);
      color: white;
      padding: 10px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 10px;
      border: 1px solid #bbb;
      height: 32px;
      vertical-align: middle;
    }
    th:first-child {
      background-color: #3d4f5c;
      text-align: left;
    }
    th:nth-child(2) {
      background-color: #3d4f5c;
    }
    .category-row {
      background-color: #6b7b8c !important;
      color: white;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .category-row td {
      padding: 7px 8px;
      border: 1px solid #bbb;
      background-color: #6b7b8c !important;
      text-align: left;
      height: 28px;
      vertical-align: middle;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #d0d0d0;
      vertical-align: middle;
      text-align: center;
      height: 30px;
    }
    .test-name {
      text-align: left;
      padding: 6px 10px;
      font-weight: 400;
      color: #000000;
    }
    .ref-col {
      text-align: center;
      font-weight: 400;
      color: #666;
      font-size: 10px;
    }
    .status-normal {
      background-color: #C8E6C9;
      color: #000000;
      font-weight: 400;
    }
    .status-high {
      background-color: #FFCDD2;
      color: #000000;
      font-weight: 700;
    }
    .status-low {
      background-color: #FFF9C4;
      color: #000000;
      font-weight: 700;
    }
    .status-missing {
      background-color: #ffffff;
      color: #999;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Результаты анализов крови</h1>
    <div class="patient-info">Пациент: ${patientName}${patientAge ? ', ' + patientAge + ' лет' : ''}${patientGender ? ', ' + patientGender : ''}</div>
    <div class="period">Период: ${periodText}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Анализ</th>
        <th>Референс</th>
        ${dates.map(d => `<th>${d.date}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${categories.map(category => {
        const categoryTests = filteredTests.filter(t => t.category === category);
        if (categoryTests.length === 0) return '';
        
        let html = `
        <tr class="category-row">
          <td colspan="${dates.length + 2}">${category.toUpperCase()}</td>
        </tr>
        `;
        
        html += categoryTests.map((test) => `
          <tr>
            <td class="test-name">${test.name}</td>
            <td class="ref-col">${test.normalRange || '—'}</td>
            ${dates.map(d => {
              const t = getTestValue(test.name, d.indices);
              if (!t) {
                return '<td class="status-missing">—</td>';
              }
              const statusClass = t.status === 'Normal' ? 'status-normal' : t.status === 'High' ? 'status-high' : 'status-low';
              return `<td class="${statusClass}">${t.value} ${t.unit}</td>`;
            }).join('')}
          </tr>
        `).join('');
        
        return html;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  iframeDoc.open();
  iframeDoc.write(tableHTML);
  iframeDoc.close();

  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: false,
      windowWidth: 1800,
      windowHeight: 1200
    });

    const imgWidth = dates.length > 5 ? 297 : 210;
    const pageHeight = dates.length > 5 ? 210 : 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: dates.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    if (imgHeight <= pageHeight - 10) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 5, 5, imgWidth - 10, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 5;
      let firstPage = true;
      const imgData = canvas.toDataURL('image/png');

      while (heightLeft > 0) {
        if (!firstPage) {
          doc.addPage();
          position = 5;
        }
        doc.addImage(imgData, 'PNG', 5, position, imgWidth - 10, imgHeight);
        heightLeft -= (pageHeight - 10);
        position -= (pageHeight - 10);
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
