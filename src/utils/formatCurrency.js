/**
 * Formatea un número como moneda con formato argentino/español
 * Usa punto (.) como separador de miles y coma (,) como separador decimal
 * @param {number|string} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales (por defecto 2)
 * @returns {string} Número formateado (ej: "1.234,56")
 */
export const formatCurrency = (value, decimals = 2) => {
  // Convertir a número
  const num = parseFloat(value);

  // Validar que sea un número válido
  if (isNaN(num)) {
    return "0,00";
  }

  // Separar parte entera y decimal
  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split(".");

  // Agregar separador de miles (punto)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Retornar con coma como separador decimal
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
};

/**
 * Formatea un número como moneda con el símbolo $
 * @param {number|string} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales (por defecto 2)
 * @returns {string} Moneda formateada (ej: "$1.234,56")
 */
export const formatCurrencyWithSymbol = (value, decimals = 2) => {
  return `$${formatCurrency(value, decimals)}`;
};
