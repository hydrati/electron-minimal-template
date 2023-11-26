import { type Plugin, Logger } from 'vite'
import { $, ProcessPromise, throttle, path, chalk } from './prelude'

const kLogTitle = chalk.bold.magentaBright('vite:electron')
const text = (t: string) => `${kLogTitle} ${t}`

const build = async (env = 'development', addArgs: string = '') => {
  await $`pkgroll --env.NODE_ENV=${env} ${addArgs}`
}

const factory = (): Plugin => {
  let daemon: ProcessPromise | null = null
  let debug = false

  const appDir = path.resolve(__dirname, '..', 'src', 'app')

  let logger: Logger

  const handleChange = throttle(async () => {
    logger?.info(text(chalk.bold.yellow('main-process reloading')), {
      timestamp: true,
    })

    logger?.info(text('killing application process...'), { timestamp: true })
    await daemon?.kill().catch((r) => {
      logger.error(text(`process error, ${r}`), { timestamp: true })
    })

    logger?.info(
      text(`building main-process source ${chalk.green('[development]')}`),
      { timestamp: true }
    )

    const s = performance.now()
    await build('development')
    const e = performance.now()

    logger?.info(
      text(`build complete in ${chalk.cyan(`${(e - s).toFixed(2)}ms`)}`),
      { timestamp: true }
    )

    logger?.info(text(`restarting application`), { timestamp: true })
    daemon = $`electron .`.nothrow()
    daemon.finally(async () => {
      logger?.info(
        text(
          chalk.red(`application process exit (code ${await daemon?.exitCode})`)
        ),
        {
          timestamp: true,
        }
      )
    })
  }, 5500)

  process.once('beforeExit', () => daemon?.kill())

  return {
    name: 'vite:electron',
    enforce: 'post',
    configResolved(config) {
      logger = config.logger
    },
    closeBundle: {
      async handler() {
        if (debug) {
          return
        }
        logger?.info(
          text(`building main-process source ${chalk.green('[production]')}`),
          { timestamp: true }
        )
        const s = performance.now()
        await build('production')
        const e = performance.now()
        logger?.info(
          text(`build complete in ${chalk.cyan(`${(e - s).toFixed(2)}ms`)}`),
          { timestamp: true }
        )
      },
      order: 'post',
      sequential: true,
    },

    async configureServer(server) {
      debug = true
      server.watcher.on('change', (f) => {
        const shouldRestart = path.resolve(f).startsWith(appDir)
        if (shouldRestart) {
          logger.info(text(`main-process source changed`), { timestamp: true })
          handleChange()
        }
      })

      handleChange()
    },
  } satisfies Plugin
}

export { factory as electron }
