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
  settingsSubtitle: string;
  settingsAutoLaunchTitle: string;
  settingsAutoLaunchDesc: string;
  settingsHiddenFilesTitle: string;
  settingsHiddenFilesDesc: string;
  settingsDryRunTitle: string;
  settingsDryRunDesc: string;
  settingsThresholdTitle: string;
  settingsThresholdDesc: string;
  settingsThresholdSuffix: string;
  settingsCancel: string;
  settingsSave: string;

  startScanButton: string;

  settingsIgnoreListTitle: string;
  settingsIgnoreListDesc: string;
  settingsIgnoreListButton: string;
  settingsIgnoreListEmpty: string;

  scanDialogScanningTitle: string;
  scanDialogScanningSubtitle: string;
  scanDialogDoneTitle: string;
  scanDialogFilesLabel: string;
  scanDialogClose: string;

  historyLabel: string;
  statsLabel: string;
  tableTrashLabel: string;

  statsSubtitle: string;
  statsChartTitle: string;
  statsMetricFilesDeleted: string;
  statsMetricSpaceFreed: string;
  statsMetricAvgScore: string;
  statsMetricBestDay: string;
  statsMetricWorstDay: string;
  statsMetricLifetimeSub: string;
  statsMetricSpaceSub: string;
  statsMetricWeeklySub: string;

  statsWeekDaysShort: string[];

  statsWeekEmpty: string;
}

