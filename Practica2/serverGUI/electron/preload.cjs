const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Enviar órdenes a Node.js
  startServer: (filePath) => ipcRenderer.send('start-java-server', { filePath }),
  stopJava: () => ipcRenderer.send('stop-java'),

  // Recibir datos de Node.js
  onJavaLog: (callback) => ipcRenderer.on('java-log', (_event, value) => callback(value)),
  onJavaFinished: (callback) => ipcRenderer.on('java-process-closed', (_event, code) => callback(code)),
});