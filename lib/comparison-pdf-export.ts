import { formatTestNameWithAbbreviation, getTestAbbreviation } from './test-abbreviations';

export const exportComparisonToPDF = async (
  filteredTests: any[],
  dates: any[],
  getTestValue: (name: string, indices: number[]) => any,
  analyses: any[]
) => {
  try {
    // Get patient info
    const firstAnalysis = analyses[0];
    const patientName = firstAnalysis?.patient_info?.name || 'Не указано';
    
    // Get date range
    const dateList = dates.map(d => d.date).filter(Boolean);
    const periodText = dateList.length >= 2 
      ? `${dateList[0]} — ${dateList[dateList.length - 1]}`
      : dateList[0] || '';

    // Helper function to format date for display
    const formatDate = (dateStr: string) => {
      const parts = dateStr.split('.');
      return parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2].slice(-2)}` : dateStr;
    };

    // Helper to get values for a test with trends
    const getTestValuesWithTrends = (testName: string) => {
      return dates.map((d, index) => {
        const t = getTestValue(testName, d.indices);
        if (!t) return { value: '—', isAbnormal: false, trend: null };
        const isAbnormal = t.status === 'High' || t.status === 'Low';
        
        // Calculate trend if not first date
        let trend = null;
        if (index > 0) {
          const prevT = getTestValue(testName, dates[index - 1].indices);
          if (prevT && t.value && prevT.value) {
            const current = parseFloat(String(t.value).replace(',', '.'));
            const previous = parseFloat(String(prevT.value).replace(',', '.'));
            if (!isNaN(current) && !isNaN(previous)) {
              const diff = current - previous;
              const percentChange = Math.abs(diff / previous * 100);
              if (percentChange < 5) {
                trend = 'stable';
              } else if (diff > 0) {
                trend = 'up';
              } else {
                trend = 'down';
              }
            }
          }
        }
        
        return { value: t.value, isAbnormal, trend };
      });
    };

    // Get trend icon as emoji
    const getTrendIcon = (trend: string | null) => {
      if (trend === 'up') return '↑';
      if (trend === 'down') return '↓';
      if (trend === 'stable') return '→';
      return '';
    };

    // Get trend color
    const getTrendColor = (trend: string | null) => {
      if (trend === 'up') return '#27ae60';
      if (trend === 'down') return '#e74c3c';
      if (trend === 'stable') return '#7f8c8d';
      return '';
    };

    // Determine orientation based on number of dates
    const isLandscape = dates.length > 4;

    // Build HTML
    let htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Сводный отчет - ${patientName}</title>
    <style>
        @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 10mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            font-size: 16pt;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .subtitle {
            text-align: center;
            margin-bottom: 20px;
            font-size: 10pt;
            color: #7f8c8d;
        }
        h3 {
            background-color: #f2f2f2;
            padding: 5px 10px;
            border-left: 5px solid #2980b9;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 10pt;
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 6px 4px;
            text-align: center;
            word-wrap: break-word;
        }
        th {
            background-color: #ecf0f1;
            font-weight: bold;
            color: #2c3e50;
        }
        .left-align {
            text-align: left;
            width: 30%;
            font-weight: bold;
            background-color: #ffffff;
        }
        .ref-col {
            width: 20%;
            background-color: #f9f9f9;
            font-style: italic;
            color: #7f8c8d;
        }
        .highlight {
            color: #c0392b;
            font-weight: bold;
        }
        .trend-up {
            color: #27ae60;
        }
        .trend-down {
            color: #e74c3c;
        }
        .trend-stable {
            color: #7f8c8d;
        }
        tr:nth-child(even) {
            background-color: #fcfcfc;
        }
        .footer {
            font-size: 7pt;
            color: #95a5a6;
            margin-top: 10px;
        }
        .abbreviation {
            color: #7f8c8d;
            font-weight: normal;
            font-size: 7pt;
        }
    </style>
</head>
<body>

    <h1>Полный сводный отчет</h1>
    <div class="subtitle">Пациент: ${patientName}${periodText ? ' | Период: ' + periodText : ''}</div>`;

    // Section 1: Гематология (Общий анализ крови)
    const hematologyTests = filteredTests.filter(t => t.category === 'Общий анализ крови');
    if (hematologyTests.length > 0) {
      htmlContent += `

    <h3>1. Гематология (Общий анализ крови)</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`;
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`;
      });
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`;
      
      hematologyTests.forEach((test) => {
        const values = getTestValuesWithTrends(test.name);
        const displayName = formatTestNameWithAbbreviation(test.name);
        htmlContent += `
            <tr>
                <td class="left-align">${displayName}${test.unit ? ' <span class="abbreviation">(' + test.unit + ')</span>' : ''}</td>`;
        
        values.forEach((v, idx) => {
          const trendIcon = getTrendIcon(v.trend);
          const trendClass = v.trend ? `trend-${v.trend}` : '';
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight ${trendClass}">${v.value} ${trendIcon}</td>`;
          } else {
            htmlContent += `
                <td class="${trendClass}">${v.value} ${trendIcon}</td>`;
          }
        });
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`;
      });
      
      htmlContent += `
        </tbody>
    </table>`;
    }

    // Section 2: Биохимия и Гормоны
    const biochemCategories = ['Метаболическая панель', 'Функция печени', 'Функция почек', 'Липидный профиль', 'Витамины и минералы'];
    const biochemTests = filteredTests.filter(t => biochemCategories.includes(t.category));
    if (biochemTests.length > 0) {
      htmlContent += `

    <h3>2. Биохимия и Гормоны</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`;
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`;
      });
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`;
      
      biochemTests.forEach((test) => {
        const values = getTestValuesWithTrends(test.name);
        const displayName = formatTestNameWithAbbreviation(test.name);
        htmlContent += `
            <tr>
                <td class="left-align">${displayName}${test.unit ? ' <span class="abbreviation">(' + test.unit + ')</span>' : ''}</td>`;
        
        values.forEach((v, idx) => {
          const trendIcon = getTrendIcon(v.trend);
          const trendClass = v.trend ? `trend-${v.trend}` : '';
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight ${trendClass}">${v.value} ${trendIcon}</td>`;
          } else {
            htmlContent += `
                <td class="${trendClass}">${v.value} ${trendIcon}</td>`;
          }
        });
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`;
      });
      
      htmlContent += `
        </tbody>
    </table>`;
    }

    // Section 3: Коагулограмма
    const coagulationTests = filteredTests.filter(t => t.category === 'Коагулограмма');
    if (coagulationTests.length > 0) {
      htmlContent += `

    <h3>3. Коагулограмма</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`;
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`;
      });
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`;
      
      coagulationTests.forEach((test) => {
        const values = getTestValuesWithTrends(test.name);
        const displayName = formatTestNameWithAbbreviation(test.name);
        htmlContent += `
            <tr>
                <td class="left-align">${displayName}${test.unit ? ' <span class="abbreviation">(' + test.unit + ')</span>' : ''}</td>`;
        
        values.forEach((v, idx) => {
          const trendIcon = getTrendIcon(v.trend);
          const trendClass = v.trend ? `trend-${v.trend}` : '';
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight ${trendClass}">${v.value} ${trendIcon}</td>`;
          } else {
            htmlContent += `
                <td class="${trendClass}">${v.value} ${trendIcon}</td>`;
          }
        });
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`;
      });
      
      htmlContent += `
        </tbody>
    </table>`;
    }

    // Section 4: Дополнительные показатели (остальные категории)
    const otherCategories = ['Лейкоцитарная формула', 'Общий анализ мочи', 'Другое'];
    const otherTests = filteredTests.filter(t => otherCategories.includes(t.category) || !['Общий анализ крови', 'Коагулограмма', ...biochemCategories].includes(t.category));
    if (otherTests.length > 0) {
      htmlContent += `

    <h3>4. Дополнительные показатели</h3>
    <table>
        <thead>
            <tr>
                <th class="left-align">Показатель</th>`;
      
      dates.forEach(d => {
        htmlContent += `
                <th>${formatDate(d.date)}</th>`;
      });
      
      htmlContent += `
                <th class="ref-col">Норма</th>
            </tr>
        </thead>
        <tbody>`;
      
      otherTests.forEach((test) => {
        const values = getTestValuesWithTrends(test.name);
        const displayName = formatTestNameWithAbbreviation(test.name);
        htmlContent += `
            <tr>
                <td class="left-align">${displayName}${test.unit ? ' <span class="abbreviation">(' + test.unit + ')</span>' : ''}</td>`;
        
        values.forEach((v, idx) => {
          const trendIcon = getTrendIcon(v.trend);
          const trendClass = v.trend ? `trend-${v.trend}` : '';
          if (v.isAbnormal) {
            htmlContent += `
                <td class="highlight ${trendClass}">${v.value} ${trendIcon}</td>`;
          } else {
            htmlContent += `
                <td class="${trendClass}">${v.value} ${trendIcon}</td>`;
          }
        });
        
        htmlContent += `
                <td class="ref-col">${test.normalRange || '—'}</td>
            </tr>`;
      });
      
      htmlContent += `
        </tbody>
    </table>`;
    }

    htmlContent += `

    <div class="footer">
        * Данные сформированы автоматически на основании предоставленных лабораторных отчетов.<br>
        ↑ - рост, ↓ - снижение, → - стабильно
    </div>

</body>
</html>`;

    // Send to server for PDF generation
    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        filename: `полный-сводный-отчет-${new Date().toISOString().split('T')[0]}.pdf`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Get PDF blob
    const pdfBlob = await response.blob();
    
    // Download PDF
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `полный-сводный-отчет-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('PDF export error:', error);
    alert('Ошибка при создании PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};
