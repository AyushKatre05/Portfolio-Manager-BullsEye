const isDevelopment = process.env.NODE_ENV === "development"
const isLoggingEnabled =
  isDevelopment || process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true"

export const logger = {
  log: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.log(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.info(...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isLoggingEnabled) {
      console.warn(...args)
    }
  },

  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args)
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  group: (label: string, fn: () => void) => {
    if (isLoggingEnabled) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
}
