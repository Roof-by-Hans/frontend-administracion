import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';


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
    if (!socket || !isConnected) return;
    socket.emit('join:pedidos');

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
    };
    socket.on('pedido:creado', handlePedidoCreado);
    socket.on('pedido:actualizado', handlePedidoActualizado);
    socket.on('pedido:eliminado', handlePedidoEliminado);
    socket.on('pedido:cobrado', handlePedidoCobrado);
    socket.on('mesa:actualizada', handleMesaActualizada);
    socket.on('joined:pedidos', (data) => {
    });
    return () => {
      socket.off('pedido:creado', handlePedidoCreado);
      socket.off('pedido:actualizado', handlePedidoActualizado);
      socket.off('pedido:eliminado', handlePedidoEliminado);
      socket.off('pedido:cobrado', handlePedidoCobrado);
      socket.off('mesa:actualizada', handleMesaActualizada);
      socket.off('joined:pedidos');
      
      socket.emit('leave:pedidos');
    };
  }, [socket, isConnected, onPedidoCreado, onPedidoActualizado, onPedidoEliminado, onPedidoCobrado, onMesaActualizada]);

    
  const emitirPedidoCreado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('pedido:crear', pedido);
  }, [socket, isConnected]);

  
  const emitirPedidoActualizado = useCallback((pedido) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('pedido:actualizar', pedido);
  }, [socket, isConnected]);

  
  const emitirPedidoEliminado = useCallback((idPedido, idMesa, idGrupo) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('pedido:eliminar', { idPedido, idMesa, idGrupo });
  }, [socket, isConnected]);

  
  const emitirMesaCobrada = useCallback((idMesa, idGrupo, factura) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('pedido:cobrar', { idMesa, idGrupo, factura });
  }, [socket, isConnected]);

  
  const emitirMesaActualizada = useCallback((idMesa, estado) => {
    if (!socket || !isConnected) {
      return;
    }
    socket.emit('mesa:actualizar', { idMesa, estado });
  }, [socket, isConnected]);

  return {
    socket,
    isConnected: isConnected && isAuthenticated,
    emitirPedidoCreado,
    emitirPedidoActualizado,
    emitirPedidoEliminado,
    emitirMesaCobrada,
    emitirMesaActualizada
  };
}
