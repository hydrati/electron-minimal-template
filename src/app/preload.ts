import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('app', {
  showDialog(message) {
    return ipcRenderer.invoke('show-dialog', message)
  },
} satisfies App.Remote)
