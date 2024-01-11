import { protocol, app } from 'electron'
import { createReadStream, existsSync } from 'fs'

import { resolve } from 'path'
import mime from 'mime/lite'

export const distPath = resolve(app.getAppPath(), 'dist')
const spaEntry = resolve(distPath, 'index.html')

const handleAppRequest = async (request: Request) => {
  if (request.method != 'GET') {
    return new Response(null, { status: 403 })
  }

  const url = new URL(request.url)
  const pathname = decodeURIComponent(url.pathname)
  const realPath =
    pathname == '/' ? spaEntry : resolve(distPath, '.' + pathname)

  if (!existsSync(realPath)) return new Response(null, { status: 404 })

  try {
    const file = createReadStream(realPath)
    return new Response(
      new ReadableStream({
        start(controller) {
          file.on('data', (chunk) => controller.enqueue(chunk))
          file.on('close', () =>
            file.errored ? controller.error(file.errored) : controller.close()
          )
        },
      }),
      {
        headers: {
          'content-encoding': 'utf8',
          'content-type': mime.getType(realPath) || 'application/octet-stream',
        },
      }
    )
  } catch (e: any) {
    return new Response(e.toString(), { status: 500 })
  }
}

export const registerAppProtocol = () => {
  protocol.registerSchemesAsPrivileged([
    {
      privileges: {
        allowServiceWorkers: true,
        bypassCSP: false,
        corsEnabled: true,
        secure: true,
        standard: true,
        stream: true,
        supportFetchAPI: true,
      },
      scheme: 'app',
    },
  ])

  app.whenReady().then(() => {
    protocol.handle('app', handleAppRequest)
  })
}
