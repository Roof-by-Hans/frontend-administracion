import api from './api';

/**
 * Servicio para gestionar pedidos temporales (antes de generar factura)
 * Los pedidos se almacenan localmente hasta que se cobra la mesa
 */
const pedidosService = {
  /**
   * Obtener pedidos activos de una mesa
   * @param {number} idMesa - ID de la mesa
   * @returns {Promise<Array>} - Lista de pedidos activos
   */
  async getPedidosMesa(idMesa) {    return this.getPedidosLocal(`mesa-${idMesa}`);
  },

  /**
   * Obtener pedidos activos de un grupo
   * @param {number} idGrupo - ID del grupo
   * @returns {Promise<Array>} - Lista de pedidos activos
   */
  async getPedidosGrupo(idGrupo) {    return this.getPedidosLocal(`grupo-${idGrupo}`);
  },

  /**
   * Crear un nuevo pedido temporal
   * @param {Object} pedido - Datos del pedido
   * @returns {Promise<Object>} - Pedido creado
   */
  async crearPedido(pedido) {
    const pedidoConId = {
      ...pedido,
      id: `pedido-${Date.now()}`,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
    };    const clave = pedido.idMesa ? `mesa-${pedido.idMesa}` : `grupo-${pedido.idGrupo}`;
        await this.guardarPedidoLocal(clave, pedidoConId);
    
        const verificar = this.getPedidosLocal(clave);
    return pedidoConId;
  },

  /**
   * Eliminar un pedido
   * @param {string} idPedido - ID del pedido
   * @param {string} clave - Clave de mesa o grupo
   */
  async eliminarPedido(idPedido, clave) {
    const pedidos = await this.getPedidosLocal(clave);
    const pedidosFiltrados = pedidos.filter(p => p.id !== idPedido);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`pedidos-${clave}`, JSON.stringify(pedidosFiltrados));
    }
  },

  /**
   * Limpiar todos los pedidos de una mesa/grupo
   * @param {string} clave - Clave de mesa o grupo
   */
  async limpiarPedidos(clave) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`pedidos-${clave}`);
    }
  },

  /**
   * Obtener pedidos del almacenamiento local
   * @param {string} clave - Clave de mesa o grupo
   * @returns {Array} - Lista de pedidos
   */
  getPedidosLocal(clave) {
    if (typeof localStorage === 'undefined') {
      console.warn('[WARN] localStorage no disponible');
      return [];
    }
    
    const key = `pedidos-${clave}`;
    const data = localStorage.getItem(key);
    const pedidos = data ? JSON.parse(data) : [];
    return pedidos;
  },

  /**
   * Guardar pedido en almacenamiento local
   * @param {string} clave - Clave de mesa o grupo
   * @param {Object} pedido - Pedido a guardar
   */
  async guardarPedidoLocal(clave, pedido) {
    if (typeof localStorage === 'undefined') {
      console.error('[WARN] localStorage no disponible');
      return;
    }

    const key = `pedidos-${clave}`;
    const pedidos = this.getPedidosLocal(clave);
    pedidos.push(pedido);
    localStorage.setItem(key, JSON.stringify(pedidos));
  },

  /**
   * Calcular total de pedidos
   * @param {Array} pedidos - Lista de pedidos
   * @returns {number} - Total calculado
   */
  calcularTotal(pedidos) {
    return pedidos.reduce((total, pedido) => {
      const subtotal = pedido.productos.reduce((sum, p) => {
        return sum + (p.cantidad * p.precioUnitario);
      }, 0);
      return total + subtotal;
    }, 0);
  },

  /**
   * Transferir pedidos de mesas individuales a un grupo
   * @param {Array<number>} mesasIds - IDs de las mesas
   * @param {number} grupoId - ID del grupo
   * @returns {number} - Cantidad de pedidos transferidos
   */
  transferirPedidosAGrupo(mesasIds, grupoId) {
    if (typeof localStorage === 'undefined') {
      console.error('[WARN] localStorage no disponible');
      return 0;
    }

    let pedidosATransferir = [];    for (const mesaId of mesasIds) {
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
