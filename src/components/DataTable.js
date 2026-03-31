import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Menu, MenuItem, Paper } from '@mui/material';
import {
  buildFileName,
  exportAsCsv,
  exportAsExcel,
  exportAsPdf,
  prepareTableDataForExport,
} from '../utils/tableExportUtils';

const DEFAULT_LOGO_URI = null;

const toExportTitle = (baseName = 'tabla') => {
  return String(baseName)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/**
 * Componente de tabla reutilizable con Material-UI DataGrid
 * Incluye filtrado, ordenamiento y paginación nativos
 * 
 * @param {Array} rows - Datos de la tabla (debe incluir un campo 'id')
 * @param {Array} columns - Definición de columnas
 * @param {Function} onEdit - Callback cuando se hace clic en editar
 * @param {Function} onDelete - Callback cuando se hace clic en eliminar
 * @param {Number} pageSize - Tamaño de página por defecto (default: 10)
 * @param {Number} rowHeight - Altura de las filas en píxeles (default: 80)
 * @param {Boolean} checkboxSelection - Habilitar selección múltiple (default: false)
 * @param {Object} sx - Estilos personalizados de Material-UI
 */
export default function DataTable({
  rows,
  columns,
  onEdit,
  onDelete,
  pageSize = 10,
  checkboxSelection = false,
  rowHeight = 80,
  exportEnabled = true,
  exportFileBaseName = 'tabla',
  exportExcludeFields = ['acciones'],
  exportOptions = {},
  sx = {},
  ...props
}) {
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const isExportMenuOpen = Boolean(exportAnchorEl);

  const { exportColumns, exportRows } = useMemo(() => {
    return prepareTableDataForExport({
      rows,
      columns,
      excludeFields: exportExcludeFields,
    });
  }, [rows, columns, exportExcludeFields]);

  const closeExportMenu = () => setExportAnchorEl(null);

  const openExportMenu = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const runExport = async (type) => {
    if (!exportRows.length || !exportColumns.length) {
      closeExportMenu();
      return;
    }

    const fileName = buildFileName(exportFileBaseName);
    const payload = {
      rows: exportRows,
      columns: exportColumns,
      fileName,
      options: {
        title: `Reporte de ${toExportTitle(exportFileBaseName)}`,
        subtitle: 'Documento exportado desde panel de administracion',
        ...(DEFAULT_LOGO_URI ? { logoPath: DEFAULT_LOGO_URI } : {}),
        ...exportOptions,
      },
    };

    try {
      if (type === 'csv') {
        exportAsCsv(payload);
      }

      if (type === 'excel') {
        exportAsExcel(payload);
      }

      if (type === 'pdf') {
        await exportAsPdf(payload);
      }
    } finally {
      closeExportMenu();
    }
  };

  return (
    <View style={styles.container}>
      <Paper sx={{ height: 600, width: '100%', ...sx }}>
        {exportEnabled && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={openExportMenu}
              aria-controls={isExportMenuOpen ? 'datatable-export-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={isExportMenuOpen ? 'true' : undefined}
            >
              Exportar
            </Button>
            <Menu
              id="datatable-export-menu"
              anchorEl={exportAnchorEl}
              open={isExportMenuOpen}
              onClose={closeExportMenu}
            >
              <MenuItem onClick={() => runExport('csv')}>CSV</MenuItem>
              <MenuItem onClick={() => runExport('excel')}>Excel</MenuItem>
              <MenuItem onClick={() => runExport('pdf')}>PDF</MenuItem>
            </Menu>
          </Box>
        )}
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick
          rowHeight={rowHeight}
          sx={{
            border: 0,
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f9f9f9',
            },
          }}
          {...props}
        />
      </Paper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
