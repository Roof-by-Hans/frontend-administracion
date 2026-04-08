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

    useEffect(() => {
    if (!socket || !isConnected) return;    socket.emit('join:pedidos');

        const handlePedidoCreado = (data) => {
      if (onPedidoCreado) {
        onPedidoCreado(data);
      }
    };

        const handlePedidoActualizado = (data) => {
      if (onPedidoActualizado) {
        onPedidoActualizado(data);
      }
    };

        const handlePedidoEliminado = (data) => {
      if (onPedidoEliminado) {
        onPedidoEliminado(data);
      }
    };

        const handlePedidoCobrado = (data) => {
      if (onPedidoCobrado) {
        onPedidoCobrado(data);
      }
    };

        const handleMesaActualizada = (data) => {
      if (onMesaActualizada) {
        onMesaActualizada(data);
      }
    };    socket.on('pedido:creado', handlePedidoCreado);
    socket.on('pedido:actualizado', handlePedidoActualizado);
    socket.on('pedido:eliminado', handlePedidoEliminado);
    socket.on('pedido:cobrado', handlePedidoCobrado);
    socket.on('mesa:actualizada', handleMesaActualizada);    socket.on('joined:pedidos', (data) => {
    });    return () => {
      socket.off('pedido:creado', handlePedidoCreado);
      socket.off('pedido:actualizado', handlePedidoActualizado);
      socket.off('pedido:eliminado', handlePedidoEliminado);
      socket.off('pedido:cobrado', handlePedidoCobrado);
      socket.off('mesa:actualizada', handleMesaActualizada);
      socket.off('joined:pedidos');
      
      socket.emit('leave:pedidos');
    };
  }, [socket, isConnected, onPedidoCreado, onPedidoActualizado, onPedidoEliminado, onPedidoCobrado, onMesaActualizada]);

    /**
   * Emitir evento de pedido creado
   * El backend recibirá esto y lo reenviará a todos los clientes conectados
   */
  const emitirPedidoCreado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      console.warn('[WARN] Socket no conectado, no se puede emitir evento');
      return;
    }
    socket.emit('pedido:crear', pedido);
  }, [socket, isConnected]);

  /**
   * Emitir evento de pedido actualizado
   */
  const emitirPedidoActualizado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      console.warn('[WARN] Socket no conectado, no se puede emitir evento');
      return;
    }
    socket.emit('pedido:actualizar', pedido);
  }, [socket, isConnected]);

  /**
   * Emitir evento de pedido eliminado
   */
  const emitirPedidoEliminado = useCallback((idPedido, idMesa, idGrupo) => {
    if (!socket || !isConnected) {
      console.warn('[WARN] Socket no conectado, no se puede emitir evento');
      return;
    }
    socket.emit('pedido:eliminar', { idPedido, idMesa, idGrupo });
  }, [socket, isConnected]);

  /**
   * Emitir evento de mesa cobrada
   */
  const emitirMesaCobrada = useCallback((idMesa, idGrupo, factura) => {
    if (!socket || !isConnected) {
      console.warn('[WARN] Socket no conectado, no se puede emitir evento');
      return;
    }
    socket.emit('pedido:cobrar', { idMesa, idGrupo, factura });
  }, [socket, isConnected]);

  /**
   * Emitir evento de actualización de estado de mesa
   */
  const emitirMesaActualizada = useCallback((idMesa, estado) => {
    if (!socket || !isConnected) {
      console.warn('[WARN] Socket no conectado, no se puede emitir evento');
      return;
    }
    socket.emit('mesa:actualizar', { idMesa, estado });
  }, [socket, isConnected]);

  return {
    socket,
    isConnected: isConnected && isAuthenticated,    emitirPedidoCreado,
    emitirPedidoActualizado,
    emitirPedidoEliminado,
    emitirMesaCobrada,
    emitirMesaActualizada
  };
}
