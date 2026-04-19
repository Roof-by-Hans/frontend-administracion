import XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEFAULT_EXCLUDED_FIELDS = ['acciones'];
const DEFAULT_SHEET_NAME = 'Datos';
const DEFAULT_EXPORT_OPTIONS = {
  locale: 'es-AR',
  companyName: 'Roof by Hans',
  systemName: 'Sistema de Administracion',
  title: 'Reporte de tabla',
  subtitle: 'Exportacion de datos',
  logoPath: null,
  primaryColor: '#2E2E2E',
  secondaryColor: '#4CAF50',
  headerTextColor: '#FFFFFF',
};
const LOGO_CACHE = new Map();

const padTwo = (value) => String(value).padStart(2, '0');

const sanitizeText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const hexToRgb = (hexColor) => {
  const safeHex = (hexColor || '').replace('#', '').trim();

  if (safeHex.length !== 6) {
    return [46, 46, 46];
  }

  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return [46, 46, 46];
  }

  return [red, green, blue];
};

const formatDateTime = (date = new Date(), locale = 'es-AR') => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const resolveExportOptions = (options = {}) => {
  return {
    ...DEFAULT_EXPORT_OPTIONS,
    ...options,
  };
};

const asSafeCellValue = (value, maxLength = 500) => {
  const text = sanitizeText(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
};

const escapeCsvValue = (value) => {
  const text = asSafeCellValue(value, 2000);
  const escaped = text.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
};

const triggerDownloadFromBlob = (blob, fileName) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const resolveLogoDataUrl = async (logoPath) => {
  if (!logoPath || typeof window === 'undefined' || typeof fetch !== 'function') {
    return null;
  }

  if (typeof logoPath === 'string' && logoPath.startsWith('data:image')) {
    return logoPath;
  }

  if (LOGO_CACHE.has(logoPath)) {
    return LOGO_CACHE.get(logoPath);
  }

  try {
    const response = await fetch(logoPath);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    LOGO_CACHE.set(logoPath, dataUrl);
    return dataUrl;
  } catch (error) {
    return null;
  }
};

const getColumnWidths = (rows = [], columns = []) => {
  return columns.map((column) => {
    const headerLength = sanitizeText(column.headerName).length;
    const longestCell = rows.reduce((maxLength, row) => {
      const cellLength = sanitizeText(row[column.headerName] ?? '').length;
      return Math.max(maxLength, cellLength);
    }, 0);

    const width = Math.min(48, Math.max(14, Math.ceil(Math.max(headerLength, longestCell) * 1.1)));
    return { wch: width };
  });
};

const toExcelColor = (hexColor) => {
  return (hexColor || '#2E2E2E').replace('#', '').toUpperCase();
};

export const buildFileName = (baseName = 'tabla') => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padTwo(now.getMonth() + 1);
  const day = padTwo(now.getDate());
  const hours = padTwo(now.getHours());
  const minutes = padTwo(now.getMinutes());

  return `${baseName}_${year}-${month}-${day}_${hours}-${minutes}`;
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null || item === undefined) {
          return '';
        }
        return typeof item === 'object' ? JSON.stringify(item) : String(item);
      })
      .join(', ');
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const safeCallValueGetter = (column, rawValue, row) => {
  if (typeof column.valueGetter !== 'function') {
    return rawValue;
  }

  try {
    return column.valueGetter(rawValue, row, column, null);
  } catch (error) {
    try {
      return column.valueGetter({ value: rawValue, row, field: column.field, colDef: column });
    } catch (innerError) {
      return rawValue;
    }
  }
};

const safeCallValueFormatter = (column, value, row) => {
  if (typeof column.valueFormatter !== 'function') {
    return value;
  }

  try {
    return column.valueFormatter(value, row, column, null);
  } catch (error) {
    try {
      return column.valueFormatter({ value, row, field: column.field, colDef: column });
    } catch (innerError) {
      return value;
    }
  }
};

export const buildExportColumns = (columns = [], excludeFields = DEFAULT_EXCLUDED_FIELDS) => {
  const excludedSet = new Set(excludeFields || []);

  return columns
    .filter((column) => {
      if (!column || !column.field) {
        return false;
      }

      if (column.disableExport === true) {
        return false;
      }

      if (column.type === 'actions') {
        return false;
      }

      if (excludedSet.has(column.field)) {
        return false;
      }

      return true;
    })
    .map((column) => ({
      field: column.field,
      headerName: column.headerName || column.field,
      valueGetter: column.valueGetter,
      valueFormatter: column.valueFormatter,
    }));
};

export const buildExportRows = (rows = [], columns = []) => {
  return rows.map((row) => {
    const outputRow = {};

    columns.forEach((column) => {
      const rawValue = row?.[column.field];
      const withGetter = safeCallValueGetter(column, rawValue, row);
      const withFormatter = safeCallValueFormatter(column, withGetter, row);
      outputRow[column.headerName] = normalizeValue(withFormatter);
    });

    return outputRow;
  });
};

