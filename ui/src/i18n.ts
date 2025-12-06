export type Lang = "uk" | "en" | "ru";

export interface AppTexts {
  langLabel: string;
  filesOnDesktop: string;
  totalSize: string;
  cleanlinessScore: string;
  chartTitle: string;
  tableTitle: string;
  colName: string;
  colExt: string;
  colSize: string;
  colModified: string;
  colAccess: string;
  loading: string;
  errorFallback: string;

  catImages: string;
  catDocs: string;
  catArchives: string;
  catOther: string;

  settingsLabel: string;
}

export const TEXTS: Record<Lang, AppTexts> = {
  uk: {
    langLabel: "УКР",
    filesOnDesktop: "Файлів на Desktop",
    totalSize: "Сумарний розмір",
    cleanlinessScore: "Cleanliness score",
    chartTitle: "Розподіл файлів за типами",
    tableTitle: "Список файлів",
    colName: "Назва",
    colExt: "Розширення",
    colSize: "Розмір",
    colModified: "Остання зміна",
    colAccess: "Останній доступ",
    loading: "Завантаження...",
    errorFallback: "Не вдалося завантажити дані, показую моки.",

    catImages: "Зображення",
    catDocs: "Документи",
    catArchives: "Архіви",
    catOther: "Інше",

    settingsLabel: "Налаштування",
  },
  en: {
    langLabel: "EN",
    filesOnDesktop: "Files on Desktop",
    totalSize: "Total size",
    cleanlinessScore: "Cleanliness score",
    chartTitle: "File types distribution",
    tableTitle: "Files list",
    colName: "Name",
    colExt: "Extension",
    colSize: "Size",
    colModified: "Last modified",
    colAccess: "Last accessed",
    loading: "Loading...",
    errorFallback: "Failed to load data, showing mocks.",

    catImages: "Images",
    catDocs: "Documents",
    catArchives: "Archives",
    catOther: "Other",

    settingsLabel: "Settings",
  },
  ru: {
    langLabel: "РУС",
    filesOnDesktop: "Файлов на рабочем столе",
    totalSize: "Суммарный размер",
    cleanlinessScore: "Cleanliness score",
    chartTitle: "Распределение файлов по типам",
    tableTitle: "Список файлов",
    colName: "Имя",
    colExt: "Расширение",
    colSize: "Размер",
    colModified: "Последнее изменение",
    colAccess: "Последний доступ",
    loading: "Загрузка...",
    errorFallback: "Не удалось загрузить данные, показываю заглушку.",

    catImages: "Изображения",
    catDocs: "Документы",
    catArchives: "Архивы",
    catOther: "Другое",

    settingsLabel: "Настройки",
  },
};

export function nextLang(current: Lang): Lang {
  if (current === "uk") return "en";
  if (current === "en") return "ru";
  return "uk";
}
