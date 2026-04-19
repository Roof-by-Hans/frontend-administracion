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
  onFilterChange,
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
      
      {exportEnabled && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, pb: 0 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={openExportMenu}
          >
            Exportar
          </Button>
        </Box>
      )}
      <Paper sx={{ height: exportEnabled ? 560 : 600, width: '100%', ...sx }}>
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
          onFilterModelChange={onFilterChange}
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
