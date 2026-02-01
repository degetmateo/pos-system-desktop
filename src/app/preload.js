const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    ping: () => ipcRenderer.invoke('ping'),
    ip: () => ipcRenderer.invoke('get-local-ip'),
    sql: (query, values) => ipcRenderer.invoke('sql', query, values),

    on: (event, callback) => {
        ipcRenderer.on(event, (_, value) => callback(value));
        return () => ipcRenderer.removeAllListeners(event);
    }
});