export const TEXTS: Record<Lang, AppTexts> = {
  uk: {
    langLabel: "УКР",
    filesOnDesktop: "Файлів на Desktop",
    totalSize: "Сумарний розмір",
    cleanlinessScore: "Показник чистоти",
    chartTitle: "Розподіл файлів за типами",
    tableTitle: "Список файлів",
    colName: "Назва",
    colExt: "Розширення",
    colSize: "Розмір",
    colModified: "Остання зміна",
    colAccess: "Останній доступ",
    loading: "Завантаження...",
    errorFallback: "Не вдалося завантажити дані.",

    catImages: "Зображення",
    catDocs: "Документи",
    catArchives: "Архіви",
    catOther: "Інше",

    settingsLabel: "Налаштування",
    settingsSubtitle: "Базові параметри поведінки DesktopCleaner",
    settingsAutoLaunchTitle: "Автозапуск разом із системою",
    settingsAutoLaunchDesc: "Запускати DesktopCleaner після входу в Windows",
    settingsHiddenFilesTitle: "Враховувати приховані файли",
    settingsHiddenFilesDesc: "Додавати системні та приховані файли до статистики",
    settingsDryRunTitle: "Тільки аналіз, без видалення",
    settingsDryRunDesc:
      "Показувати рекомендації, але не видаляти нічого автоматично",
    settingsThresholdTitle: "Поріг очищення за неактивністю",
    settingsThresholdDesc:
      "Після скількох днів без використання файл вважати сміттям",
    settingsThresholdSuffix: "днів без використання",
    settingsCancel: "Скасувати",
    settingsSave: "Зберегти",

    startScanButton: "Почати сканування",

    settingsIgnoreListTitle: "Список недоторканих файлів",
    settingsIgnoreListDesc:
      "Файли й шляхи, які програма ніколи не буде чіпати під час очищення",
    settingsIgnoreListButton: "Керувати списком",
    settingsIgnoreListEmpty: "Список поки порожній",

    scanDialogScanningTitle: "Сканування робочого стола",
    scanDialogScanningSubtitle: "Аналізуємо файли та активність...",
    scanDialogDoneTitle: "Сканування завершено",
    scanDialogFilesLabel: "Файлів відскановано",
    scanDialogClose: "Закрити",

    historyLabel: "Історія",
    statsLabel: "Статистика",
    tableTrashLabel: "До кошика",

    statsSubtitle: "Коротка історія чистоти вашого робочого стола.",
    statsChartTitle: "Чистота Desktop за останній тиждень",
    statsMetricFilesDeleted: "Файлів видалено загалом",
    statsMetricSpaceFreed: "Місця звільнено",
    statsMetricAvgScore: "Середній показник чистоти",
    statsMetricBestDay: "Найчистіший день",
    statsMetricWorstDay: "Найзахаращеніший день",
    statsMetricLifetimeSub: "За весь час роботи DesktopCleaner",
    statsMetricSpaceSub: "Сумарно по всіх очищеннях",
    statsMetricWeeklySub: "Середнє значення за тиждень",

    statsWeekDaysShort: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
    statsWeekEmpty: "Немає даних за тиждень — зробіть кілька сканувань.",
  },

  en: {
    langLabel: "EN",
    filesOnDesktop: "Files on Desktop",
    totalSize: "Total size",
    cleanlinessScore: "Cleanliness score",
    chartTitle: "File type distribution",
    tableTitle: "Files list",
    colName: "Name",
    colExt: "Extension",
    colSize: "Size",
    colModified: "Last modified",
    colAccess: "Last accessed",
    loading: "Loading...",
    errorFallback: "Failed to load data.",

    catImages: "Images",
    catDocs: "Documents",
    catArchives: "Archives",
    catOther: "Other",

    settingsLabel: "Settings",
    settingsSubtitle: "Core behavior of DesktopCleaner",
    settingsAutoLaunchTitle: "Launch on system startup",
    settingsAutoLaunchDesc: "Start DesktopCleaner after logging into Windows",
    settingsHiddenFilesTitle: "Include hidden files",
    settingsHiddenFilesDesc:
      "Add system and hidden files to the statistics and analysis",
    settingsDryRunTitle: "Analysis only, no deletion",
    settingsDryRunDesc:
      "Show recommendations but do not delete anything automatically",
    settingsThresholdTitle: "Inactivity cleanup threshold",
    settingsThresholdDesc:
      "After how many days of inactivity a file is considered junk",
    settingsThresholdSuffix: "days without use",
    settingsCancel: "Cancel",
    settingsSave: "Save",

    startScanButton: "Start scan",

    settingsIgnoreListTitle: "Protected files list",
    settingsIgnoreListDesc:
      "Files and paths that DesktopCleaner will never touch during cleanup",
    settingsIgnoreListButton: "Manage list",
    settingsIgnoreListEmpty: "List is empty for now",

    scanDialogScanningTitle: "Desktop scanning",
    scanDialogScanningSubtitle: "Analyzing files and activity...",
    scanDialogDoneTitle: "Scan complete",
    scanDialogFilesLabel: "Files scanned",
    scanDialogClose: "Close",

    historyLabel: "History",
    statsLabel: "Statistics",
    tableTrashLabel: "Move to recycle bin",

    statsSubtitle: "How clean your desktop was over the last week.",
    statsChartTitle: "Desktop cleanliness over the last week",
    statsMetricFilesDeleted: "Files deleted in total",
    statsMetricSpaceFreed: "Space freed",
    statsMetricAvgScore: "Average cleanliness score",
    statsMetricBestDay: "Cleanest day",
    statsMetricWorstDay: "Messiest day",
    statsMetricLifetimeSub: "For the whole DesktopCleaner lifetime",
    statsMetricSpaceSub: "Across all cleanups",
    statsMetricWeeklySub: "Average value for this week",

    statsWeekDaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    statsWeekEmpty: "No weekly stats yet — run a few scans to see the trend.",
  },

  ru: {
    langLabel: "РУС",
    filesOnDesktop: "Файлов на рабочем столе",
    totalSize: "Суммарный размер",
    cleanlinessScore: "Показатель чистоты",
    chartTitle: "Распределение файлов по типам",
    tableTitle: "Список файлов",
    colName: "Имя",
    colExt: "Расширение",
    colSize: "Размер",
    colModified: "Последнее изменение",
    colAccess: "Последний доступ",
    loading: "Загрузка...",
    errorFallback: "Не удалось загрузить данные.",

    catImages: "Изображения",
    catDocs: "Документы",
    catArchives: "Архивы",
    catOther: "Другое",

    settingsLabel: "Настройки",
    settingsSubtitle: "Базовые параметры работы DesktopCleaner",
    settingsAutoLaunchTitle: "Автозапуск вместе с системой",
    settingsAutoLaunchDesc: "Запускать DesktopCleaner после входа в Windows",
    settingsHiddenFilesTitle: "Учитывать скрытые файлы",
    settingsHiddenFilesDesc:
      "Добавлять системные и скрытые файлы в статистику",
    settingsDryRunTitle: "Только анализ, без удаления",
    settingsDryRunDesc:
      "Показывать рекомендации, но ничего не удалять автоматически",
    settingsThresholdTitle: "Порог очистки по неактивности",
    settingsThresholdDesc:
      "Через сколько дней без использования считать файл мусором",
    settingsThresholdSuffix: "дней без использования",
    settingsCancel: "Отмена",
    settingsSave: "Сохранить",

    startScanButton: "Начать сканирование",

    settingsIgnoreListTitle: "Список неприкасаемых файлов",
    settingsIgnoreListDesc:
      "Файлы и пути, которые программа никогда не будет трогать при очистке",
    settingsIgnoreListButton: "Управлять списком",
    settingsIgnoreListEmpty: "Список пока пуст",

    scanDialogScanningTitle: "Сканирование рабочего стола",
    scanDialogScanningSubtitle: "Анализируем файлы и активность...",
    scanDialogDoneTitle: "Сканирование завершено",
    scanDialogFilesLabel: "Файлов отсканировано",
    scanDialogClose: "Закрыть",

    historyLabel: "История",
    statsLabel: "Статистика",
    tableTrashLabel: "В корзину",

    statsSubtitle: "Краткая история чистоты вашего рабочего стола.",
    statsChartTitle: "Чистота рабочего стола за последнюю неделю",
    statsMetricFilesDeleted: "Файлов удалено всего",
    statsMetricSpaceFreed: "Освобождено места",
    statsMetricAvgScore: "Средний показатель чистоты",
    statsMetricBestDay: "Самый чистый день",
    statsMetricWorstDay: "Самый загруженный день",
    statsMetricLifetimeSub: "За всё время работы DesktopCleaner",
    statsMetricSpaceSub: "Суммарно по всем очисткам",
    statsMetricWeeklySub: "Среднее значение за неделю",

    statsWeekDaysShort: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    statsWeekEmpty: "Пока нет данных за неделю — выполните несколько сканирований.",
  },
};
