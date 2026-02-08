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

  // Category translations/groups to match reference
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

  // Group tests by their final displayed section
  const sectionGroups: Record<string, any[]> = {};
  categories.forEach(cat => {
    const sectionName = categoryNames[cat] || `Дополнительные показатели`;
    if (!sectionGroups[sectionName]) sectionGroups[sectionName] = [];
    sectionGroups[sectionName].push(...filteredTests.filter(t => t.category === cat));
  });

  const sortedSections = Object.keys(sectionGroups).sort();

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
      font-size: 28px;
      font-weight: 700;
      color: #2E5C6E;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header .patient-info {
      font-size: 15px;
      color: #555;
      font-weight: 500;
    }
    .section-header {
      background-color: #f8f9fa;
      border-left: 5px solid #2E5C6E;
      padding: 10px 15px;
      margin: 25px 0 10px 0;
      font-weight: 700;
      font-size: 15px;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 20px;
    }
    th {
      background-color: #f1f3f4;
      color: #333;
      padding: 10px 8px;
      text-align: center;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid #d1d5db;
      vertical-align: middle;
    }
    th:first-child {
      text-align: left;
      width: 35%;
      padding-left: 12px;
    }
    th:last-child {
      width: 20%;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #d1d5db;
      vertical-align: middle;
      text-align: center;
      height: 36px;
      color: #000;
    }
    td:first-child {
      text-align: left;
      padding-left: 12px;
      font-weight: 500;
    }
    .test-unit {
      font-weight: 400;
      color: #555;
      font-size: 12px;
    }
    .status-normal {
      color: #000000;
      font-weight: 400;
    }
    .status-high {
      color: #dc2626;
      font-weight: 700;
    }
    .status-low {
      color: #dc2626;
      font-weight: 700;
    }
    .status-missing {
      color: #999;
    }
    .reference-cell {
      color: #555;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Полный сводный отчет с референсными значениями</h1>
    <div class="patient-info">Пациент: ${patientName}${patientAge ? ', ' + patientAge + ' лет' : ''}${patientGender ? ', ' + patientGender : ''} | ${periodText}</div>
  </div>

  ${sortedSections.map((sectionTitle) => {
    const tests = sectionGroups[sectionTitle];
    if (tests.length === 0) return '';
    
    return `
    <div class="section-header">${sectionTitle}</div>
    <table>
      <thead>
        <tr>
          <th>Показатель</th>
          ${dates.map(d => {
            // Format date to DD.MM.YY
            const parts = d.date.split('.');
            const displayDate = parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2].slice(-2)}` : d.date;
            return `<th>${displayDate}</th>`;
          }).join('')}
          <th>Норма (Референс)</th>
        </tr>
      </thead>
      <tbody>
        ${tests.map((test) => `
          <tr>
            <td>
              ${test.name}
              ${test.unit ? `<span class="test-unit">(${test.unit})</span>` : ''}
            </td>
            ${dates.map(d => {
              const t = getTestValue(test.name, d.indices);
              if (!t) {
                return '<td class="status-missing">—</td>';
              }
              const isNormal = t.status === 'Normal';
              const statusClass = isNormal ? 'status-normal' : (t.status === 'High' || t.status === 'Low' ? 'status-high' : 'status-normal');
              return `<td class="${statusClass}">${t.value}</td>`;
            }).join('')}
            <td class="reference-cell">${test.normalRange || '—'}</td>
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

  await new Promise(resolve => setTimeout(resolve, 400));

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

    doc.save(`полный-сводный-отчет-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Ошибка при создании PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    document.body.removeChild(iframe);
  }
};
