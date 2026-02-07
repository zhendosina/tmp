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
    width: 1600px;
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

  // Helper function to get trend
  const getTrend = (testName: string, currentDateIndex: number): string | null => {
    if (currentDateIndex === 0) return null;
    
    const current = getTestValue(testName, dates[currentDateIndex].indices);
    const previous = getTestValue(testName, dates[currentDateIndex - 1].indices);
    
    if (!current || !previous) return null;
    
    const currVal = parseFloat(String(current.value));
    const prevVal = parseFloat(String(previous.value));
    
    if (isNaN(currVal) || isNaN(prevVal)) return null;
    
    if (currVal > prevVal) return '↑';
    if (currVal < prevVal) return '↓';
    return null;
  };

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
      line-height: 1.4;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 15px;
    }
    .header .patient-info {
      font-size: 16px;
      color: #333;
      margin-bottom: 5px;
      font-weight: 500;
    }
    .header .period {
      font-size: 16px;
      color: #555;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background-color: #2E5C6E;
      color: white;
      padding: 10px 6px;
      text-align: center;
      font-weight: 700;
      font-size: 10px;
      border: 1px solid #ddd;
    }
    th:first-child {
      text-align: left;
      width: 18%;
    }
    th:nth-child(2) {
      width: 12%;
    }
    .category-row {
      background-color: #6B7B8C !important;
      color: white;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .category-row td {
      padding: 8px;
      border: 1px solid #ddd;
      background-color: #6B7B8C !important;
    }
    td {
      padding: 5px 6px;
      border: 1px solid #ddd;
      vertical-align: middle;
      text-align: center;
      font-weight: 700;
      color: #000000;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:nth-child(odd) {
      background-color: white;
    }
    .test-name {
      font-weight: 700;
      color: #000000;
      text-align: left;
    }
    .ref-col {
      text-align: center;
      font-weight: 700;
      color: #000000;
      font-size: 10px;
    }
    .date-col {
      text-align: center;
      min-width: 85px;
      font-weight: 700;
    }
    .status-normal {
      background-color: #C8E6C9;
      color: #000000;
      font-weight: 700;
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
      color: #999;
      text-align: center;
      font-weight: 700;
    }
    .trend-arrow {
      font-size: 12px;
      margin-left: 2px;
    }
    .trend-up {
      color: #dc2626;
    }
    .trend-down {
      color: #16a34a;
    }
    .value-with-unit {
      font-weight: 700;
    }
    .unit-text {
      font-size: 9px;
      font-weight: 600;
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
        ${dates.map(d => `<th class="date-col">${d.date}</th>`).join('')}
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
          ${dates.map((d, dateIdx) => {
            const t = getTestValue(test.name, d.indices);
            if (!t) {
              return '<td class="status-missing date-col">—</td>';
            }
            const statusClass = t.status === 'Normal' ? 'status-normal' : t.status === 'High' ? 'status-high' : 'status-low';
            const trend = getTrend(test.name, dateIdx);
            const trendArrow = trend ? `<span class="trend-arrow ${trend === '↑' ? 'trend-up' : 'trend-down'}">${trend}</span>` : '';
            const unit = t.unit ? `<span class="unit-text"> ${t.unit}</span>` : '';
            return `<td class="${statusClass} date-col"><span class="value-with-unit">${t.value}${trendArrow}${unit}</span></td>`;
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
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: false,
      windowWidth: 1600,
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
