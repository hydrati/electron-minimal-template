import { dialog, BrowserWindow } from 'electron'

export const showDialog = async (message: string) => {
  await dialog.showMessageBox({
    type: 'info',
    title: 'App',
    message: `Message: ${message}`,
  })
}
