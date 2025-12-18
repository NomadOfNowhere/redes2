const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar órdenes a Node.js
  startClient: (name) => ipcRenderer.send('start-java-client', { name }),
  stopJava: () => ipcRenderer.send('stop-java'),
  sendToJava: (message) => ipcRenderer.send('send-to-java', message),

  // Recibir datos de Node.js
  onJavaLog: (callback) => ipcRenderer.on('java-log', (_event, value) => callback(value)),

  onJavaFinished: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('java-process-closed', subscription);
    return () => ipcRenderer.removeListener('java-process-closed', subscription);
  },

  onRoomsUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('rooms-updated', subscription);
    return () => ipcRenderer.removeListener('rooms-updated', subscription);
  },

  onUserlistUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('users-updated', subscription);
    return () => ipcRenderer.removeListener('users-updated', subscription);
  },

  onMyRoomsUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('myrooms-updated', subscription);
    return () => ipcRenderer.removeListener('myrooms-updated', subscription);
  },

  onConnectionSuccess: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('connection-success', subscription);
    return () => ipcRenderer.removeListener('connection-success', subscription);
  },

  onConnectionStatus: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('connection-status', subscription);
    return () => ipcRenderer.removeListener('connection-status', subscription);
  },

  onMessageReceived: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('message-received', subscription);
    return () => ipcRenderer.removeListener('message-received', subscription);
    },

});