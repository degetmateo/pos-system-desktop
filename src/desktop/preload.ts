import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
  ip: () => ipcRenderer.invoke('get-local-ip'),
  on: (event: string, callback: (value: any) => void) => {
    ipcRenderer.on(event, (_e, val) => callback(val));
    return () => ipcRenderer.removeAllListeners(event);
  },
});

