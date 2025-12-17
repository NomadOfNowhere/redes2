const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar órdenes a Node.js
  startClient: (name) => ipcRenderer.send('start-java-client', { name }),
  stopJava: () => ipcRenderer.send('stop-java'),
  sendToJava: (message) => ipcRenderer.send('send-to-java', message),

  // Recibir datos de Node.js
  onJavaLog: (callback) => ipcRenderer.on('java-log', (_event, value) => callback(value)),
  onJavaFinished: (callback) => ipcRenderer.on('java-process-closed', (_event, code) => callback(code)),

  onRoomsUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('rooms-updated', subscription);
    return () => {
      ipcRenderer.removeListener('rooms-updated', subscription);
    };
  },

  onUserlistUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('users-updated', subscription);
    return () => {
      ipcRenderer.removeListener('users-updated', subscription);
    };
  },

  onMyRoomsUpdated: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('myrooms-updated', subscription);
    return () => {
      ipcRenderer.removeListener('myrooms-updated', subscription);
    };
  },
});