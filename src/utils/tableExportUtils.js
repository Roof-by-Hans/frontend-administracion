import { utils as XLSXUtils, writeFile as writeXLSXFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEFAULT_EXCLUDED_FIELDS = ['acciones'];

const padTwo = (value) => String(value).padStart(2, '0');

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
  const worksheet = XLSXUtils.json_to_sheet(rows);
  const workbook = XLSXUtils.book_new();

  XLSXUtils.book_append_sheet(workbook, worksheet, 'Datos');
  writeXLSXFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
};

export const exportAsExcel = ({ rows = [], columns = [], fileName = 'tabla' }) => {
  const worksheet = XLSXUtils.json_to_sheet(rows);
  const workbook = XLSXUtils.book_new();

  XLSXUtils.book_append_sheet(workbook, worksheet, 'Datos');
  writeXLSXFile(workbook, `${fileName}.xlsx`);
};

export const exportAsPdf = ({ rows = [], columns = [], fileName = 'tabla' }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const headers = columns.map((column) => column.headerName);
  const body = rows.map((row) => headers.map((header) => row[header] ?? ''));

  autoTable(doc, {
    head: [headers],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [46, 46, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    startY: 30,
    margin: { left: 20, right: 20 },
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
