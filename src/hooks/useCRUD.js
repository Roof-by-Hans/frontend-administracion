import { useState, useEffect, useCallback } from "react";
import { logger } from "../utils/logger";
import Alert from "@blazejkustra/react-native-alert";


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

  
  const handleAdd = useCallback(() => {
    setEditingEntity(null);
    setModalVisible(true);
  }, []);

  
  const handleEdit = useCallback((entity) => {
    setEditingEntity(entity);
    setModalVisible(true);
  }, []);

  
  const handleDelete = useCallback((entityId) => {
    setEntityToDelete(entityId);
    setConfirmModalVisible(true);
  }, []);

  
  const cancelDelete = useCallback(() => {
    setEntityToDelete(null);
    setConfirmModalVisible(false);
  }, []);

  
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

  
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingEntity(null);
  }, []);

  
  const updateEntities = useCallback((updater) => {
    if (typeof updater === "function") {
      setEntities(updater);
    } else {
      setEntities(updater);
    }
  }, []);

  
  const addEntity = useCallback((newEntity) => {
    setEntities((prev) => [...prev, newEntity]);
  }, []);

  
  const updateEntity = useCallback((id, updatedEntity) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedEntity } : e))
    );
  }, []);

  
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
