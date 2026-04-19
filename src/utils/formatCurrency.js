export const formatCurrency = (value, decimals = 2) => {
  const num = parseFloat(value);

    if (isNaN(num)) {
    return "0,00";
  }
  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split(".");

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
};


export const formatCurrencyWithSymbol = (value, decimals = 2) => {
  return `$${formatCurrency(value, decimals)}`;
};
