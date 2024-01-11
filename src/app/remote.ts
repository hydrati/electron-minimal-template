import { app, WebFrameMain, ipcMain } from 'electron'
import { showDialog } from './utils'

export const validateSender = (frame: WebFrameMain) => {
  if (app.isPackaged && new URL(frame.url).protocol != 'app:') {
    throw new Error('Invalid sender')
  }
}

export const registerRemote = () => {
  ipcMain.handle('show-dialog', (event, message: string) => {
    validateSender(event.senderFrame)
    return showDialog(message)
  })
}
