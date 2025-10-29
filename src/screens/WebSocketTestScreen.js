import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useMesasSocket } from '../hooks/useMesasSocket';
import mesasService from '../services/mesasService';

/**
 * Pantalla de prueba para verificar la funcionalidad de WebSocket
 * Esta pantalla permite probar manualmente todas las características del WebSocket
 */
export default function WebSocketTestScreen() {
  const [logs, setLogs] = useState([]);
  const [connectedClients, setConnectedClients] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Usar el hook de WebSocket con callbacks de prueba
  const {
    isConnected,
    reconnectAttempts,
    mesas,
    joinMesa,
    leaveMesa,
    getEstadoMesa,
    getConnectedClients,
    reconnect
  } = useMesasSocket({
    onRefreshRequest: () => {
      addLog('📥 Servidor solicitó refrescar mesas', 'info');
    },
    onNotification: (notification) => {
      addLog(`🔔 Notificación: ${notification.message} (${notification.type})`, 'notification');
      Alert.alert('Notificación', notification.message);
    }
  });

  // Escuchar respuesta de clientes conectados
  useEffect(() => {
    const socket = mesasService.getSocket();
    
    if (socket) {
      const handleConnectedClients = (data) => {
        setConnectedClients(data);
        addLog(`👥 Clientes conectados: ${data.count}`, 'success');
      };

      socket.on('mesas:connected-clients', handleConnectedClients);

      return () => {
        socket.off('mesas:connected-clients', handleConnectedClients);
      };
    }
  }, []);

  // Log inicial de conexión
  useEffect(() => {
    if (isConnected) {
      addLog('✅ WebSocket conectado', 'success');
    } else {
      addLog('❌ WebSocket desconectado', 'error');
    }
  }, [isConnected]);

  // Log de cambios en mesas
  useEffect(() => {
    if (mesas.length > 0) {
      addLog(`📊 Mesas actuales: ${mesas.length}`, 'info');
    }
  }, [mesas.length]);

  const handleJoinMesa = () => {
    const mesaId = mesas[0]?.idMesa || 1;
    joinMesa(mesaId);
    addLog(`📥 Uniéndose a mesa ${mesaId}`, 'info');
  };

  const handleLeaveMesa = () => {
    const mesaId = mesas[0]?.idMesa || 1;
    leaveMesa(mesaId);
    addLog(`📤 Saliendo de mesa ${mesaId}`, 'info');
  };

  const handleGetEstadoMesa = () => {
    const mesaId = mesas[0]?.idMesa || 1;
    getEstadoMesa(mesaId);
    addLog(`📊 Solicitando estado de mesa ${mesaId}`, 'info');
  };

  const handleGetConnectedClients = () => {
    getConnectedClients();
    addLog('👥 Solicitando clientes conectados...', 'info');
  };

  const handleReconnect = () => {
    reconnect();
    addLog('🔄 Intentando reconectar...', 'info');
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'notification': return '#ff9800';
      default: return '#2196f3';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con estado */}
      <View style={styles.header}>
        <Text style={styles.title}>WebSocket Test Panel</Text>
        <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
          <Text style={styles.statusText}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </Text>
        </View>
        {reconnectAttempts > 0 && (
          <Text style={styles.reconnectText}>
            Intentos de reconexión: {reconnectAttempts}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mesas</Text>
          <Text style={styles.statValue}>{mesas.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Clientes</Text>
          <Text style={styles.statValue}>{connectedClients?.count || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Logs</Text>
          <Text style={styles.statValue}>{logs.length}</Text>
        </View>
      </View>

      {/* Botones de prueba */}
      <View style={styles.buttonsSection}>
        <Text style={styles.sectionTitle}>Acciones de Prueba</Text>
        
        <View style={styles.buttonRow}>
          <Button title="Unirse a Mesa" onPress={handleJoinMesa} disabled={!isConnected} />
          <Button title="Salir de Mesa" onPress={handleLeaveMesa} disabled={!isConnected} />
        </View>

        <View style={styles.buttonRow}>
          <Button title="Estado Mesa" onPress={handleGetEstadoMesa} disabled={!isConnected} />
          <Button title="Ver Clientes" onPress={handleGetConnectedClients} disabled={!isConnected} />
        </View>

        <View style={styles.buttonRow}>
          <Button title="Reconectar" onPress={handleReconnect} disabled={isConnected} />
          <Button title="Limpiar Logs" onPress={handleClearLogs} />
        </View>
      </View>

      {/* Clientes conectados */}
      {connectedClients && (
        <View style={styles.clientsSection}>
          <Text style={styles.sectionTitle}>Clientes Conectados ({connectedClients.count})</Text>
          <ScrollView style={styles.clientsList}>
            {connectedClients.clients.map((client, index) => (
              <View key={index} style={styles.clientItem}>
                <Text style={styles.clientText}>
                  🔌 {client.id.substring(0, 8)}... 
                  {client.userId && ` | User: ${client.userId}`}
                  {client.userRole && ` | Role: ${client.userRole}`}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Logs */}
      <View style={styles.logsSection}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Logs en Tiempo Real</Text>
        </View>
        <ScrollView style={styles.logsList}>
          {logs.slice().reverse().map((log, index) => (
            <View key={index} style={styles.logItem}>
              <Text style={[styles.logText, { color: getLogColor(log.type) }]}>
                [{log.timestamp}] {log.message}
              </Text>
            </View>
          ))}
          {logs.length === 0 && (
            <Text style={styles.emptyText}>No hay logs todavía</Text>
          )}
        </ScrollView>
      </View>

      {/* Mesas actuales */}
      <View style={styles.mesasSection}>
        <Text style={styles.sectionTitle}>Mesas Actuales ({mesas.length})</Text>
        <ScrollView horizontal style={styles.mesasList}>
          {mesas.map((mesa) => (
            <View key={mesa.idMesa} style={styles.mesaCard}>
              <Text style={styles.mesaName}>{mesa.nombreMesa || `Mesa ${mesa.idMesa}`}</Text>
              <Text style={styles.mesaId}>ID: {mesa.idMesa}</Text>
            </View>
          ))}
          {mesas.length === 0 && (
            <Text style={styles.emptyText}>No hay mesas cargadas</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8
  },
  connected: {
    backgroundColor: '#e8f5e9'
  },
  disconnected: {
    backgroundColor: '#ffebee'
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600'
  },
  reconnectText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666'
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3'
  },
  buttonsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8
  },
  clientsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150
  },
  clientsList: {
    maxHeight: 100
  },
  clientItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  clientText: {
    fontSize: 12,
    fontFamily: 'monospace'
  },
  logsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flex: 1,
    minHeight: 200
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  logsList: {
    flex: 1
  },
  logItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace'
  },
  mesasSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  mesasList: {
    maxHeight: 80
  },
  mesaCard: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  mesaName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  mesaId: {
    fontSize: 10,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 16,
    fontStyle: 'italic'
  }
});
