// Test PDF generation with Russian text
const testReportData = {
  tests: [
    {
      test_name: "Гемоглобин",
      value: 14.5,
      unit: "г/дл",
      normal_range: "12.0-15.0",
      status: "Normal",
      category: "Общий анализ крови"
    },
    {
      test_name: "Лейкоциты",
      value: 8.2,
      unit: "тыс/мкл",
      normal_range: "4.0-10.0",
      status: "Normal",
      category: "Общий анализ крови"
    },
    {
      test_name: "Глюкоза",
      value: 95,
      unit: "мг/дл",
      normal_range: "70-100",
      status: "Normal",
      category: "Биохимия"
    }
  ]
};

console.log("Test report data created successfully with Russian text");
console.log("Sample test:", testReportData.tests[0]);