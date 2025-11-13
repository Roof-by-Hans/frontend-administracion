import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';

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
  sx = {},
  ...props
}) {
  return (
    <View style={styles.container}>
      <Paper sx={{ height: 600, width: '100%', ...sx }}>
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
