import { BrowserWindow, protocol, app } from 'electron'
import { readFile } from 'fs/promises'

import { resolve } from 'path'
import mime from 'mime/lite'

const distPath = resolve(app.getAppPath(), 'dist')

const bootstrap = async () => {
  if (app.isPackaged) {
    protocol.registerSchemesAsPrivileged([
      {
        privileges: {
          allowServiceWorkers: true,
          bypassCSP: true,
          corsEnabled: true,
          secure: true,
          standard: true,
          stream: true,
          supportFetchAPI: true,
        },
        scheme: 'app',
      },
    ])

    const spaEntry = resolve(distPath, 'index.html')

    await app.whenReady()
    protocol.handle('app', async (request) => {
      if (request.method != 'GET') {
        return new Response(null, { status: 403 })
      }

      const url = new URL(request.url)
      const pathname = decodeURIComponent(url.pathname)

      let realPath = resolve(distPath, '.' + pathname)

      if (pathname == '/') {
        realPath = spaEntry
      }

      try {
        const content = await readFile(realPath)

        return new Response(content, {
          status: 200,
          headers: {
            'content-encoding': 'utf8',
            'content-type':
              mime.getType(realPath) || 'application/octet-stream',
          },
        })
      } catch {
        return new Response(null, {
          status: 500,
        })
      }
    })
  }

  handleReady()
}

let window: BrowserWindow

const handleReady = async () => {
  await app.whenReady()

  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(distPath, 'app', 'preload.cjs'),
    },
  })

  window.loadURL(!app.isPackaged ? 'http://localhost:5173/' : 'app://./')

  app.on('window-all-closed', () => app.quit())
}

bootstrap()