export const exportAsCsv = ({ rows = [], columns = [], fileName = 'tabla' }) => {
  const headers = columns.map((column) => column.headerName);

  if (!headers.length) {
    return;
  }

  const csvLines = [
    headers.map((header) => escapeCsvValue(header)).join(','),
    ...rows.map((row) =>
      columns
        .map((column) => escapeCsvValue(row[column.headerName] ?? ''))
        .join(',')
    ),
  ];

  const csvContent = `\uFEFF${csvLines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  triggerDownloadFromBlob(blob, `${fileName}.csv`);
};

export const exportAsExcel = ({ rows = [], columns = [], fileName = 'tabla', options = {} }) => {
  const exportOptions = resolveExportOptions(options);
  const headers = columns.map((column) => sanitizeText(column.headerName));

  if (!headers.length) {
    return;
  }

  const generatedAt = formatDateTime(new Date(), exportOptions.locale);
  const title = sanitizeText(exportOptions.title || DEFAULT_EXPORT_OPTIONS.title);
  const subtitle = sanitizeText(exportOptions.subtitle || DEFAULT_EXPORT_OPTIONS.subtitle);
  const metaText = `Generado: ${generatedAt}  |  ${sanitizeText(exportOptions.companyName)}`;
  const dataRows = rows.map((row) => headers.map((header) => asSafeCellValue(row[header] ?? '')));
  const aoa = [[title], [subtitle], [metaText], [], headers, ...dataRows];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const lastColumn = headers.length - 1;
  const headerRowIndex = 4;
  const firstDataRowIndex = headerRowIndex + 1;
  const primaryColor = toExcelColor(exportOptions.primaryColor);
  const secondaryColor = toExcelColor(exportOptions.secondaryColor);
  const headerTextColor = toExcelColor(exportOptions.headerTextColor);

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumn } },
  ];

  worksheet['A1'].s = {
    fill: { fgColor: { rgb: primaryColor } },
    font: { bold: true, sz: 15, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  worksheet['A2'].s = {
    fill: { fgColor: { rgb: secondaryColor } },
    font: { italic: true, sz: 11, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  worksheet['A3'].s = {
    font: { sz: 10, color: { rgb: '666666' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };

  headers.forEach((_, columnIndex) => {
    const headerAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: columnIndex });
    worksheet[headerAddress].s = {
      fill: { fgColor: { rgb: primaryColor } },
      font: { bold: true, sz: 10, color: { rgb: headerTextColor } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'D9D9D9' } },
        bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
        left: { style: 'thin', color: { rgb: 'D9D9D9' } },
        right: { style: 'thin', color: { rgb: 'D9D9D9' } },
      },
    };
  });

  dataRows.forEach((rowValues, rowIndex) => {
    const rowNumber = firstDataRowIndex + rowIndex;
    const useAltRow = rowIndex % 2 === 0;

    rowValues.forEach((_, columnIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNumber, c: columnIndex });
      if (!worksheet[cellAddress]) {
        return;
      }

      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: useAltRow ? 'F8F9FA' : 'FFFFFF' } },
        font: { sz: 10, color: { rgb: '222222' } },
        alignment: { vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'EAEAEA' } },
          bottom: { style: 'thin', color: { rgb: 'EAEAEA' } },
          left: { style: 'thin', color: { rgb: 'EAEAEA' } },
          right: { style: 'thin', color: { rgb: 'EAEAEA' } },
        },
      };
    });
  });

  worksheet['!cols'] = getColumnWidths(rows, columns);
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: Math.max(headerRowIndex, firstDataRowIndex + dataRows.length - 1), c: lastColumn },
    }),
  };
  worksheet['!rows'] = [{ hpt: 30 }, { hpt: 24 }, { hpt: 20 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeText(options.sheetName || DEFAULT_SHEET_NAME));
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportAsPdf = async ({ rows = [], columns = [], fileName = 'tabla', options = {} }) => {
  const exportOptions = resolveExportOptions(options);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const headers = columns.map((column) => column.headerName);
  const body = rows.map((row) => headers.map((header) => asSafeCellValue(row[header] ?? '', 350)));
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const title = sanitizeText(exportOptions.title || DEFAULT_EXPORT_OPTIONS.title);
  const subtitle = sanitizeText(exportOptions.subtitle || DEFAULT_EXPORT_OPTIONS.subtitle);
  const generatedAt = `Generado: ${formatDateTime(new Date(), exportOptions.locale)}`;
  const [primaryR, primaryG, primaryB] = hexToRgb(exportOptions.primaryColor);
  const [secondaryR, secondaryG, secondaryB] = hexToRgb(exportOptions.secondaryColor);
  const logoDataUrl = await resolveLogoDataUrl(exportOptions.logoPath);

  doc.setFillColor(248, 249, 250);
  doc.rect(20, 18, pageWidth - 40, 66, 'F');
  doc.setDrawColor(224, 224, 224);
  doc.rect(20, 18, pageWidth - 40, 66);

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 28, 26, 38, 38);
    } catch (error) {
      
    }
  }

  doc.setTextColor(primaryR, primaryG, primaryB);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, logoDataUrl ? 78 : 30, 42);

  doc.setTextColor(76, 76, 76);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, logoDataUrl ? 78 : 30, 58);
  doc.text(generatedAt, pageWidth - 210, 42);
  doc.text(sanitizeText(exportOptions.companyName), pageWidth - 210, 58);

  autoTable(doc, {
    head: [headers],
    body,
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      overflow: 'linebreak',
      textColor: [33, 33, 33],
      lineColor: [234, 234, 234],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [primaryR, primaryG, primaryB],
      textColor: hexToRgb(exportOptions.headerTextColor),
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    startY: 94,
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `${sanitizeText(exportOptions.systemName)} - Pagina ${pageNumber}`,
        data.settings.margin.left,
        pageHeight - 14
      );

      doc.setDrawColor(secondaryR, secondaryG, secondaryB);
      doc.setLineWidth(1);
      doc.line(20, pageHeight - 24, pageWidth - 20, pageHeight - 24);
    },
  });

  doc.save(`${fileName}.pdf`);
};

export const prepareTableDataForExport = ({ rows = [], columns = [], excludeFields = DEFAULT_EXCLUDED_FIELDS }) => {
  const exportColumns = buildExportColumns(columns, excludeFields);
  const exportRows = buildExportRows(rows, exportColumns);

  return {
    exportColumns,
    exportRows,
  };
};
