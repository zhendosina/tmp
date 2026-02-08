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
    ? `${dateList[0]} — ${dateList[dateList.length - 1]}`
    : dateList[0] || '';

  // Category translations
  const categoryNames: Record<string, string> = {
    'Общий анализ крови': '1. Гематология (Общий анализ крови)',
    'Лейкоцитарная формула': '2. Лейкоцитарная формула (%)',
    'Метаболическая панель': '3. Биохимия и Гормоны',
    'Функция печени': '3. Биохимия и Гормоны',
    'Функция почек': '3. Биохимия и Гормоны',
    'Липидный профиль': '3. Биохимия и Гормоны',
    'Витамины и минералы': '3. Биохимия и Гормоны',
    'Коагулограмма': '4. Коагулограмма (Свертываемость)',
    'Общий анализ мочи': '5. Общий анализ мочи',
    'Другое': '6. Дополнительные показатели'
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
      font-size: 26px;
      font-weight: 600;
      color: #2E86AB;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header .patient-info {
      font-size: 14px;
      color: #555;
    }
    .section-header {
      background: linear-gradient(to right, #f8f9fa, #e9ecef);
      border-left: 4px solid #2E86AB;
      padding: 10px 15px;
      margin: 20px 0 10px 0;
      font-weight: 600;
      font-size: 14px;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 15px;
    }
    th {
      background-color: #f1f3f4;
      color: #333;
      padding: 8px 6px;
      text-align: center;
      font-weight: 600;
      font-size: 10px;
      border: 1px solid #ccc;
      border-bottom: 2px solid #999;
    }
    th:first-child {
      text-align: left;
      width: 30%;
    }
    th:last-child {
      width: 18%;
      font-style: italic;
    }
    td {
      padding: 6px;
      border: 1px solid #ddd;
      vertical-align: middle;
      text-align: center;
      height: 26px;
    }
    td:first-child {
      text-align: left;
      padding-left: 10px;
      font-weight: 500;
    }
    td:last-child {
      font-size: 10px;
      color: #555;
      font-style: italic;
    }
    .status-normal {
      color: #000000;
      font-weight: 400;
    }
    .status-high {
      color: #dc2626;
      font-weight: 600;
    }
    .status-low {
      color: #dc2626;
      font-weight: 600;
    }
    .status-missing {
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Полный сводный отчет с референсными значениями</h1>
    <div class="patient-info">Пациент: ${patientName}${patientAge ? ', ' + patientAge + ' лет' : ''}${patientGender ? ', ' + patientGender : ''} | ${periodText}</div>
  </div>

  ${categories.map((category, catIndex) => {
    const categoryTests = filteredTests.filter(t => t.category === category);
    if (categoryTests.length === 0) return '';
    
    const sectionTitle = categoryNames[category] || `${catIndex + 1}. ${category}`;
    
    return `
    <div class="section-header">${sectionTitle}</div>
    <table>
      <thead>
        <tr>
          <th>Показатель</th>
          ${dates.map(d => `<th>${d.date}</th>`).join('')}
          <th>Норма (Референс)</th>
        </tr>
      </thead>
      <tbody>
        ${categoryTests.map((test) => `
          <tr>
            <td>${test.name}</td>
            ${dates.map(d => {
              const t = getTestValue(test.name, d.indices);
              if (!t) {
                return '<td class="status-missing">—</td>';
              }
              const statusClass = t.status === 'Normal' ? 'status-normal' : t.status === 'High' ? 'status-high' : 'status-low';
              return `<td class="${statusClass}">${t.value}</td>`;
            }).join('')}
            <td>${test.normalRange || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `;
  }).join('')}
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
      windowWidth: 1400,
      windowHeight: 1200
    });

    const imgWidth = dates.length > 4 ? 297 : 210;
    const pageHeight = dates.length > 4 ? 210 : 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      orientation: dates.length > 4 ? 'landscape' : 'portrait',
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

    doc.save(`полный-отчет-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Ошибка при создании PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    document.body.removeChild(iframe);
  }
};
