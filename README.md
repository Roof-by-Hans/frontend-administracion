# React + Expo - Plantilla Básica

Proyecto de ejemplo básico similar a la plantilla de Vite, con:

- ✅ Menú de navegación
- ✅ Popup/Modal demo
- ✅ Contador interactivo
- ✅ Estructura organizada (src/components, src/assets, src/styles)

## 🚀 Estructura del Proyecto

```
frontend-administracion/
├── App.js                      # Componente principal
├── src/
│   ├── components/             # Componentes reutilizables
│   │   ├── Navbar.js          # Menú de navegación
│   │   ├── Counter.js         # Contador interactivo
│   │   └── DemoModal.js       # Modal/Popup demo
│   ├── assets/                # Imágenes, iconos, etc.
│   └── styles/                # Estilos compartidos
├── package.json
└── README.md
```

## 📦 Componentes

### Navbar

Menú de navegación con enlaces y botón para abrir el modal demo.

### Counter

Contador interactivo con botones para incrementar, decrementar y resetear.

### DemoModal

Popup de demostración que se puede abrir y cerrar.

## 🛠️ Scripts Disponibles

### Iniciar el proyecto

```bash
npm start
```

### Ejecutar en Web

```bash
npm run web
```

### Ejecutar en Android

```bash
npm run android
```

### Ejecutar en iOS

```bash
npm run ios
```

## 🎨 Personalización

- Los componentes están en `src/components/`
- Puedes agregar assets en `src/assets/`
- Los estilos siguen el tema oscuro de Vite (#0f0f0f, #646cff)

## 📝 Notas

Este proyecto usa React Native con Expo, por lo que los estilos se definen usando StyleSheet en lugar de CSS.
Los componentes son totalmente personalizables y siguen las mejores prácticas de React.
