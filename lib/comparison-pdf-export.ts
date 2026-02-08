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
    @page { size: A4; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DejaVu Sans', Arial, sans-serif;
      background: white;
      color: #000000;
      line-height: 1.2;
      padding: 20px;
      font-size: 8pt;
    }
    .header-container {
      width: 100%;
      text-align: center;
      margin-bottom: 20px;
    }
    .header-container h1 {
      font-size: 14pt;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .header-container .info-text {
      font-size: 10pt;
      color: #34495e;
      margin-bottom: 4px;
    }
    .section-header {
      background-color: #f2f2f2;
      border-left: 4px solid #2980b9;
      padding: 6px 10px;
      margin: 15px 0 8px 0;
      font-weight: bold;
      font-size: 10pt;
      color: #2c3e50;
      text-align: left;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #bdc3c7;
      padding: 4px 6px;
      word-wrap: break-word;
      overflow: hidden;
    }
    th {
      background-color: #f2f2f2;
      color: #2c3e50;
      text-align: center;
      font-weight: bold;
      font-size: 8pt;
    }
    th:first-child {
      text-align: left;
      width: 35%;
    }
    th:last-child {
      width: 20%;
    }
    td {
      vertical-align: middle;
      text-align: center;
      height: 24px;
    }
    td:first-child {
      text-align: left;
      font-weight: bold;
    }
    td:last-child {
      background-color: #f2f2f2;
      font-style: italic;
      color: #7f8c8d;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .test-unit {
      font-weight: normal;
      color: #7f8c8d;
      font-size: 7pt;
    }
    .status-abnormal {
      color: #c0392b;
      font-weight: bold;
    }
    .status-normal {
      color: #000000;
    }
    .status-missing {
      color: #bdc3c7;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <h1>Полный сводный отчет с референсными значениями</h1>
    <p class="info-text">Пациент: ${patientName}${patientAge ? ', ' + patientAge + ' лет' : ''}${patientGender ? ', ' + patientGender : ''}</p>
    <p class="info-text">Период исследования: ${periodText}</p>
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
            const parts = d.date.split('.');
            const displayDate = parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2].slice(-2)}` : d.date;
            return `<th>${displayDate}</th>`;
          }).join('')}
          <th>Эталон/Цель</th>
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
              const isAbnormal = t.status === 'High' || t.status === 'Low';
              if (isAbnormal) {
                return `<td><span class="status-abnormal">${t.value}</span></td>`;
              }
              return `<td><span class="status-normal">${t.value}</span></td>`;
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
