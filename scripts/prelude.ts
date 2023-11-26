import { $, os } from 'zx'

$.verbose = true

if (os.platform() == 'win32') {
  // Windows compatibility
  $.shell = 'powershell'
  $.prefix = ''
}

export const throttle = <
  T extends (...args: any[]) => void | PromiseLike<void>,
>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let e = false

  const f = () => {
    e = false
  }

  return ((...args: any[]): void => {
    if (e) {
      return
    } else {
      e = true
      setTimeout(() => {
        const r = fn(...args)
        if (typeof r?.then == 'function') {
          r.then(f, f)
        } else {
          f()
        }
      }, delay)
    }
  }) as T
}

export * from 'zx'
