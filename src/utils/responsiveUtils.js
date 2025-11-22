import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

// Breakpoints centralizados para toda la aplicación
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1200,
};

// Tipos de dispositivos
export const DEVICE_TYPES = {
  MOBILE: "mobile",
  TABLET: "tablet",
  DESKTOP: "desktop",
};

// Espaciados adaptativos según el dispositivo
export const SPACING = {
  mobile: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  tablet: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 32,
  },
  desktop: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
};

// Tamaños de fuente adaptativos
export const FONT_SIZES = {
  mobile: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 32,
  },
  tablet: {
    xs: 13,
    sm: 15,
    md: 17,
    lg: 22,
    xl: 28,
    xxl: 32,
    xxxl: 36,
  },
  desktop: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },
};

/**
 * Hook personalizado para obtener información sobre el dispositivo actual
 * @returns {Object} Información del dispositivo y dimensiones
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const deviceInfo = useMemo(() => {
    const isMobile = width < BREAKPOINTS.MOBILE;
    const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
    const isDesktop = width >= BREAKPOINTS.TABLET;

    let deviceType = DEVICE_TYPES.DESKTOP;
    if (isMobile) deviceType = DEVICE_TYPES.MOBILE;
    else if (isTablet) deviceType = DEVICE_TYPES.TABLET;

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      deviceType,
      spacing: SPACING[deviceType],
      fontSize: FONT_SIZES[deviceType],
      isCompact: isMobile || isTablet,
      isLandscape: width > height,
      isPortrait: height > width,
    };
  }, [width, height]);

  return deviceInfo;
};

/**
 * Obtiene el valor apropiado según el tipo de dispositivo
 * @param {Object} values - Objeto con valores para mobile, tablet y desktop
 * @param {string} deviceType - Tipo de dispositivo actual
 * @returns {*} Valor correspondiente al dispositivo
 */
export const getResponsiveValue = (values, deviceType) => {
  if (values[deviceType] !== undefined) {
    return values[deviceType];
  }
  
  // Fallback: si no existe el valor para el dispositivo, usar desktop
  return values.desktop || values.tablet || values.mobile;
};

/**
 * Calcula el ancho del sidebar según el dispositivo
 * @param {string} deviceType - Tipo de dispositivo
 * @param {number} screenWidth - Ancho de la pantalla
 * @returns {number} Ancho del sidebar
 */
export const getSidebarWidth = (deviceType, screenWidth) => {
  if (deviceType === DEVICE_TYPES.MOBILE) {
    return Math.min(Math.max(screenWidth * 0.75, 240), 320);
  }
  return 260;
};

/**
 * Calcula el padding horizontal según el dispositivo
 * @param {string} deviceType - Tipo de dispositivo
 * @returns {number} Padding horizontal
 */
export const getHorizontalPadding = (deviceType) => {
  const paddings = {
    mobile: 20,
    tablet: 28,
    desktop: 32,
  };
  return paddings[deviceType] || 32;
};

/**
 * Calcula el padding vertical según el dispositivo
 * @param {string} deviceType - Tipo de dispositivo
 * @returns {number} Padding vertical
 */
export const getVerticalPadding = (deviceType) => {
  const paddings = {
    mobile: 16,
    tablet: 24,
    desktop: 28,
  };
  return paddings[deviceType] || 28;
};

/**
 * Determina si se debe mostrar el menú como overlay
 * @param {number} width - Ancho de la pantalla
 * @returns {boolean} True si debe ser overlay
 */
export const shouldShowMenuAsOverlay = (width) => {
  return width < BREAKPOINTS.MOBILE;
};

/**
 * Calcula el número de columnas para grids según el dispositivo
 * @param {string} deviceType - Tipo de dispositivo
 * @returns {number} Número de columnas
 */
export const getGridColumns = (deviceType) => {
  const columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };
  return columns[deviceType] || 3;
};
