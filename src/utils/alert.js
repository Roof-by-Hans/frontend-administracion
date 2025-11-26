import { Platform, Alert as RNAlert } from 'react-native';

const Alert = {
  alert: (title, message, buttons, options) => {
    if (Platform.OS === 'web') {
      // Para web, usar alert del navegador o una implementación personalizada
      const buttonText = buttons && buttons.length > 0 ? buttons[0].text : 'OK';
      const confirmed = window.confirm(`${title}\n\n${message}`);
      
      if (buttons && buttons.length > 0) {
        const button = buttons[0];
        if (button.onPress) {
          button.onPress();
        }
      }
    } else {
      // Para iOS y Android, usar el Alert nativo
      RNAlert.alert(title, message, buttons, options);
    }
  },
};

export default Alert;
