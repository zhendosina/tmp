// Common blood test abbreviations mapping
export const testAbbreviations: Record<string, string> = {
  // Общий анализ крови - Эритроциты
  "Эритроциты": "RBC",
  "Erythrocytes": "RBC",
  "Red Blood Cells": "RBC",
  
  // Общий анализ крови - Лейкоциты
  "Лейкоциты": "WBC",
  "Leukocytes": "WBC",
  "White Blood Cells": "WBC",
  
  // Общий анализ крови - Гемоглобин
  "Гемоглобин": "HGB, Hb",
  "Hemoglobin": "HGB, Hb",
  
  // Общий анализ крови - Гематокрит
  "Гематокрит": "HCT",
  "Hematocrit": "HCT",
  
  // Общий анализ крови - Тромбоциты
  "Тромбоциты": "PLT",
  "Platelets": "PLT",
  
  // Индексы эритроцитов
  "MCV": "MCV",
  "Средний объем эритроцита": "MCV",
  "MCH": "MCH",
  "Среднее содержание Hb в эритроците": "MCH",
  "MCHC": "MCHC",
  "Средняя концентрация Hb в эритроците": "MCHC",
  "RDW": "RDW",
  "RDW-CV": "RDW-CV",
  "Распределение эритроцитов по объему": "RDW",
  "RCDW": "RDW",
  
  // Лейкоцитарная формула
  "Нейтрофилы": "NEU",
  "Neutrophils": "NEU",
  "Лимфоциты": "LYM",
  "Lymphocytes": "LYM",
  "Моноциты": "MON",
  "Monocytes": "MON",
  "Эозинофилы": "EOS",
  "Eosinophils": "EOS",
  "Базофилы": "BAS",
  "Basophils": "BAS",
  "Незрелые гранулоциты": "IG",
  "Immature granulocytes": "IG",
  "Палочкоядерные нейтрофилы": "Band neutrophils",
  "Сегментоядерные нейтрофилы": "Seg neutrophils",
  
  // Скорость оседания эритроцитов
  "СОЭ": "ESR",
  "Скорость оседания эритроцитов": "ESR",
  "ESR": "ESR",
  "Erythrocyte Sedimentation Rate": "ESR",
  
  // Липидный профиль
  "Холестерин общий": "TC, CHOL",
  "Total cholesterol": "TC, CHOL",
  "Холестерин": "TC, CHOL",
  "Cholesterol": "TC, CHOL",
  "ЛПНП": "LDL-C",
  "Холестерин липопротеидов низкой плотности": "LDL-C",
  "LDL": "LDL-C",
  "Low-density lipoprotein": "LDL-C",
  "ЛПВП": "HDL-C",
  "Холестерин липопротеидов высокой плотности": "HDL-C",
  "HDL": "HDL-C",
  "High-density lipoprotein": "HDL-C",
  "Триглицериды": "TG",
  "Triglycerides": "TG",
  "Triglyceride": "TG",
  "ЛПОНП": "VLDL",
  "Липопротеиды очень низкой плотности": "VLDL",
  "VLDL": "VLDL",
  "Коэффициент атерогенности": "AC, CRR",
  "Атерогенный коэффициент": "AC, CRR",
  
  // Глюкоза
  "Глюкоза": "GLU",
  "Glucose": "GLU",
  "Сахар крови": "GLU",
  "Blood sugar": "GLU",
  
  // Печеночные пробы
  "АЛТ": "ALT, ALAT",
  "Аланинаминотрансфераза": "ALT, ALAT",
  "Alanine aminotransferase": "ALT, ALAT",
  "АСТ": "AST, ASAT",
  "Аспартатаминотрансфераза": "AST, ASAT",
  "Aspartate aminotransferase": "AST, ASAT",
  "Билирубин общий": "Tbil",
  "Total bilirubin": "Tbil",
  "Билирубин прямой": "Dbil",
  "Direct bilirubin": "Dbil",
  "Билирубин непрямой": "Ibil",
  "Indirect bilirubin": "Ibil",
  "Щелочная фосфатаза": "ALP",
  "Alkaline phosphatase": "ALP",
  "ГГТ": "GGT, GGTP",
  "Гамма-глутамилтрансфераза": "GGT, GGTP",
  "Gamma-glutamyl transferase": "GGT, GGTP",
  "Альбумин": "ALB",
  "Albumin": "ALB",
  "Общий белок": "TP, PROT",
  "Total protein": "TP, PROT",
  
  // Почечные пробы
  "Креатинин": "CREA, Cr",
  "Creatinine": "CREA, Cr",
  "Мочевина": "UREA, BUN",
  "Urea": "UREA, BUN",
  "Blood urea nitrogen": "BUN",
  "Мочевая кислота": "UA, URIC",
  "Uric acid": "UA, URIC",
  "СКФ": "eGFR, GFR",
  "Скорость клубочковой фильтрации": "eGFR, GFR",
  "GFR": "eGFR, GFR",
  "Glomerular filtration rate": "eGFR, GFR",
  
  // Электролиты
  "Натрий": "Na",
  "Sodium": "Na",
  "Калий": "K",
  "Potassium": "K",
  "Хлор": "Cl",
  "Chloride": "Cl",
  "Кальций": "Ca",
  "Calcium": "Ca",
  "Фосфор": "P, PHOS",
  "Phosphorus": "P, PHOS",
  "Phosphate": "P, PHOS",
  "Магний": "Mg",
  "Magnesium": "Mg",
  
  // Железо
  "Железо": "Fe, IRON",
  "Iron": "Fe, IRON",
  "Ферритин": "FERR",
  "Ferritin": "FERR",
  "Трансферрин": "TRF",
  "Transferrin": "TRF",
  "ОЖСС": "TIBC",
  "Общая железосвязывающая способность": "TIBC",
  "Total iron binding capacity": "TIBC",
  
  // Витамины
  "Витамин D": "Vit D, 25-OH",
  "Vitamin D": "Vit D, 25-OH",
  "25-OH": "25-OH",
  "Витамин B12": "Vit B12",
  "Vitamin B12": "Vit B12",
  "Витамин B9": "Folate, B9",
  "Фолиевая кислота": "Folate, B9",
  "Folic acid": "Folate, B9",
  
  // Гормоны
  "ТТГ": "TSH",
  "Тиреотропный гормон": "TSH",
  "Thyroid stimulating hormone": "TSH",
  "Т3 свободный": "FT3",
  "Free T3": "FT3",
  "Т4 свободный": "FT4",
  "Free T4": "FT4",
  "Т3 общий": "T3",
  "Total T3": "T3",
  "Т4 общий": "T4",
  "Total T4": "T4",
  "АТ к ТПО": "Anti-TPO, TPOAb",
  "Антитела к тиреопероксидазе": "Anti-TPO, TPOAb",
  "АТ к ТГ": "Anti-TG, TgAb",
  "Антитела к тиреоглобулину": "Anti-TG, TgAb",
  
  // Коагулограмма
  "ПВ": "PT, Prothrombin time",
  "Протромбиновое время": "PT",
  "Протромбин": "PT",
  "По Квику": "PT",
  "МНО": "INR",
  "International normalized ratio": "INR",
  "АЧТВ": "APTT, aPTT",
  "Активированное частичное тромбопластиновое время": "APTT, aPTT",
  "АПТВ": "APTT, aPTT",
  "Тромбиновое время": "TT",
  "Thrombin time": "TT",
  "Фибриноген": "FIB",
  "Fibrinogen": "FIB",
  "D-димер": "D-dimer",
  "D-dimer": "D-dimer",
  "Антитромбин III": "AT III",
  "Antithrombin III": "AT III",
  
  // Воспаление
  "СРБ": "CRP",
  "C-реактивный белок": "CRP",
  "C-reactive protein": "CRP",
  "Прокальцитонин": "PCT",
  "Procalcitonin": "PCT",
  
  // Диабет
  "Гликированный гемоглобин": "HbA1c, A1C",
  "HbA1c": "HbA1c, A1C",
  "Glycated hemoglobin": "HbA1c, A1C",
  "Гликозилированный гемоглобин": "HbA1c, A1C",
  "Инсулин": "INS",
  "Insulin": "INS",
  "Пептид C": "C-Peptide",
  "C-Peptide": "C-Peptide",
  
  // Газовый состав крови
  "рН": "pH",
  "pCO2": "pCO2",
  "pO2": "pO2",
  "HCO3": "HCO3",
  "Бикарбонаты": "HCO3",
  "Bicarbonate": "HCO3",
  "BE": "BE",
  "ОВЩ": "BE",
  "Основной избыток": "BE",
  "Base excess": "BE",
  "SO2": "SatO2, SO2",
  "Saturation": "SatO2",
  "Сатурация": "SatO2",
  
  // Ферменты
  "Креатинфосфокиназа": "CK, CPK",
  "КФК": "CK, CPK",
  "Creatine kinase": "CK, CPK",
  "Креатинкиназа МВ": "CK-MB",
  "CK-MB": "CK-MB",
  "Тропонин I": "cTnI, TnI",
  "Troponin I": "cTnI, TnI",
  "Тропонин T": "cTnT, TnT",
  "Troponin T": "cTnT, TnT",
  "Миоглобин": "MYO",
  "Myoglobin": "MYO",
  "ЛДГ": "LDH",
  "Лактатдегидрогеназа": "LDH",
  "Lactate dehydrogenase": "LDH",
  
  // Печеночные пробы (доп)
  "Амилаза": "AMY, AMS",
  "Amylase": "AMY, AMS",
  "Липаза": "LPS, LIP",
  "Lipase": "LPS, LIP",
}

// Get abbreviation for a test name
export function getTestAbbreviation(testName: string): string | null {
  // Direct match
  if (testAbbreviations[testName]) {
    return testAbbreviations[testName]
  }
  
  // Case insensitive match
  const lowerTestName = testName.toLowerCase()
  for (const [key, value] of Object.entries(testAbbreviations)) {
    if (key.toLowerCase() === lowerTestName) {
      return value
    }
  }
  
  // Partial match (check if test name contains the key)
  for (const [key, value] of Object.entries(testAbbreviations)) {
    if (lowerTestName.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return null
}

// Format test name with abbreviation
export function formatTestNameWithAbbreviation(testName: string): string {
  const abbreviation = getTestAbbreviation(testName)
  if (abbreviation) {
    return `${testName} (${abbreviation})`
  }
  return testName
}
