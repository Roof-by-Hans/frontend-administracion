import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Hook para manejar eventos de pedidos en tiempo real
 * Escucha cambios en pedidos y notifica a los componentes
 * 
 * Eventos que emite el backend:
 * - pedido:creado - Cuando se crea un nuevo pedido
 * - pedido:actualizado - Cuando se modifica un pedido
 * - pedido:eliminado - Cuando se elimina un pedido
 * - pedido:cobrado - Cuando se cobra una mesa (factura generada)
 * 
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onPedidoCreado - Callback cuando se crea un pedido
 * @param {Function} options.onPedidoActualizado - Callback cuando se actualiza un pedido
 * @param {Function} options.onPedidoEliminado - Callback cuando se elimina un pedido
 * @param {Function} options.onPedidoCobrado - Callback cuando se cobra una mesa
 * @param {Function} options.onMesaActualizada - Callback cuando cambia el estado de una mesa
 * @returns {Object} - Socket y funciones para emitir eventos
 */
export function usePedidosSocket(options = {}) {
  const { socket, isConnected, isAuthenticated } = useSocket();

  const {
    onPedidoCreado,
    onPedidoActualizado,
    onPedidoEliminado,
    onPedidoCobrado,
    onMesaActualizada
  } = options;

  // ==================== ESCUCHAR EVENTOS ====================

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🎧 Suscribiendo a eventos de pedidos...');

    // Unirse a la sala de pedidos para recibir actualizaciones
    socket.emit('join:pedidos');

    // Evento: Nuevo pedido creado
    const handlePedidoCreado = (data) => {
      console.log('🆕 Pedido creado:', data);
      
      if (onPedidoCreado) {
        onPedidoCreado(data);
      }
    };

    // Evento: Pedido actualizado (editado)
    const handlePedidoActualizado = (data) => {
      console.log('✏️ Pedido actualizado:', data);
      
      if (onPedidoActualizado) {
        onPedidoActualizado(data);
      }
    };

    // Evento: Pedido eliminado
    const handlePedidoEliminado = (data) => {
      console.log('🗑️ Pedido eliminado:', data);
      
      if (onPedidoEliminado) {
        onPedidoEliminado(data);
      }
    };

    // Evento: Mesa cobrada (factura generada)
    const handlePedidoCobrado = (data) => {
      console.log('💰 Mesa cobrada:', data);
      
      if (onPedidoCobrado) {
        onPedidoCobrado(data);
      }
    };

    // Evento: Estado de mesa actualizado
    const handleMesaActualizada = (data) => {
      console.log('🔄 Mesa actualizada:', data);
      
      if (onMesaActualizada) {
        onMesaActualizada(data);
      }
    };

    // Registrar listeners
    socket.on('pedido:creado', handlePedidoCreado);
    socket.on('pedido:actualizado', handlePedidoActualizado);
    socket.on('pedido:eliminado', handlePedidoEliminado);
    socket.on('pedido:cobrado', handlePedidoCobrado);
    socket.on('mesa:actualizada', handleMesaActualizada);

    // Confirmación de unión a sala
    socket.on('joined:pedidos', (data) => {
      console.log('✅ Unido a sala de pedidos:', data);
    });

    // Cleanup: Remover listeners y salir de sala
    return () => {
      console.log('🔌 Desuscribiendo de eventos de pedidos...');
      
      socket.off('pedido:creado', handlePedidoCreado);
      socket.off('pedido:actualizado', handlePedidoActualizado);
      socket.off('pedido:eliminado', handlePedidoEliminado);
      socket.off('pedido:cobrado', handlePedidoCobrado);
      socket.off('mesa:actualizada', handleMesaActualizada);
      socket.off('joined:pedidos');
      
      socket.emit('leave:pedidos');
    };
  }, [socket, isConnected, onPedidoCreado, onPedidoActualizado, onPedidoEliminado, onPedidoCobrado, onMesaActualizada]);

  // ==================== FUNCIONES PARA EMITIR EVENTOS ====================

  /**
   * Emitir evento de pedido creado
   * El backend recibirá esto y lo reenviará a todos los clientes conectados
   */
  const emitirPedidoCreado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento');
      return;
    }

    console.log('📤 Emitiendo pedido:crear:', pedido);
    socket.emit('pedido:crear', pedido);
  }, [socket, isConnected]);

  /**
   * Emitir evento de pedido actualizado
   */
  const emitirPedidoActualizado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento');
      return;
    }

    console.log('📤 Emitiendo pedido:actualizar:', pedido);
    socket.emit('pedido:actualizar', pedido);
  }, [socket, isConnected]);

  /**
   * Emitir evento de pedido eliminado
   */
  const emitirPedidoEliminado = useCallback((idPedido, idMesa, idGrupo) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento');
      return;
    }

    console.log('📤 Emitiendo pedido:eliminar:', { idPedido, idMesa, idGrupo });
    socket.emit('pedido:eliminar', { idPedido, idMesa, idGrupo });
  }, [socket, isConnected]);

  /**
   * Emitir evento de mesa cobrada
   */
  const emitirMesaCobrada = useCallback((idMesa, idGrupo, factura) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento');
      return;
    }

    console.log('📤 Emitiendo pedido:cobrar:', { idMesa, idGrupo, factura });
    socket.emit('pedido:cobrar', { idMesa, idGrupo, factura });
  }, [socket, isConnected]);

  /**
   * Emitir evento de actualización de estado de mesa
   */
  const emitirMesaActualizada = useCallback((idMesa, estado) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento');
      return;
    }

    console.log('📤 Emitiendo mesa:actualizar:', { idMesa, estado });
    socket.emit('mesa:actualizar', { idMesa, estado });
  }, [socket, isConnected]);

  return {
    socket,
    isConnected: isConnected && isAuthenticated,
    // Funciones para emitir eventos
    emitirPedidoCreado,
    emitirPedidoActualizado,
    emitirPedidoEliminado,
    emitirMesaCobrada,
    emitirMesaActualizada
  };
}
