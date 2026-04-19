import api from './api';


const pedidosService = {
  
  async getPedidosMesa(idMesa) {
    return this.getPedidosLocal(`mesa-${idMesa}`);
  },

  
  async getPedidosGrupo(idGrupo) {
    return this.getPedidosLocal(`grupo-${idGrupo}`);
  },

  
  async crearPedido(pedido) {
    const pedidoConId = {
      ...pedido,
      id: `pedido-${Date.now()}`,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
    };
    const clave = pedido.idMesa ? `mesa-${pedido.idMesa}` : `grupo-${pedido.idGrupo}`;
        await this.guardarPedidoLocal(clave, pedidoConId);
    
        const verificar = this.getPedidosLocal(clave);
    return pedidoConId;
  },

  
  async eliminarPedido(idPedido, clave) {
    const pedidos = await this.getPedidosLocal(clave);
    const pedidosFiltrados = pedidos.filter(p => p.id !== idPedido);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`pedidos-${clave}`, JSON.stringify(pedidosFiltrados));
    }
  },

  
  async limpiarPedidos(clave) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`pedidos-${clave}`);
    }
  },

  
  getPedidosLocal(clave) {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    
    const key = `pedidos-${clave}`;
    const data = localStorage.getItem(key);
    const pedidos = data ? JSON.parse(data) : [];
    return pedidos;
  },

  
  async guardarPedidoLocal(clave, pedido) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const key = `pedidos-${clave}`;
    const pedidos = this.getPedidosLocal(clave);
    pedidos.push(pedido);
    localStorage.setItem(key, JSON.stringify(pedidos));
  },

  
  calcularTotal(pedidos) {
    return pedidos.reduce((total, pedido) => {
      const subtotal = pedido.productos.reduce((sum, p) => {
        return sum + (p.cantidad * p.precioUnitario);
      }, 0);
      return total + subtotal;
    }, 0);
  },

  
  transferirPedidosAGrupo(mesasIds, grupoId) {
    if (typeof localStorage === 'undefined') {
      return 0;
    }

    let pedidosATransferir = [];
    for (const mesaId of mesasIds) {
      const claveMesa = `mesa-${mesaId}`;
      const pedidosMesa = this.getPedidosLocal(claveMesa);
      
      if (pedidosMesa.length > 0) {
        pedidosATransferir = [...pedidosATransferir, ...pedidosMesa];
      }
    }
    
    if (pedidosATransferir.length > 0) {
            const claveGrupo = `grupo-${grupoId}`;
      localStorage.setItem(`pedidos-${claveGrupo}`, JSON.stringify(pedidosATransferir));
      
            for (const mesaId of mesasIds) {
        const claveMesa = `mesa-${mesaId}`;
        this.limpiarPedidos(claveMesa);
      }
    }
    
    return pedidosATransferir.length;
  },
};

export default pedidosService;
