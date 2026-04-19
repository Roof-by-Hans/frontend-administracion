import { useState, useEffect, useCallback } from "react";
import { logger } from "../utils/logger";
import Alert from "@blazejkustra/react-native-alert";

/**
 * Hook personalizado para operaciones CRUD estándar
 * Reduce la duplicación de código en screens de gestión
 *
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.fetchFn - Función para obtener todos los registros
 * @param {Function} options.deleteFn - Función para eliminar un registro (recibe id)
 * @param {string} options.entityName - Nombre de la entidad (para mensajes)
 * @param {Function} [options.transformData] - Función para transformar datos al cargar
 * @param {boolean} [options.autoLoad=true] - Cargar datos automáticamente al montar
 * @param {boolean} [options.showAlerts=true] - Mostrar alertas de éxito/error
 *
 * @returns {Object} Estado y funciones para CRUD
 *
 * @example
 * const {
 *   entities: productos,
 *   loading,
 *   error,
 *   loadEntities,
 *   handleAdd,
 *   handleEdit,
 *   handleDelete,
 *   confirmDelete,
 *   cancelDelete,
 *   closeModal,
 *   modalVisible,
 *   editingEntity,
 *   confirmModalVisible,
 * } = useCRUD({
 *   fetchFn: productosService.getProductos,
 *   deleteFn: productosService.eliminarProducto,
 *   entityName: "Producto",
 *   transformData: (data) => data.map(formatProducto),
 * });
 */
export function useCRUD({
  fetchFn,
  deleteFn,
  entityName,
  transformData,
  autoLoad = true,
  showAlerts = true,
}) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  /**
   * Carga todos los registros desde el servidor
   */
  const loadEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchFn();

            let data = response;
      if (response?.data) {
        data = response.data;
      }
      if (response?.success && response?.data) {
        data = response.data;
      }
      if (transformData && typeof transformData === "function") {
        data = transformData(data);
      }

      setEntities(data || []);
      logger.success(`${entityName}s cargados:`, data?.length || 0);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        `Error al cargar ${entityName.toLowerCase()}s`;
      setError(errorMsg);
      logger.error(`Error al cargar ${entityName}s:`, err);

      if (showAlerts) {
        Alert.alert("Error", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, entityName, transformData, showAlerts]);

    useEffect(() => {
    if (autoLoad) {
      loadEntities();
    }
  }, [autoLoad, loadEntities]);

  /**
   * Abre el modal para agregar un nuevo registro
   */
  const handleAdd = useCallback(() => {
    setEditingEntity(null);
    setModalVisible(true);
  }, []);

  /**
   * Abre el modal para editar un registro existente
   * @param {Object} entity - Registro a editar
   */
  const handleEdit = useCallback((entity) => {
    setEditingEntity(entity);
    setModalVisible(true);
  }, []);

  /**
   * Abre el modal de confirmación para eliminar un registro
   * @param {number|string} entityId - ID del registro a eliminar
   */
  const handleDelete = useCallback((entityId) => {
    setEntityToDelete(entityId);
    setConfirmModalVisible(true);
  }, []);

  /**
   * Cancela la eliminación y cierra el modal de confirmación
   */
  const cancelDelete = useCallback(() => {
    setEntityToDelete(null);
    setConfirmModalVisible(false);
  }, []);

  /**
   * Confirma y ejecuta la eliminación del registro
   */
  const confirmDelete = useCallback(async () => {
    if (!entityToDelete) return;

    try {
      setLoading(true);
      await deleteFn(entityToDelete);

            setEntities((prev) => prev.filter((e) => e.id !== entityToDelete));

      if (showAlerts) {
        Alert.alert("Éxito", `${entityName} eliminado correctamente.`);
      }
      logger.success(`${entityName} eliminado:`, entityToDelete);

      setConfirmModalVisible(false);
      setEntityToDelete(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        `Error al eliminar ${entityName.toLowerCase()}`;
      logger.error(`Error al eliminar ${entityName}:`, err);

      if (showAlerts) {
        Alert.alert("Error", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [entityToDelete, deleteFn, entityName, showAlerts]);

  /**
   * Cierra el modal de edición/creación
   */
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingEntity(null);
  }, []);

  /**
   * Actualiza manualmente la lista de entidades
   * Útil después de crear o actualizar un registro
   * @param {Function} updater - Función que recibe el estado anterior
   */
  const updateEntities = useCallback((updater) => {
    if (typeof updater === "function") {
      setEntities(updater);
    } else {
      setEntities(updater);
    }
  }, []);

  /**
   * Agrega una nueva entidad a la lista local
   * @param {Object} newEntity - Nueva entidad a agregar
   */
  const addEntity = useCallback((newEntity) => {
    setEntities((prev) => [...prev, newEntity]);
  }, []);

  /**
   * Actualiza una entidad existente en la lista local
   * @param {number|string} id - ID de la entidad
   * @param {Object} updatedEntity - Datos actualizados
   */
  const updateEntity = useCallback((id, updatedEntity) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedEntity } : e))
    );
  }, []);

  /**
   * Remueve una entidad de la lista local por ID
   * @param {number|string} id - ID de la entidad a remover
   */
  const removeEntity = useCallback((id) => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
        entities,
    loading,
    error,

        modalVisible,
    setModalVisible,
    editingEntity,
    setEditingEntity,
    closeModal,

        confirmModalVisible,
    setConfirmModalVisible,
    entityToDelete,
    loadEntities,
    handleAdd,
    handleEdit,
    handleDelete,
    cancelDelete,
    confirmDelete,
    setEntities,
    updateEntities,
    addEntity,
    updateEntity,
    removeEntity,
  };
}

export default useCRUD;
