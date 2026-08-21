const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rekey', {
  start: (secret) => ipcRenderer.invoke('rekey:start', secret),
  onProgress: (listener) => ipcRenderer.on('rekey:progress', (_event, value) => listener(value))
});
