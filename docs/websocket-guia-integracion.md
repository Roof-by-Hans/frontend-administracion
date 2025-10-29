# WebSocket - Integración con React Native

Esta guía explica cómo está implementada la integración de WebSocket con el backend de mesas en esta aplicación React Native.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso Básico](#uso-básico)
- [API Reference](#api-reference)
- [Ejemplos](#ejemplos)
- [Solución de Problemas](#solución-de-problemas)

## 🏗️ Arquitectura

La implementación de WebSocket sigue una arquitectura en capas:

```
┌─────────────────────────────────────┐
│     Componentes (MesasScreen)      │
│  - Usa useMesasSocket hook          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Hook: useMesasSocket              │
│  - Maneja conexión y eventos        │
│  - Estado local de mesas            │
│  - Callbacks configurables          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Servicio: mesasService            │
│  - Métodos de Socket.IO             │
│  - Métodos de API REST              │
│  - Singleton del socket             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Context: SocketProvider (Opcional)│
│  - Socket global compartido         │
│  - Autenticación centralizada       │
└─────────────────────────────────────┘
```

## 📦 Instalación

Las dependencias ya están instaladas en el proyecto:

```json
{
  "socket.io-client": "^4.8.1",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

Si necesitas instalarlas manualmente:

```bash
npm install socket.io-client @react-native-async-storage/async-storage
# o
yarn add socket.io-client @react-native-async-storage/async-storage
```

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Para desarrollo local (iOS Simulator / Android Emulator)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Para Android Emulator (acceder a localhost de tu PC)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api

# Para dispositivo físico (reemplaza con la IP de tu PC)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api

# Para producción
EXPO_PUBLIC_API_BASE_URL=https://tu-api.com/api
```

### 2. Providers en App.js

El proyecto ya tiene configurados los providers necesarios:

```javascript
<SafeAreaProvider>
  <AuthProvider>
    <SocketProvider> {/* Socket global compartido (opcional) */}
      <AppContent />
    </SocketProvider>
  </AuthProvider>
</SafeAreaProvider>
```

## 🚀 Uso Básico

### Opción 1: Hook `useMesasSocket` (Recomendado)

```javascript
import { useMesasSocket } from '../hooks/useMesasSocket';

function MesasScreen() {
  const { 
    isConnected,
    mesas,
    setMesas,
    joinMesa,
    leaveMesa,
    getEstadoMesa
  } = useMesasSocket({
    // Callback cuando el servidor solicita refrescar datos
    onRefreshRequest: async () => {
      console.log('Refrescando mesas...');
      // Llamar a tu API REST aquí
    },
    // Callback para notificaciones
    onNotification: (notification) => {
      Alert.alert(notification.type, notification.message);
    }
  });

  return (
    <View>
      <Text>Estado: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</Text>
      {mesas.map(mesa => (
        <Text key={mesa.idMesa}>{mesa.nombreMesa}</Text>
      ))}
    </View>
  );
}
```

### Opción 2: Servicio `mesasService` (Bajo nivel)

```javascript
import mesasService from '../services/mesasService';

// Conectar
await mesasService.connect();

// Escuchar eventos
mesasService.onMesaCreada((payload) => {
  console.log('Nueva mesa:', payload.data);
});

mesasService.onMesaActualizada((payload) => {
  console.log('Mesa actualizada:', payload.data);
});

// Emitir eventos
mesasService.joinMesa(123);
mesasService.getEstadoMesa(123);

// Limpiar al desmontar
useEffect(() => {
  return () => {
    mesasService.removeAllListeners();
  };
}, []);
```

### Opción 3: Context Global `useSocket` (Para múltiples componentes)

```javascript
import { useSocket } from '../context/SocketContext';

function MiComponente() {
  const { socket, isConnected, emit, on, off } = useSocket();

  useEffect(() => {
    // Unirse a sala
    emit('join:mesas');

    // Escuchar evento
    const handleMesaCreada = (data) => {
      console.log('Mesa creada:', data);
    };
    
    on('mesa:creada', handleMesaCreada);

    return () => {
      off('mesa:creada', handleMesaCreada);
    };
  }, []);

  return (
    <Text>Conectado: {isConnected ? 'Sí' : 'No'}</Text>
  );
}
```

## 📚 API Reference

### Hook: useMesasSocket

```typescript
interface UseMesasSocketOptions {
  onRefreshRequest?: () => void | Promise<void>;
  onNotification?: (notification: Notification) => void;
}

interface UseMesasSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  reconnectAttempts: number;
  mesas: Mesa[];
  setMesas: (mesas: Mesa[]) => void;
  joinMesa: (mesaId: number) => void;
  leaveMesa: (mesaId: number) => void;
  getEstadoMesa: (mesaId: number) => void;
  getConnectedClients: () => void;
  reconnect: () => void;
}
```

### Eventos del Servidor (Escuchar)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `mesa:creada` | `{ message, data, timestamp }` | Nueva mesa creada |
| `mesa:actualizada` | `{ message, data, timestamp }` | Mesa actualizada |
| `mesa:eliminada` | `{ message, data: { id }, timestamp }` | Mesa eliminada |
| `mesa:estado-cambiado` | `{ message, data: { id, estado }, timestamp }` | Estado cambiado |
| `mesas:actualizar` | `{ message, timestamp }` | Refrescar todas las mesas |
| `notificacion` | `{ message, type, timestamp }` | Notificación general |
| `joined:mesas` | `{ message, timestamp }` | Confirmación de unión |
| `mesas:connected-clients` | `{ count, clients }` | Lista de clientes |

### Eventos del Cliente (Emitir)

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `join:mesas` | - | Unirse a sala general |
| `leave:mesas` | - | Salir de sala general |
| `join:mesa` | `{ mesaId }` | Unirse a mesa específica |
| `leave:mesa` | `{ mesaId }` | Salir de mesa específica |
| `mesas:get-connected-clients` | - | Solicitar clientes conectados |
| `mesa:get-estado` | `{ mesaId }` | Solicitar estado de mesa |

## 💡 Ejemplos

### Ejemplo 1: Notificaciones en tiempo real

```javascript
const { mesas } = useMesasSocket({
  onNotification: (notification) => {
    if (notification.type === 'error') {
      Alert.alert('Error', notification.message);
    } else {
      Toast.show(notification.message);
    }
  }
});
```

### Ejemplo 2: Unirse a una mesa específica

```javascript
const { joinMesa, leaveMesa } = useMesasSocket();

// Al abrir detalles de una mesa
const handleOpenMesa = (mesaId) => {
  joinMesa(mesaId);
};

// Al cerrar detalles
const handleCloseMesa = (mesaId) => {
  leaveMesa(mesaId);
};
```

### Ejemplo 3: Mostrar clientes conectados

```javascript
const { getConnectedClients } = useMesasSocket();
const [clients, setClients] = useState([]);

useEffect(() => {
  // Solicitar clientes
  getConnectedClients();

  // Escuchar respuesta
  const socket = mesasService.getSocket();
  socket?.on('mesas:connected-clients', (data) => {
    setClients(data.clients);
  });

  return () => {
    socket?.off('mesas:connected-clients');
  };
}, []);
```

### Ejemplo 4: Manejo de reconexión

```javascript
const { isConnected, reconnect, reconnectAttempts } = useMesasSocket();

if (!isConnected && reconnectAttempts > 0) {
  return (
    <View>
      <Text>Reconectando... Intento {reconnectAttempts}</Text>
      <Button title="Reintentar" onPress={reconnect} />
    </View>
  );
}
```

## 🔧 Solución de Problemas

### Problema: Socket no se conecta

**Solución:**

1. Verifica que el backend esté corriendo
2. Verifica la URL en `.env`
3. En Android Emulator, usa `10.0.2.2` en lugar de `localhost`
4. En dispositivo físico, usa la IP de tu PC
5. Verifica que no haya firewalls bloqueando el puerto

```bash
# Verificar conectividad
ping 192.168.1.100  # Reemplaza con tu IP
```

### Problema: No recibo eventos

**Solución:**

1. Verifica que estés en la sala correcta:
   ```javascript
   socket.emit('join:mesas');
   ```

2. Verifica los logs del backend para confirmar que emite eventos

3. Asegúrate de no remover listeners antes de tiempo

### Problema: Eventos duplicados

**Solución:**

Limpia los listeners en el cleanup del useEffect:

```javascript
useEffect(() => {
  const handleMesaCreada = (data) => {
    console.log(data);
  };
  
  socket?.on('mesa:creada', handleMesaCreada);
  
  return () => {
    socket?.off('mesa:creada', handleMesaCreada);
  };
}, []);
```

### Problema: Token no se envía

**Solución:**

Verifica que el token esté guardado en AsyncStorage:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('token');
console.log('Token:', token);
```

### Problema: Desconexión al pasar a background

**Solución:**

El hook ya maneja esto con AppState. Verifica los logs:

```javascript
AppState.addEventListener('change', (nextAppState) => {
  console.log('AppState:', nextAppState);
});
```

## 🎯 Mejores Prácticas

1. **Usa el hook `useMesasSocket`** en lugar del servicio directamente
2. **Limpia listeners** en el cleanup de useEffect
3. **Maneja errores** con try/catch y callbacks
4. **No emitas eventos** si no estás conectado (verifica `isConnected`)
5. **Usa el SocketProvider** para compartir socket entre múltiples componentes
6. **Implementa lógica de retry** para reconexiones fallidas
7. **Muestra indicadores de estado** al usuario (conectado/desconectado)
8. **Valida payloads** antes de procesar eventos

## 📖 Documentación Adicional

- [Documentación del Backend](./websocket-mesas.md)
- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs del cliente y servidor
2. Verifica la configuración de red
3. Consulta la documentación del backend
4. Revisa los ejemplos en esta guía

---

**Última actualización:** Octubre 2025
